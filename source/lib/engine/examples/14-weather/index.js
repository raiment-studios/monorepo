import React from 'react';
import { ReadingFrame } from '../../../react-ex';
import * as core from '../../../core';
import * as THREE from 'three';
import {
    useEngine,
    EngineFrame,
    Grid,
    OrbitCamera,
    GroundPlane,
    HeightMap,
    PathfinderGraph,
    VoxelSprite,
    updatePosition,
    updateBoxCollision,
    WeatherSystem,
    DayNightLighting,
} from '../..';
import { Forest } from './forest.js';
import assets from 'glob:$(MONOREPO_ROOT)/source;assets/proto/**/*{.png,.asset.yaml}';
import { LookupTable } from './lookup_table';
import { initTileLookupTable } from './tiles';

const assetURL = Object.fromEntries(assets.matches.map(({ url }) => [url.split('/').pop(), url]));

export default function () {
    return (
        <ReadingFrame>
            <h1>Weather</h1>
            <div>
                <EngineView />
            </div>
        </ReadingFrame>
    );
}

const db = {
    colors: new LookupTable(),
    tiles: initTileLookupTable(),
};

const TILE = db.tiles.keys();

const objectList = new LookupTable();
objectList.add({});

function makeHeightMap(rng) {
    const S = 192;
    const simplex1 = core.makeSimplexNoise();
    const simplex2 = core.makeSimplexNoise();
    const simplex3 = core.makeSimplexNoise();

    const heightMap = new HeightMap({
        offset: [-256 / 2, -256 / 2, 0],
        scale: 256,
        segments: 256,
        layers: {
            tile: Int8Array,
            object: Int16Array,

            // TODO: split this into temperature + moisture
            snow: Float32Array,
        },
        heightFunc: (sx, sy) => {
            const nx = sx + 5 * simplex1.noise2D((4 * sx) / S, (4 * sy) / S);
            const ny = sy + 5 * simplex2.noise2D((4 * sx) / S, (4 * sy) / S);
            const a = 1 + simplex3.noise2D(nx / S, ny / S) / 2;
            return 0.1 * Math.pow(1.1 * a, 1.5);
        },
    });

    const tileArray = heightMap.getLayerArray('tile');
    const objectArray = heightMap.getLayerArray('object');
    const snowArray = heightMap.getLayerArray('snow');

    tileArray.fill(TILE.GRASS);
    objectArray.fill(0);
    snowArray.fill(0);

    heightMap.colorFunc = function (sx, sy, wz, si) {
        const tile = db.tiles.get(tileArray[si]);
        const rgb = tile.colorFunc(sx, sy);

        const s = core.clamp(snowArray[si], 0.0, 1.0);
        rgb[0] = rgb[0] * (1 - s) + s * 1.0;
        rgb[1] = rgb[1] * (1 - s) + s * 1.0;
        rgb[2] = rgb[2] * (1 - s) + s * 1.0;

        return rgb;
    };

    heightMap.updateMesh();

    return heightMap;
}

