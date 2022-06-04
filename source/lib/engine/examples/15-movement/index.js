/*

🚧 TODO

- Flatten terrain under the voxel model
- "Lock" the terrain under the voxel model (and border around it)
- Ensure model and trees don't overlap
- Click to select building
- Pop-up "story" dialog when building selected after moving close to it

*/

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
    DayNightLighting,
    VOXActor,
} from '../..';
import { Forest } from './forest.js';
import assets from 'glob:$(MONOREPO_ROOT)/source;assets/**/*{.png,.asset.yaml,.vox}';
import { LookupTable } from './lookup_table';
import { initTileLookupTable } from './tiles';

const assetURL = Object.fromEntries(assets.matches.map(({ url }) => [url.split('/').pop(), url]));

export default function () {
    return (
        <ReadingFrame>
            <h1>Movement</h1>
            <div>
                <EngineView />
            </div>
        </ReadingFrame>
    );
}

const db = {
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
            malleability: Float32Array,
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
    const malleabilityArray = heightMap.getLayerArray('malleability');

    tileArray.fill(TILE.GRASS);
    objectArray.fill(0);
    malleabilityArray.fill(1.0);

    heightMap.colorFunc = function (sx, sy, wz, si) {
        const tile = db.tiles.get(tileArray[si]);
        const rgb = tile.colorFunc(sx, sy);
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
        const heightArray = heightMap.getLayerArray('height');
        const malleabilityArray = heightMap.getLayerArray('malleability');

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

        engine.events.on('actor.postinit', ({ actor }) => {
            if (actor.id !== 'house') {
                return;
            }
            engine.addSequence(function* () {
                while (!actor.__mesh) {
                    yield 5;
                }
                const mesh = actor.__mesh;
                const bbox = new THREE.Box3();
                bbox.setFromObject(mesh);

                const [sx0, sy0] = heightMap.coordW2S(bbox.min.x, bbox.min.y);
                const [sx1, sy1] = heightMap.coordW2S(bbox.max.x, bbox.max.y);

                let heightSMax = -Infinity;
                let heightSum = 0.0;
                let heightCount = 0;
                core.iterateRect2D(sx0, sy0, sx1, sy1, (sx, sy) => {
                    const si = heightMap.coordS2I(sx, sy);
                    if (si !== -1) {
                        heightSMax = Math.max(heightSMax, heightArray[si]);
                        heightSum += heightArray[si];
                        heightCount++;
                    }
                });

                const heightP = ((heightSum / heightCount) * 2) / 3 + (heightSMax * 1) / 3 + 3;
                core.iterateRect2D(sx0, sy0, sx1, sy1, (sx, sy) => {
                    const si = heightMap.coordS2I(sx, sy);
                    if (si !== -1) {
                        tileArray[si] = TILE.FOUNDATION;
                        heightArray[si] = heightP;
                        malleabilityArray[si] = 0.0;
                    }
                });

                const bboxSC = new THREE.Box3();
                bboxSC.min.set(sx0, sy0, 0.0);
                bboxSC.max.set(sx1 - 1e-6, sy1 - 1e-6, 0.0);

                const R = 20;
                const R2 = R * Math.sqrt(2);
                core.iterateRect2D(sx0 - R, sy0 - R, sx1 + R, sy1 + R, (sx, sy) => {
                    const si = heightMap.coordS2I(sx, sy);
                    if (si === -1) {
                        return;
                    }

                    const pt = new THREE.Vector3(sx, sy, 0.0);
                    const dist = bboxSC.distanceToPoint(pt);

                    if (dist > 0) {
                        const a1 = Math.pow(core.clamp(dist / R, 0, 1), 0.75);

                        if (a1 < 0 || a1 > 1) debugger;

                        const a0 = 1 - a1;
                        const c = heightArray[si];
                        tileArray[si] = TILE.BOUNDARY;
                        heightArray[si] = heightP * a0 + a1 * c;
                        malleabilityArray[si] = Math.min(malleabilityArray[si], a1 * a1);
                    }
                });
                const R1 = R + 1;
                core.iterateRect2D(sx0 - R1, sy0 - R1, sx1 + R1, sy1 + R1, (sx, sy) => {
                    const si = heightMap.coordS2I(sx, sy);
                    if (si !== -1) {
                        heightMap.updateSegment(sx, sy);
                    }
                });
            });
        });

        engine.events.on('intersection', (results) => {
            const { x, y } = results.first.point;
            const actor = engine.actors.selectByID('kestrel');
            actor._goal = ['move', x, y];
        });

        engine.actors.push(
            new Grid(),
            new OrbitCamera({ radius: 72, periodMS: 24000, offsetZ: 48 }), //
            new DayNightLighting({ speed: 1, nightSpeed: 16 }),
            new GroundPlane(),
            ...core.generate(
                2,
                () =>
                    new VOXActor({
                        id: 'house',
                        url: assetURL['obj_house5c.vox'],
                        scale: 2,
                        flags: {
                            pinToGroundHeight: true,
                            castShadow: true,
                        },
                        position: new THREE.Vector3(rng.rangei(-76, 76), rng.range(-76, 76), 0.0),
                        rotation: (Math.PI / 2) * rng.rangei(0, 4),
                    })
            ),
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
            engine.actors
                .push
                //new Forest({ count: 40 }) //
                ();
            yield;

            // Stage 2
            // After the forest is initialized, add the sprites as they depend on
            // the forest being placed and unwalkable areas being defined.
            engine.actors.push(
                ...core.generate(1, (i) => {
                    let [worldX, worldY] = engine.opt.generateRandomWalkablePosition();

                    return new VoxelSprite({
                        id: 'kestrel',
                        url: assetURL['kestrel.png'],
                        flags: {
                            billboard: true,
                            pinToGroundHeight: true,
                        },
                        worldX,
                        worldY,
                        stateMachine: function ({ engine, actor }) {
                            // The goal is the "overall" motivation for the actor.  So the FSM
                            // should continually look to that to decide it's own execution and
                            // transitions.
                            actor._goal = null;

                            let pathfind = makePathfindBehaviorForHeightmap(heightMap, actor);

                            return {
                                _start: function* () {
                                    return 'idle';
                                },
                                ...pathfind,

                                idle: function* () {
                                    yield 30;
                                    if (actor._goal?.[0] === 'move') {
                                        let [cmd, x, y] = actor._goal;
                                        actor._goal = null;
                                        x = Math.floor(x);
                                        y = Math.floor(y);
                                        engine.journal.message(
                                            `Kestrel decides to move to ${x},${y}`
                                        );
                                        return ['move', x, y];
                                    }
                                    return 'idle';
                                },
                                move: function* (wx, wy) {
                                    const [sx, sy] = heightMap.coordW2S(wx, wy);
                                    return [
                                        'pathfind.moveLoop',
                                        sx,
                                        sy,
                                        'idle',
                                        {
                                            interruptCb: () => {
                                                if (
                                                    actor._goal &&
                                                    (actor._goal[0] !== 'move' ||
                                                        actor._goal[1] !== wx ||
                                                        actor._goal[2] !== wy)
                                                ) {
                                                    return 'idle';
                                                }
                                                return null;
                                            },
                                        },
                                    ];
                                },
                            };
                        },
                    });
                })
            );

            yield;

            engine.actors.push(
                new Updater(heightMap),
                new Updater(heightMap),
                new Updater2(heightMap),
                new Updater2(heightMap)
            );
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
        [STATE_MOVELOOP]: function* (ex, ey, doneState = STATE_TARGET, options) {
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
            return [STATE_MOVE, path, ex, ey, doneState, options];
        },

        [STATE_MOVE]: function* (path, ex, ey, doneState, options = {}) {
            const { interruptCb } = options;
            let x, y;
            while (path.length) {
                ({ x, y } = path.shift());
                onMove(x, y);

                const interruptState = interruptCb?.();
                if (interruptState) {
                    return interruptState;
                }

                yield moveDelay;
            }
            return [STATE_MOVELOOP, ex, ey, doneState, options];
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
                //yield 60 * rng.rangei(2, 30);
                return 'update';
            },
            update: function* () {
                const D = 32;
                const MAX_DIST = Math.sqrt(2 * D * D);
                const heightMap = this._heightMap;

                const heightArray = heightMap.getLayerArray('height');
                const malleabilityArray = heightMap.getLayerArray('malleability');

                const frames = rng.rangei(10, 100);

                const pen = new Pen2D(heightMap.segments, heightMap.segments);

                for (let i = 0; i < frames; i++) {
                    const centerSX = Math.floor(this._position.x);
                    const centerSY = Math.floor(this._position.y);
                    pen.border(centerSX, centerSY, D, (sx, sy) => {
                        const si = sy * heightMap.segments + sx;
                        const lsx = sx - centerSX;
                        const lsy = sy - centerSY;

                        const [wx, wy] = heightMap.coordS2W(sx, sy);
                        const wz = heightArray[si];

                        const tz = this._heightScale * this._heightFunc(wx, wy);
                        let dz = tz - wz;
                        if (Math.abs(dz) < 1e-3) {
                            return;
                        }
                        dz /= 20;

                        const normalizedDist = Math.sqrt(lsx * lsx + lsy * lsy) / MAX_DIST;
                        const k = 0.01;
                        dz *= k + (1 - k) * (1.0 - normalizedDist);

                        const m = malleabilityArray[si];
                        dz *= m;

                        heightArray[si] = wz + dz;
                    });

                    pen.border(centerSX, centerSY, D + 1, (sx, sy) => {
                        heightMap.updateSegment(sx, sy);
                    });
                    yield 1;
                }

                return 'changeTerrain';
            },
        };
    }
}

