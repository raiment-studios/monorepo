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
            return obj;
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
const TILE_BLACK = db.tiles.add({
    walkable: false,
    colorFunc: () => [0.3, 0.3, 0.3],
});
const TILE_BLUE = db.tiles.add({
    walkable: false,
    colorFunc: () => [0.1, 0.5, 0.9],
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
                if (!tile.walkable) {
                    rgb[0] = core.clamp(rgb[0] * 2, 0.0, 1.0);
                    rgb[1] = core.clamp(rgb[1] * 0.5, 0.0, 1.0);
                    rgb[2] = core.clamp(rgb[2] * 0.5, 0.0, 1.0);
                }
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
        const colorArray = heightMap.getLayerArray('color');

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

        // Use a state machine to sequence the initialization.  For example, the Forest
        // needs to be added prior to the sprites so the sprites can be placed on positions
        // that are not blocked by the trees.
        class Init {
            stateMachine({ engine }) {
                return {
                    _start: function* () {
                        // Stage 1
                        engine.actors.push(new Forest({ count: 128 }));

                        yield;

                        // Stage 2
                        engine.actors.push(
                            ...core.generate(10, (i) => {
                                const walkable = (wx, wy) => {
                                    const si = heightMap.coordW2I(wx, wy);
                                    if (si === -1) {
                                        return false;
                                    }
                                    const tileIndex = tileArray[si];
                                    const tile = db.tiles.get(tileIndex);
                                    return tile.walkable;
                                };

                                let worldX, worldY;
                                do {
                                    const radius = rng.range(10, 96);
                                    const ang = rng.range(0, 2 * Math.PI);
                                    worldX = Math.floor(radius * Math.cos(ang));
                                    worldY = Math.floor(radius * Math.sin(ang));
                                } while (!walkable(worldX, worldY));

                                return new VoxelSprite({
                                    url: assetURL[
                                        i == 0
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
                                                return 'pathfind.start';
                                            },
                                            ...makePathfindBehaviorForHeightmap(heightMap, actor),
                                        };
                                    },
                                });
                            })
                        );
                        return;
                    },
                };
            }
        }

        engine.actors.push(
            new Grid(),
            new OrbitCamera({ radius: 64, periodMS: 72000, offsetZ: 24 }), //
            new BasicLighting(),
            new GroundPlane(),
            heightMap,
            new Init()
        );
    });

    return <EngineFrame engine={engine} recorder="three" />;
}

/**
 * A reusable set of state machine states for pathfinding.
 *
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
    const STATE_START = prefixName('start');
    const STATE_TARGET = prefixName('target');
    const STATE_MOVE = prefixName('move');
    const STATE_MOVELOOP = prefixName('moveLoop');

    return {
        [STATE_START]: function* () {
            return STATE_TARGET;
        },
        [STATE_TARGET]: function* () {
            // "Think" for a few frames
            yield rng.rangei(5, 10);

            // Use the current position as the starting point
            const [sx, sy] = positionFunc();
            if (!pathfinder.walkable(sx, sy)) {
                console.error('starting on an unwalkable tile');
                debugger;
            }

            // Choose a random point to target and retry until it
            // is a valid destination
            const ex = rng.rangei(0, pathfinder.width);
            const ey = rng.rangei(0, pathfinder.height);
            if (!pathfinder.walkable(ex, ey)) {
                return STATE_TARGET;
            }

            return [STATE_MOVELOOP, sx, sy, ex, ey];
        },
        [STATE_MOVELOOP]: function* (sx, sy, ex, ey) {
            // If we're at the destination, end the loop and choose a new target
            if (sx === ex && sy === ey) {
                return STATE_TARGET;
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
            return [STATE_MOVE, path, ex, ey];
        },

        [STATE_MOVE]: function* (path, ex, ey) {
            let x, y;
            while (path.length) {
                ({ x, y } = path.shift());
                onMove(x, y);
                yield moveDelay;
            }
            return [STATE_MOVELOOP, x, y, ex, ey];
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

    const colorIndex = rng.select([COLOR_YELLOW, COLOR_ORANGE]);

    // Pathfinding object...
    const pathfinder = new PathfinderGraph({
        width: SEGMENTS,
        height: SEGMENTS,
        walkable,
        baseCost: (a) => (tileAt(a.x, a.y)?.walkable ? 0 : 1e10),
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
            const si = y * SEGMENTS + x;
            colorArray[si] = colorIndex;
            heightMap.updateSegment(x, y);

            const [wx, wy] = heightMap.coordS2W(x, y);
            actor.position.x = wx;
            actor.position.y = wy;
        },
    });
}
