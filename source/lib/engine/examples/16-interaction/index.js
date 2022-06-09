/*
🚧 TODO
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
    DayNightLighting,
    VOXActor,
    TerrainMorphHeight,
    TerrainMorphAverage,
    WeatherSystem,
    componentGoal,
    componentPathfinder,
    Actor,
} from '../..';
import { TreeActor } from './tree_actor.js';

import assets from 'glob:$(MONOREPO_ROOT)/source;assets/**/*{.png,.asset.yaml,.vox}';
const assetURL = Object.fromEntries(assets.map((url) => [url.split('/').pop(), url]));

export default function () {
    return (
        <ReadingFrame>
            <h1>Interaction</h1>
            <div>
                <EngineView />
            </div>
        </ReadingFrame>
    );
}

const TILE = {};

function EngineView() {
    const engine = useEngine(() => {
        const rng = core.makeRNG();

        const heightMap = makeHeightMap(rng);
        Object.assign(TILE, heightMap.layers.tile.table.keys());

        engine.events.on('intersection', (results) => {
            const { x, y } = results.first.point;
            const actor = engine.actors.selectByID('kestrel');
            if (actor) {
                actor.goal = ['move', x, y];
            }
        });
        engine.events.on('engine.preupdate', () => {
            const actor = engine.actors.selectByID('kestrel');
            const camera = engine.actors.selectByID('camera');
            if (!actor || !camera) {
                return;
            }
            return;
            camera.radius = 24;
            camera.offsetZ = 2;
            const pt = actor.position.clone();
            pt.z += 5;
            camera.lookAt(pt);
        });

        engine.addSequence(function* () {
            engine.actors.push(
                new Grid(),
                new OrbitCamera({ radius: 72, periodMS: 20000, offsetZ: 48 }), //
                new DayNightLighting({ speed: 1, nightSpeed: 16 }),
                new GroundPlane(),
                heightMap,
                new WeatherSystem({ startState: 'rain', heightMap }),
                new TerrainMorphHeight({ heightMap }),
                new TerrainMorphAverage({ heightMap })
            );

            yield 100;

            const actor = new RoadMaker({ heightMap });
            engine.actors.push(actor);

            engine.addSequence(function* () {
                for (let i = 0; i < 8; i++) {
                    yield 100;
                    const actor = new RoadMaker({ heightMap });
                    engine.actors.push(actor);
                }
            });

            engine.addSequence(function* () {
                for (let i = 0; i < 3; i++) {
                    const actor = new VOXActor({
                        url: assetURL[
                            rng.select([
                                'obj_house3a.vox', //
                                'obj_house5c.vox', //
                                'obj_house5c.vox', //
                            ])
                        ],
                        scale: 2,
                        flags: {
                            receiveShadow: true,
                        },
                        rotation: (Math.PI / 2) * rng.rangei(0, 4),
                    });
                    yield placeActor({ engine, actor, heightMap, foundationTile: TILE.FOUNDATION });
                    yield 50;
                }
            });

            if (1)
                for (let clusters = 0; clusters < 24; clusters++) {
                    const cx = rng.rangei(0, heightMap.segments);
                    const cy = rng.rangei(0, heightMap.segments);
                    const count = rng.rangei(3, 8);
                    for (let i = 0; i < count; i++) {
                        const actor = new TreeActor();
                        yield placeActor({
                            engine,
                            actor,
                            heightMap,
                            generatePosition: (rng, minX, minY, maxX, maxY) => {
                                return [cx + rng.rangei(-20, 20), cy + rng.rangei(-20, 20)];
                            },
                        });
                        yield;
                    }
                    yield 10;
                }

            engine.actors.push(generateKestrel({ engine, heightMap }));

            yield 30;
            engine.actors.push(new TerrainMorphHeight({ heightMap }));
            engine.actors.push(new TerrainMorphAverage({ heightMap }));
        });

        engine.addSequence(function* () {
            yield 10;
            engine.journal.message('Welcome to Galthea, the world of Kestrel');
            yield 2 * 60;
            engine.journal.message('Your quest is to seek out Tristan.');
        });
    });

    return <EngineFrame engine={engine} recorder="three" />;
}

