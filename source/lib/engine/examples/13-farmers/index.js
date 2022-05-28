import React from 'react';
import { ReadingFrame } from '../../../react-ex';
import * as core from '../../../core';
import * as THREE from 'three';
import {
    useEngine,
    EngineFrame,
    Grid,
    OrbitCamera,
    BasicLighting,
    GroundPlane,
    HeightMap,
    PathfinderGraph,
    VoxelSprite,
    updatePosition,
    updateBoxCollision,
} from '../..';
import { Forest } from './forest.js';
import assets from 'glob:$(MONOREPO_ROOT)/source;assets/proto/**/*{.png,.asset.yaml}';

const assetURL = Object.fromEntries(assets.matches.map(({ url }) => [url.split('/').pop(), url]));

export default function () {
    return (
        <ReadingFrame>
            <h1>Farmers</h1>
            <div>
                <EngineView />
            </div>
            <p>🚧 Work in progress</p>
            <p>
                The goal of this experiment is to have farmer sprites that (1) find a rectangular
                plot of land, (2) "reserve" it for farming, (3) iteratively go over each tile with a
                hoe to prepare the soil, (4) rest, (5) repeat.
            </p>
        </ReadingFrame>
    );
}

function makeGrassColorFunc(segments) {
    const scale = 1 / ((segments * 100) / 256);

    const simplex2 = core.makeSimplexNoise();
    const simplex3 = core.makeSimplexNoise();

    return function (sx, sy) {
        const rgb = [146 / 255, 201 / 255, 117 / 255];
        const a = (1 + simplex3.noise2D(sx, sy)) / 2;
        const b = (1 + simplex2.noise2D(sx * scale, sy * scale)) / 2;
        const t = 0.5 * b + 0.5;
        const s = t + a * (1 - t);
        return [rgb[0] * s, rgb[1] * s, rgb[2] * s];
    };
}

class ObjectTable {
    constructor({ transform = (obj) => obj } = {}) {
        this._list = [];
        this._transform = transform;
    }
    add(obj) {
        const i = this._list.length;
        this._list.push(this._transform(obj));
        return i;
    }
    get(index) {
        return this._list[index];
    }
}

const db = {
    colors: new ObjectTable(),
    tiles: new ObjectTable({
        transform: (obj) => {
            return {
                walkCost: obj.walkable ? 0 : 1e10,
                tillable: true,
                ...obj,
            };
        },
    }),
};

const COLOR_DEFAULT = db.colors.add({
    rgb: [1, 1, 1],
});
const COLOR_YELLOW = db.colors.add({
    rgb: [1, 1, 0.2],
});
const COLOR_ORANGE = db.colors.add({
    rgb: [235 / 255, 143 / 255, 52 / 255],
});
const COLOR_RED = db.colors.add({
    rgb: [235 / 255, 43 / 255, 12 / 255],
});

const grassColorFunc = makeGrassColorFunc(256);
const TILE_GRASS = db.tiles.add({
    walkable: true,
    colorFunc: grassColorFunc,
});
const TILE_GRASS_UNWALKABLE = db.tiles.add({
    walkable: false,
    colorFunc: grassColorFunc,
});

const TILE_GRASS_UNTILLABLE = db.tiles.add({
    walkable: true,
    walkCost: 20,
    tillable: false,
    colorFunc: grassColorFunc,
});

const TILE_DIRT_WALKABLE = db.tiles.add({
    walkable: true,
    walkCost: 10,
    colorFunc: (sx, sy) => {
        const base = grassColorFunc(sx, sy);
        base[0] *= 1.25;
        base[1] *= 0.5;
        base[2] *= 0.5;
        return base;
    },
});

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
            color: Int8Array,
        },
        heightFunc: (sx, sy) => {
            const nx = sx + 5 * simplex1.noise2D((4 * sx) / S, (4 * sy) / S);
            const ny = sy + 5 * simplex2.noise2D((4 * sx) / S, (4 * sy) / S);
            const a = 1 + simplex3.noise2D(nx / S, ny / S) / 2;
            return 0.1 * Math.pow(1.1 * a, 1.5);
        },
    });

    const tileArray = heightMap.getLayerArray('tile');
    const colorArray = heightMap.getLayerArray('color');

    tileArray.fill(TILE_GRASS);
    colorArray.fill(COLOR_DEFAULT);

    heightMap.colorFunc = function (sx, sy, wz, si) {
        const tile = db.tiles.get(tileArray[si]);
        const colorIndex = colorArray[si];
        const color = db.colors.get(colorIndex);

        switch (colorIndex) {
            case COLOR_DEFAULT: {
                const rgb = tile.colorFunc(sx, sy);
                return rgb;
            }
            default:
                return color.rgb;
        }
    };

    heightMap.updateMesh();

    return heightMap;
}