class Updater2 {
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

                return 'update';
            },
            update: function* () {
                const D = 32;
                const MAX_DIST = Math.sqrt(2 * D * D);
                const heightMap = this._heightMap;

                const heightArray = heightMap.getLayerArray('height');
                const malleabilityArray = heightMap.getLayerArray('malleability');

                const frames = rng.rangei(10, 100);

                const pen = new Pen2D(heightMap.segments, heightMap.segments);

                for (let i = 0; i < frames; i++) {
                    const centerSX = Math.floor(this._position.x);
                    const centerSY = Math.floor(this._position.y);

                    const stats = new SimpleStats();
                    pen.border(centerSX, centerSY, D, (sx, sy) => {
                        const si = sy * heightMap.segments + sx;
                        const wz = heightArray[si];
                        stats.add(wz);
                    });

                    const avg = stats.mean();
                    pen.border(centerSX, centerSY, D, (sx, sy, { index: si, distance }) => {
                        const wz = heightArray[si];
                        const m = malleabilityArray[si];
                        const a = m * 0.25 * (1 - core.clamp(distance / D, 0, 1));
                        heightArray[si] = wz * (1 - a) + avg * a;
                    });

                    pen.border(centerSX, centerSY, D + 1, (sx, sy) => {
                        heightMap.updateSegment(sx, sy);
                    });

                    pen.border(centerSX, centerSY, D + 1, (sx, sy) => {
                        heightMap.updateSegment(sx, sy);
                    });
                    yield 1;
                }

                return 'update';
            },
        };
    }
}

class SimpleStats {
    constructor() {
        this._sum = 0.0;
        this._count = 0;
    }
    add(value) {
        this._sum += value;
        this._count++;
    }
    mean() {
        return this._sum / this._count;
    }
}

/**
 * A iterator-like utility for walking regions of a 2D canvas.
 */
class Pen2D {
    constructor(width, height) {
        this._width = width;
        this._height = height;
    }

    border(cx, cy, borderWidth, cb) {
        const extra = {
            index: 0,
            distance: 0,
        };

        const y0 = Math.max(cy - borderWidth, 0);
        const y1 = Math.min(cy + borderWidth, this._height - 1);
        const x0 = Math.max(cx - borderWidth, 0);
        const x1 = Math.min(cx + borderWidth, this._width - 1);

        for (let y = y0; y <= y1; y++) {
            for (let x = x0; x <= x1; x++) {
                extra.index = y * this._width + x;
                const dx = x - cx;
                const dy = y - cy;
                extra.distance = Math.sqrt(dx * dx + dy * dy);
                cb(x, y, extra);
            }
        }
    }
}