function EngineView() {
    const engine = useEngine(() => {
        const rng = core.makeRNG();

        const heightMap = makeHeightMap(rng);
        const tileArray = heightMap.getLayerArray('tile');
        const snowArray = heightMap.getLayerArray('snow');

        engine.events.on('actor.postinit', ({ actor }) => {
            const shape = actor.groundCollisionShape;
            if (!shape) {
                return;
            }

            const [sx, sy] = heightMap.coordW2S(actor.position.x, actor.position.y);
            core.iterateCircle2D(sx, sy, 2 * shape.width, (sx, sy) => {
                const si = heightMap.coordS2I(sx, sy);
                if (si !== -1) {
                    tileArray[si] = TILE.GRASS_UNWALKABLE;
                    heightMap.updateSegment(sx, sy);
                }
            });
        });

        engine.actors.push(
            new Grid(),
            new OrbitCamera({ radius: 92, periodMS: 72000, offsetZ: 16 }), //
            new DayNightLighting(),
            new GroundPlane(),
            heightMap
        );

        engine.opt.heightMap = heightMap;

        engine.opt.walkableS = function (sx, sy) {
            const si = sy * heightMap.segments + sx;
            if (si === -1) {
                return false;
            }
            const tileIndex = tileArray[si];
            const tile = db.tiles.get(tileIndex);
            return tile.walkable;
        };

        engine.opt.generateRandomWalkablePosition = function () {
            const walkable = (wx, wy) => {
                const si = heightMap.coordW2I(wx, wy);
                if (si === -1) {
                    return false;
                }
                const tileIndex = tileArray[si];
                return tileIndex === TILE.GRASS;
            };

            let worldX, worldY;
            do {
                worldX = rng.rangei(0, heightMap.segments);
                worldY = rng.rangei(0, heightMap.segments);
            } while (!walkable(worldX, worldY));

            return [worldX, worldY];
        };

        engine.opt.generateRandomWalkablePosition2 = function () {
            const [worldX, worldY] = engine.opt.generateRandomWalkablePosition();
            return new THREE.Vector3(worldX, worldY, 0.0);
        };

        engine.opt.generatePathfindingBehavior = function (actor) {
            return makePathfindBehaviorForHeightmap(heightMap, actor);
        };

        engine.addSequence(function* () {
            yield 10;
            engine.journal.message('Welcome to Galthea, the world of Kestrel');
            yield 2 * 60;
            engine.journal.message('Your quest is to seek out Tristan.');
        });

        // Use a sequence (i.e. a script run across multiple frames) to ensure the
        // initialization order.
        engine.addSequence(function* () {
            // Stage 1
            engine.actors.push(
                new Forest({ count: 40 }), //
                new WeatherSystem()
            );
            yield;

            // Stage 2
            // After the forest is initialized, add the sprites as they depend on
            // the forest being placed and unwalkable areas being defined.
            engine.actors.push(
                ...core.generate(10, (i) => {
                    let [worldX, worldY] = engine.opt.generateRandomWalkablePosition();

                    return new VoxelSprite({
                        url: assetURL[
                            i === 0
                                ? 'kestrel.png'
                                : rng.select([
                                      'wizard.png',
                                      'ranger.png',
                                      'ranger.png',
                                      'ranger.png',
                                      'ranger2.png',
                                      'ranger2.png',
                                      'ranger2.png',
                                      'king.png',
                                  ])
                        ],
                        flags: {
                            billboard: true,
                            pinToGroundHeight: true,
                        },
                        worldX,
                        worldY,
                        stateMachine: function ({ actor }) {
                            return {
                                _start: function* () {
                                    return 'pathfind.target';
                                },
                                ...makePathfindBehaviorForHeightmap(heightMap, actor),
                            };
                        },
                    });
                })
            );

            yield;

            const weatherSystem = engine.actors.selectByID('weather_system');
            engine.actors.push({
                update: ({ frameNumber }) => {
                    if (frameNumber % 4 == 0)
                        for (let i = 0; i < 2500; i++) {
                            const sx = rng.rangei(0, 256);
                            const sy = rng.rangei(0, 256);
                            const si = sy * heightMap.segments + sx;
                            const v0 = snowArray[si];
                            let v1;
                            if (weatherSystem.condition === 'snow') {
                                v1 = Math.min(v0 + 0.2, 2.0);
                            } else {
                                v1 = Math.max(v0 - 0.2, 0.0);
                            }
                            if (v0 !== v1) {
                                snowArray[si] = v1;
                                heightMap.updateSegment(sx, sy);
                            }
                        }
                },
            });

            yield;

            engine.actors.push(new Updater(heightMap));
            return;
        });
    });

    return <EngineFrame engine={engine} recorder="three" />;
}

/**
 * A reusable set of state machine states for pathfinding.
 *
 * Avoids binding to the Actor or Heightmap classes and instead depends on
 * only the PathfinderGraph object and a current position callback.
 */