function EngineView() {
    const engine = useEngine(() => {
        const rng = core.makeRNG();

        const heightMap = makeHeightMap(rng);
        const tileArray = heightMap.getLayerArray('tile');

        engine.events.on('actor.postinit', ({ actor }) => {
            const shape = actor.groundCollisionShape;
            if (!shape) {
                return;
            }

            const [sx, sy] = heightMap.coordW2S(actor.position.x, actor.position.y);
            core.iterateCircle2D(sx, sy, 2 * shape.width, (sx, sy) => {
                const si = heightMap.coordS2I(sx, sy);
                if (si !== -1) {
                    tileArray[si] = TILE_GRASS_UNWALKABLE;
                    heightMap.updateSegment(sx, sy);
                }
            });
        });

        engine.actors.push(
            new Grid(),
            new OrbitCamera({ radius: 64, periodMS: 72000, offsetZ: 32 }), //
            new BasicLighting(),
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
                return tileIndex === TILE_GRASS;
            };

            let worldX, worldY;
            do {
                const radius = rng.range(10, 96);
                const ang = rng.range(0, 2 * Math.PI);
                worldX = Math.floor(radius * Math.cos(ang));
                worldY = Math.floor(radius * Math.sin(ang));
            } while (!walkable(worldX, worldY));

            return [worldX, worldY];
        };

        engine.opt.generatePathfindingBehavior = function (actor) {
            return makePathfindBehaviorForHeightmap(heightMap, actor);
        };

        // Use a sequence (i.e. a script run across multiple frames) to ensure the
        // initialization order.
        engine.addSequence(function* () {
            // Stage 1
            engine.actors.push(new Forest({ count: 40 }));

            yield;

            // Stage 2
            // After the forest is initialized, add the sprites as they depend on
            // the forest being placed and unwalkable areas being defined.
            engine.actors.push(
                ...core.generate(10, (i) => {
                    let [worldX, worldY] = engine.opt.generateRandomWalkablePosition();

                    return new VoxelSprite({
                        url: assetURL[
                            rng.select([
                                'kestrel.png',
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
                }),
                ...core.generate(6, () => new Farmer())
            );

            yield;

            engine.actors.push(new Updater(heightMap));
            return;
        });
    });

    return <EngineFrame engine={engine} recorder="three" />;
}

class Farmer {
    constructor() {
        this._sprite = null;
        this._plotFailures = 0;
        this._plotSuccesses = 0;
    }

    init({ engine }) {
        const rng = core.makeRNG();
        let [worldX, worldY] = engine.opt.generateRandomWalkablePosition();

        this._sprite = new VoxelSprite({
            url: assetURL[rng.select(['farmer.png', 'farmer2.png'])],
            flags: {
                billboard: true,
                pinToGroundHeight: true,
            },
            worldX,
            worldY,
        });

        engine.actors.push(this._sprite);
    }

    // 🚧 TODO:
    // - Add Wizard type who casts terrain-modifying spells
    // - Add malleability property to tiles that is lower for farmed land
    stateMachine({ engine }) {
        const rng = core.makeRNG();

        const pathfindingBehavior = engine.opt.generatePathfindingBehavior(this._sprite);

        return {
            _bind: this,
            _start: function* () {
                return 'wander';
            },

            // pathfind.* states
            ...pathfindingBehavior,

            // Choose a location ~20 blocks away and move there
            wander: function* () {
                let [wx, wy] = engine.opt.generateRandomWalkablePosition();
                const [ex, ey] = engine.opt.heightMap.coordW2S(wx, wy);
                return ['pathfind.moveLoop', ex, ey, 'rest'];
            },

            // Wait for a bit, then decide to wander or find a plot
            //
            rest: function* () {
                yield rng.rangei(30, 5 * 60);
                return rng.select(['wander', 'wander', 'findPlot']);
            },
            // Try to find an unoccuppied rectangle that will be a farming plot
            // If found, "reserve" it so it can't be changed
            // If not found, try again a couple of times
            // Possibly find several plots and choose one with the least height variation
            findPlot: function* () {
                const heightMap = engine.opt.heightMap;
                const heightArray = heightMap.getLayerArray('height');
                const tileArray = heightMap.getLayerArray('tile');

                let attempts = 0;
                let region = null;
                while (!region && attempts < 20) {
                    const width = rng.rangei(30, 50);
                    const height = rng.rangei(30, 50);
                    const rx0 = rng.rangei(0, heightMap.segments - width);
                    const ry0 = rng.rangei(0, heightMap.segments - height);

                    let valid = true;
                    let heightSum = 0.0;
                    let heightMin = Infinity;
                    let heightMax = -Infinity;
                    for (let sy = ry0; valid && sy < ry0 + height; sy++) {
                        for (let sx = rx0; valid && sx < rx0 + width; sx++) {
                            const si = sy * heightMap.segments + sx;
                            const h = heightArray[si];
                            heightSum += h;
                            if (h < heightMin) heightMin = h;
                            if (h > heightMax) heightMax = h;

                            const tile = db.tiles.get(tileArray[si]);
                            valid &= tile.walkable && tile.tillable;
                        }
                    }

                    // Avoid plots on highly sloped terrain
                    valid &= heightMax - heightMin <= 15;

                    if (valid) {
                        // "Reserve" the to be tilled land to avoid overlapping claims
                        const R = 0;
                        for (let sy = ry0; sy < ry0 + height; sy++) {
                            for (let sx = rx0; sx < rx0 + width; sx++) {
                                if (
                                    !(
                                        sx >= 0 &&
                                        sx < heightMap.segments &&
                                        sy >= 0 &&
                                        sy < heightMap.segments
                                    )
                                ) {
                                    continue;
                                }
                                const si = sy * heightMap.segments + sx;
                                tileArray[si] = TILE_GRASS_UNTILLABLE;
                                heightMap.updateSegment(sx, sy);
                            }
                        }

                        const avgHeight = heightSum / (width * height);
                        region = [rx0 + 2, ry0 + 2, rx0 + width - 2, ry0 + height - 2, avgHeight];
                    } else {
                        yield 5;
                    }

                    attempts++;
                }

                if (region) {
                    this._plotSuccesses++;
                    return ['moveToPlot', region];
                }
                this._plotFailures++;
                return 'rest';
            },

            moveToPlot: function* (plot) {
                return ['pathfind.moveLoop', plot[0], plot[1], ['tillPlot', plot]];
            },

            // Given a plot definition, gradually "till" the land, changing the tile
            // type
            tillPlot: function* ([rx0, ry0, rx1, ry1, height]) {
                const heightMap = engine.opt.heightMap;
                const tileArray = heightMap.getLayerArray('tile');
                const heightArray = heightMap.getLayerArray('height');

                const till = (sx, sy) => {
                    const [wx, wy] = heightMap.coordS2W(sx, sy);
                    this._sprite.position.x = wx;
                    this._sprite.position.y = wy;

                    const si = sy * heightMap.segments + sx;

                    tileArray[si] = TILE_DIRT_WALKABLE;
                    heightArray[si] = 0.75 * heightArray[si] + 0.25 * height;

                    core.iterateBorder2D(sx, sy, 1, (x, y) => {
                        if (x >= 0 && x < heightMap.segments && y >= 0 && y < heightMap.segments) {
                            heightMap.updateSegment(x, y);
                        }
                    });
                };

                let parity = 0;
                const WAIT = 5;
                for (let sy = ry0; sy < ry1; sy++) {
                    if (parity === 0) {
                        for (let sx = rx0; sx < rx1; sx++) {
                            till(sx, sy);
                            yield WAIT;
                        }
                    } else {
                        for (let sx = rx1 - 1; sx >= rx0; sx--) {
                            till(sx, sy);
                            yield WAIT;
                        }
                    }
                    yield 10;
                    parity = (parity + 1) % 2;
                }
                return 'findPlot';
            },
        };
    }
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
    const colorArray = heightMap.getLayerArray('color');
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
        baseCost: (a) => tileAt(a.x, a.y)?.walkCost,
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
        onMove: (x, y) => {
            const [wx, wy] = heightMap.coordS2W(x, y);
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
                            dz *= 0.15;

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
                    yield 10;
                }

                return 'changeTerrain';
            },
        };
    }
}