class RoadMaker extends Actor {
    constructor({ heightMap, delay = 0, ...rest }) {
        super(rest);
        this._heightMap = heightMap;
        this._delay = delay;
    }

    *sequence({ engine }) {
        const heightMap = this._heightMap;
        const rng = engine.rng;

        const N = heightMap.segments;

        yield this._delay;

        const pathfinder = new PathfinderGraph({
            width: N,
            height: N,
            walkable: (sx, sy) => {
                return heightMap.layers.tile.lookup(sx, sy).walkable;
            },
            baseCost: (a) => heightMap.layers.tile.lookup(a.x, a.y)?.walkCost ?? 0.0,
            edgeCost: (a, b) => {
                const heightArray = heightMap.layers.height.array;
                const hb = heightArray[b.y * N + b.x];
                const ha = heightArray[a.y * N + a.x];
                return Math.max(0, 10 * (hb - ha));
            },
        });

        const K = 8;
        const [sx, sy, ex, ey] = rng.select([
            [0, rng.rangei(K, N - K), N - 1, rng.rangei(K, N - K)],
            [rng.rangei(K, N - K), 0, rng.rangei(K, N - K), N - 1],
        ]);

        const roadWidth = rng.select([2, 2, 2, 2, 3, 3, 4]);

        const cursor = new core.Cursor2D(heightMap.segments, heightMap.segments);

        if (true) {
            const result = yield pathfinder.pathfind(sx, sy, ex, ey);

            const tile = rng.select([TILE.DIRT]);
            for (let [x, y] of result) {
                heightMap.layers.tile.mutate(x, y, { buildable: false });
            }

            let state = { abort: false };
            for (let [x, y] of result) {
                if (state.abort) {
                    break;
                }
                cursor.border(x, y, roadWidth, (x, y, { distance }) => {
                    if (distance > roadWidth) {
                        return;
                    }

                    if (heightMap.layers.tile.lookup(x, y).index === TILE.FOUNDATION) {
                        state.abort = true;
                        return;
                    }

                    if (distance === 0) {
                        heightMap.layers.tile.set(x, y, TILE.DIRT_CENTER);
                    } else {
                        const tileP = heightMap.layers.tile.get(x, y);
                        if (tileP !== TILE.DIRT_CENTER) {
                            heightMap.layers.tile.set(x, y, TILE.DIRT);
                        }
                    }
                    const i = y * N + x;
                    heightMap.layers.malleability.array[i] = 0.05;
                });

                const boundary = 4 + 3 * roadWidth;
                cursor.border(x, y, boundary, (x, y, { distance }) => {
                    if (distance > boundary) {
                        return;
                    }

                    const m = 0.8 * Math.pow(core.clamp(distance / boundary, 0, 1), 2);
                    const i = y * N + x;
                    const p = heightMap.layers.malleability.array[i];
                    heightMap.layers.malleability.array[i] = Math.min(p, m);
                    heightMap.updateSegment(x, y);
                });

                yield;
            }
        }
        yield;
        yield;
        yield;
    }
}