function makePathfindBehavior({
    // Required
    pathfinder,
    positionFunc,

    // Optional
    prefix = 'pathfind.', //
    MAX_SEARCH_DISTANCE = 100,
    rng = core.makeRNG(),

    onMove,
    moveDelay = 0,
}) {
    const prefixName = (s) => `${prefix}${s}`;
    const STATE_TARGET = prefixName('target');
    const STATE_MOVE = prefixName('move');
    const STATE_MOVELOOP = prefixName('moveLoop');

    return {
        [STATE_TARGET]: function* () {
            // "Think" for a few frames
            yield rng.rangei(5, 10);

            // Choose a random point to target and retry until it
            // is a valid destination
            const ex = rng.rangei(0, pathfinder.width);
            const ey = rng.rangei(0, pathfinder.height);
            if (!pathfinder.walkable(ex, ey)) {
                return STATE_TARGET;
            }
            return [STATE_MOVELOOP, ex, ey];
        },
        [STATE_MOVELOOP]: function* (ex, ey, doneState = STATE_TARGET) {
            // Use the current position as the starting point
            const [sx, sy] = positionFunc();
            if (!pathfinder.walkable(sx, sy)) {
                console.error('starting on an unwalkable tile');
                debugger;
            }

            // If we're at the destination, end the loop and choose a new target
            if (sx === ex && sy === ey) {
                return doneState;
            }

            // If the destination is "far away", compute a path to an intermediate
            // point.  Otherwise, compute the path to the destination

            const dx = ex - sx;
            const dy = ey - sy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const m = dist / MAX_SEARCH_DISTANCE;
            let result;
            if (m <= 1) {
                result = yield pathfinder.pathfind(sx, sy, ex, ey);
            } else {
                // Choose the naive "ideal" intermediate point (straight-line to the
                // target)
                const xi = Math.ceil(sx + dx / m);
                const yi = Math.ceil(sy + dy / m);

                // Make that the guess as to where we should go next
                let xg = xi;
                let yg = yi;

                let jitter = 1.0;
                while (!pathfinder.walkable(xg, yg)) {
                    xg = xi + Math.floor(rng.sign() + rng.range(1, jitter));
                    yg = yi + Math.floor(rng.sign() + rng.range(1, jitter));
                    jitter += 0.25;
                }

                result = yield pathfinder.pathfind(sx, sy, xg, yg);
            }

            // Move!
            const path = result.map((g) => ({ x: g[0], y: g[1] }));
            return [STATE_MOVE, path, ex, ey, doneState];
        },

        [STATE_MOVE]: function* (path, ex, ey, doneState) {
            let x, y;
            while (path.length) {
                ({ x, y } = path.shift());
                onMove(x, y);
                yield moveDelay;
            }
            return [STATE_MOVELOOP, ex, ey, doneState];
        },
    };
}

/**
 * Add in the necessary glue to connect the generic pathfind behavior
 * generator to the heightmap
 */
function makePathfindBehaviorForHeightmap(heightMap, actor) {
    const rng = core.makeRNG();

    const heightArray = heightMap.getLayerArray('height');
    const tileArray = heightMap.getLayerArray('tile');
    const snowArray = heightMap.getLayerArray('snow');
    const SEGMENTS = heightMap.segments;

    const tileAt = (sx, sy) => {
        if (!(sx >= 0 && sx < SEGMENTS && sy >= 0 && sy < SEGMENTS)) {
            return null;
        }
        return db.tiles.get(tileArray[sy * SEGMENTS + sx]);
    };

    const walkable = (sx, sy) => {
        const tile = tileAt(sx, sy);
        return tile ? tile.walkable : false;
    };

    // Pathfinding object...
    const pathfinder = new PathfinderGraph({
        width: SEGMENTS,
        height: SEGMENTS,
        walkable,
        baseCost: (a) => tileAt(a.x, a.y)?.walkCost ?? 0.0,
        edgeCost: (a, b) => {
            const hb = heightArray[b.y * SEGMENTS + b.x];
            const ha = heightArray[a.y * SEGMENTS + a.x];
            return Math.max(0, 10 * (hb - ha));
        },
    });

    return makePathfindBehavior({
        pathfinder,
        moveDelay: 4,
        positionFunc: () => {
            return heightMap.coordW2S(actor.position.x, actor.position.y);
        },
        onMove: (sx, sy) => {
            const [wx, wy] = heightMap.coordS2W(sx, sy);
            actor.position.x = wx;
            actor.position.y = wy;

            const si = sy * heightMap.segments + sx;
            const snow0 = snowArray[si];
            if (snow0 > 0.0) {
                snowArray[si] = core.clamp(snow0 - 0.5, 0, 0.5);
                heightMap.updateSegment(sx, sy);
            }
        },
    });
}

class Updater {
    constructor(heightMap, { heightScale = 512, makeHeightFunc = null } = {}) {
        this._heightMap = heightMap;
        this._rng = core.makeRNG();
        this._heightFunc = null;
        this._makeHeightFunc = makeHeightFunc;
        this._heightScale = heightScale;

        // Note: this actor acts in "heightmap segment space", not "world space". For example,
        // the collider is set to the segment bounds, not the world heightmap bounds.
        this._position = new THREE.Vector3(0, 0, 0);
        this._velocity = new THREE.Vector3(0, 0, 0);
        this._acceleration = new THREE.Vector3(0, 0, 0);

        const S = this._heightMap.segments;
        this._collider = new THREE.Box3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(S, S, S));
    }

    get position() {
        return this._position;
    }
    get velocity() {
        return this._velocity;
    }

    get acceleration() {
        return this._acceleration;
    }

    update() {
        const rng = this._rng;

        updatePosition(this, 1);
        updateBoxCollision(this, this._collider);

        const K = 0.25;
        const MV = 2;
        this._velocity.x += K * rng.range(-1, 1);
        this._velocity.y += K * rng.range(-1, 1);
        this._velocity.clampScalar(-MV, MV);
    }

    stateMachine() {
        const rng = this._rng;

        return {
            _bind: this,
            _start: function* () {
                this._position.x = rng.range(0, this._heightMap.segments);
                this._position.y = rng.range(0, this._heightMap.segments);
                this._velocity.x = rng.sign() * rng.range(0.2, 2);
                this._velocity.y = rng.sign() * rng.range(0.2, 2);

                return 'changeTerrain';
            },
            changeTerrain: function* () {
                if (this._makeHeightFunc) {
                    this._heightFunc = this._makeHeightFunc({ heightMap: this._heightMap });
                } else {
                    const simplex = core.makeSimplexNoise(4342);
                    const amplitude = 0.04 * rng.range(0.4, 5);
                    const ox = rng.range(-1000, 1000);
                    const oy = rng.range(-1000, 1000);
                    const s = 1 / (rng.range(0.5, 2) * this._heightMap.segments);
                    const base = rng.range(0, 0.02);
                    this._heightFunc = (x, y) =>
                        base + amplitude * (0.5 + 0.5 * simplex.noise2D(ox + x * s, oy + y * s));
                }
                yield 60 * rng.rangei(2, 30);
                return 'update';
            },
            update: function* () {
                const D = 32;
                const MAX_DIST = Math.sqrt(2 * D * D);
                const heightMap = this._heightMap;

                const tileArray = heightMap.getLayerArray('tile');

                const frames = rng.rangei(10, 100);
                for (let i = 0; i < frames; i++) {
                    const centerSX = Math.floor(this._position.x);
                    const centerSY = Math.floor(this._position.y);
                    for (let sy = centerSY - D, lsy = -D; sy <= centerSY + D; lsy++, sy++) {
                        for (let sx = centerSX - D, lsx = -D; sx <= centerSX + D; lsx++, sx++) {
                            if (!heightMap.coordValidS(sx, sy)) {
                                continue;
                            }
                            const [wx, wy] = heightMap.coordS2W(sx, sy);
                            const wz = heightMap.getLayerSC('height', sx, sy);

                            const tz = this._heightScale * this._heightFunc(wx, wy);
                            let dz = tz - wz;
                            if (Math.abs(dz) < 1e-3) {
                                continue;
                            }
                            dz /= 20;

                            const normalizedDist = Math.sqrt(lsx * lsx + lsy * lsy) / MAX_DIST;
                            const k = 0.01;
                            dz *= k + (1 - k) * (1.0 - normalizedDist);

                            const nz = wz + dz;
                            heightMap.setLayerWC('height', wx, wy, nz, false);
                        }
                    }

                    const K = D + 1;
                    for (let sy = centerSY - K; sy <= centerSY + K; sy++) {
                        for (let sx = centerSX - K; sx <= centerSX + K; sx++) {
                            if (!heightMap.coordValidS(sx, sy)) {
                                continue;
                            }
                            heightMap.updateSegment(sx, sy);
                        }
                    }
                    yield 1;
                }

                return 'changeTerrain';
            },
        };
    }
}