function makeHeightMap(rng) {
    const S = 192;
    const simplex1 = core.makeSimplexNoise(rng.uint31());
    const simplex2 = core.makeSimplexNoise(rng.uint31());
    const simplex3 = core.makeSimplexNoise(rng.uint31());

    function mix3(c0, c1, a) {
        const b = 1 - a;
        return [c0[0] * b + c1[0] * a, c0[1] * b + c1[1] * a, c0[2] * b + c1[2] * a];
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
    function makeDirtColorFunc(segments) {
        const scale = 1 / ((segments * 100) / 256);

        const simplex2 = core.makeSimplexNoise();
        const simplex3 = core.makeSimplexNoise();

        return function (sx, sy) {
            const rgb = [183 / 255, 100 / 255, 58 / 255];
            const a = (1 + simplex3.noise2D(sx, sy)) / 2;
            const b = (1 + simplex2.noise2D(sx * scale, sy * scale)) / 2;
            const t = 0.5 * b + 0.5;
            const s = t + a * (1 - t);
            return [rgb[0] * s, rgb[1] * s, rgb[2] * s];
        };
    }
    const grassColorFunc = makeGrassColorFunc(256);
    const dirtColorFunc = makeDirtColorFunc(256);

    const heightMap = new HeightMap({
        offset: [-256 / 2, -256 / 2, 0],
        scale: 256,
        segments: 256,
        layers: {
            tile: {
                type: Int8Array,
                defaultValue: 'GRASS',
                lookup: {
                    normalize: (obj) => {
                        Object.assign(obj, {
                            walkCost: obj.walkable ? 0 : 1e10,
                            snowFactor: 1.0,
                            tillable: true,
                            buildable: true,
                            ...obj,
                        });
                    },
                    table: {
                        GRASS: {
                            walkable: true,
                            walkCost: 10,
                            colorFunc: grassColorFunc,
                        },
                        GRASS_UNWALKABLE: {
                            walkable: false,
                            walkCost: 10,
                            colorFunc: grassColorFunc,
                        },
                        ROAD: {
                            walkable: true,
                            walkCost: 2,
                            colorFunc: () => [1, 0, 0],
                        },
                        FOUNDATION: {
                            walkable: false,
                            buildable: false,
                            walkCost: 1000,
                            colorFunc: (sx, sy) => [0.5, 0.5, 0.5],
                        },

                        BOUNDARY: {
                            walkable: true,
                            colorFunc: (sx, sy) => mix3([1, 1, 0], grassColorFunc(sx, sy), 0.85),
                        },

                        GRASS_UNTILLABLE: {
                            walkable: true,
                            walkCost: 20,
                            tillable: false,
                            colorFunc: grassColorFunc,
                        },
                        DIRT: {
                            walkable: true,
                            buildable: false,
                            walkCost: 2,
                            snowFactor: 0.25,
                            colorFunc: dirtColorFunc,
                        },
                        DIRT_CENTER: {
                            walkable: true,
                            buildable: false,
                            walkCost: 0.5,
                            snowFactor: 0.1,
                            colorFunc: (sx, sy) => {
                                const base = dirtColorFunc(sx, sy);
                                base[0] *= 0.95;
                                base[1] *= 0.95;
                                base[2] *= 0.95;
                                return base;
                            },
                        },
                        DIRT_WALKABLE: {
                            walkable: true,
                            walkCost: 4,
                            colorFunc: (sx, sy) => {
                                const base = grassColorFunc(sx, sy);
                                const a = sy % 2 ? 0.75 : 1.0;
                                base[0] *= 1.25 * a;
                                base[1] *= 0.5 * a;
                                base[2] *= 0.5 * a;
                                return base;
                            },
                        },
                    },
                },
            },
            object: { type: Int16Array },
            malleability: { type: Float32Array, defaultValue: 1.0 },
            snow: { type: Float32Array },
        },
        heightFunc: (sx, sy) => {
            const nx = sx + 5 * simplex1.noise2D((4 * sx) / S, (4 * sy) / S);
            const ny = sy + 5 * simplex2.noise2D((4 * sx) / S, (4 * sy) / S);
            const a = 1 + simplex3.noise2D(nx / S, ny / S) / 2;
            return 0.1 * Math.pow(1.1 * a, 1.5);
        },
    });

    const snowArray = heightMap.layers.snow.array;
    heightMap.colorFunc = function (sx, sy, _wz, si) {
        const tile = heightMap.layers.tile.lookup(sx, sy);
        const rgb = tile.colorFunc(sx, sy);
        const s = core.clamp(snowArray[si] * tile.snowFactor, 0.0, 1.0);
        rgb[0] = rgb[0] * (1 - s) + s * 1.0;
        rgb[1] = rgb[1] * (1 - s) + s * 1.0;
        rgb[2] = rgb[2] * (1 - s) + s * 1.0;
        return rgb;
    };

    heightMap.updateMesh();

    return heightMap;
}

function generateKestrel({ engine, heightMap }) {
    const rng = engine.rng;
    const tileArray = heightMap.getLayerArray('tile');

    function generateRandomWalkablePosition() {
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
    }

    let [worldX, worldY] = generateRandomWalkablePosition();

    const actor = new VoxelSprite({
        id: 'kestrel',
        url: assetURL['kestrel.png'],
        flags: {
            billboard: true,
            pinToGroundHeight: true,
        },
        mixins: [
            // The goal is the "overall" motivation for the actor.  So the FSM
            // should continually look to that to decide it's own execution and
            // transitions.
            componentGoal,
        ],
        worldX,
        worldY,
        stateMachine: function ({ engine, actor }) {
            return {
                _start: function* () {
                    return 'idle';
                },
                idle: function* () {
                    yield 10;
                    if (actor.goal?.[0] === 'move') {
                        let [cmd, x, y] = actor.goal;
                        actor.goal = null;
                        x = Math.floor(x);
                        y = Math.floor(y);
                        engine.journal.message(`Kestrel decides to move to ${x},${y}`);
                        return ['move', x, y];
                    }
                    return 'idle';
                },
                move: function* (wx, wy) {
                    const [sx, sy] = heightMap.coordW2S(wx, wy);
                    return ['pathfind.moveLoop', sx, sy, 'idle'];
                },
            };
        },
    });

    ///////////////////////////////////////////////////////////////////////////

    const heightArray = heightMap.getLayerArray('height');
    const SEGMENTS = heightMap.segments;

    const tileAt = (sx, sy) => {
        if (!(sx >= 0 && sx < SEGMENTS && sy >= 0 && sy < SEGMENTS)) {
            return null;
        }
        return heightMap.layers.tile.lookup(sx, sy);
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

    actor.mixin(componentPathfinder, {
        pathfinder,
        moveDelay: 4,
        positionFunc: ({ actor }) => {
            return heightMap.coordW2S(actor.position.x, actor.position.y);
        },
        onMove: (sx, sy) => {
            const [wx, wy] = heightMap.coordS2W(sx, sy);
            actor.position.x = wx;
            actor.position.y = wy;
        },
        interruptFunc: (sx, sy) => {
            const [wx, wy] = heightMap.coordS2W(sx, sy);
            if (
                actor.goal &&
                (actor.goal[0] !== 'move' || actor.goal[1] !== wx || actor.goal[2] !== wy)
            ) {
                return 'idle';
            }
            return null;
        },
    });

    ///////////////////////////////////////////////////////////////////////////

    return actor;
}

async function placeActor({
    engine,
    actor,
    heightMap,
    foundationTile = null,

    generatePosition = (rng, minX, minY, maxX, maxY) => {
        const sx = rng.rangei(minX, maxX);
        const sy = rng.rangei(minY, maxY);
        return [sx, sy];
    },
}) {
    const rng = engine.rng;
    const heightArray = heightMap.getLayerArray('height');
    const malleabilityArray = heightMap.getLayerArray('malleability');

    //
    // Read the actor's constraints on how it should be placed
    //
    const constraints = await actor.placementConstraints({ engine });
    const bbox = constraints.box3;
    const size = new THREE.Vector3();
    bbox.min.floor();
    bbox.max.ceil();
    bbox.getSize(size);

    const {
        malleabilityMin = 0,
        malleabilityExponent = 1,
        malleabilityExtents = 8, //
        walkableBoundary = 2,
        foundationSize = null,
    } = constraints;

    const minX = -bbox.min.x;
    const minY = -bbox.min.y;
    const maxX = heightMap.segments - size.x - minX;
    const maxY = heightMap.segments - size.y - minY;

    //
    // Iteratively make a random selection until constraints are met or the
    // number of attemmpts is exceeded.
    //
    let placement = null;
    const cursor = new core.Cursor2D(heightMap.segments, heightMap.segments);
    for (let attempt = 0; placement === null && attempt < 20; attempt++) {
        const ε = 1e-6;

        const [sx, sy] = generatePosition(rng, minX, minY, maxX, maxY);
        if (sx < minX || sx > maxX || sy < minY || sy > maxY) {
            continue;
        }

        const modelBox = new THREE.Box2();
        modelBox.min.set(sx + bbox.min.x, sy + bbox.min.y);
        modelBox.max.set(sx + bbox.max.x, sy + bbox.max.y);

        //
        // Ensure placement only occurs on currently walkable tiles
        //
        let valid = true;
        const stats = new core.SimpleStats();
        cursor.box(modelBox, { inflate: walkableBoundary }, ({ index }) => {
            const tile = heightMap.layers.tile.lookupIndex(index);
            if (!tile.walkable || !tile.buildable) {
                valid = false;
            }
            stats.add(heightArray[index]);
        });
        if (!valid) {
            continue;
        }

        //
        // Flatten the "foundation" area that the actor covers and mark that
        // terrain as immalleable.
        //
        // If an explicit size has been set, use that rather than the model bounds
        //
        let malleabilityBase = 0.0;
        if (foundationSize !== null) {
            const center = new THREE.Vector2();
            modelBox.getCenter(center);

            const size = Math.max(1, foundationSize);
            modelBox.setFromCenterAndSize(center, new THREE.Vector2(size, size));
        }

        const baseHeight = (stats.average() * 2) / 3 + stats.max() / 3;
        cursor.box(modelBox, ({ index }) => {
            if (foundationTile !== null) {
                heightMap.layers.tile.setAtIndex(index, foundationTile);
            } else {
                heightMap.layers.tile.mutateAtIndex(index, { walkable: false });
            }
            heightArray[index] = baseHeight;
            if (foundationSize !== 0) {
                malleabilityArray[index] = malleabilityBase;
            }
        });

        // Both...
        //
        // (1) Blend the heights of area surrounding the foundation with the foundation
        // height to smooth the transitions.
        //
        // (2) Reduce the malleability of the area surrounding the foundation so that
        // future terrain modifications tend to leave smooth transitions.
        //
        const innerBounds = modelBox.clone();
        innerBounds.max.addScalar(-ε);

        cursor.box(modelBox, { inflate: malleabilityExtents }, ({ x, y, index }) => {
            const pt = new THREE.Vector2(x, y);
            const dist = innerBounds.distanceToPoint(pt);
            if (dist > 0) {
                const a1 = Math.pow(core.clamp(dist / malleabilityExtents, 0, 1), 0.75);
                const a0 = 1 - a1;
                const c = heightArray[index];
                heightArray[index] = baseHeight * a0 + a1 * c;

                const value =
                    malleabilityMin + (1 - malleabilityMin) * Math.pow(a1, malleabilityExponent);
                malleabilityArray[index] = Math.min(malleabilityArray[index], value);
            }
        });

        //
        // As heights have changed, update the region.  Remember that the neighbors
        // of any segment whose height has changed also need to be updated.
        //
        cursor.box(modelBox, { inflate: malleabilityExtents + 1 }, ({ x, y }) => {
            heightMap.updateSegment(x, y);
        });
        placement = { sx, sy };
    }
    if (placement === null) {
        console.warn('Could not place actor', actor);
        return false;
    }

    const { sx, sy } = placement;

    const [wx, wy] = heightMap.coordS2W(sx, sy);
    actor.position.set(wx, wy, 0.0);
    engine.actors.push(actor);

    return true;
}
