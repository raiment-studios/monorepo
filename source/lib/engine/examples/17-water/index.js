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
    OrbitCamera,
    HeightMap,
    DayNightLighting,
    TerrainMorphHeight,
    TerrainMorphAverage,
    WeatherSystem,
    TreeActor,
} from '../..';

export default function () {
    return (
        <ReadingFrame>
            <h1>Water</h1>
            <div>
                <EngineView />
            </div>
            <pre style={{ whiteSpace: 'pre-wrap' }}>
                <code>{`
## Devlog notes

How is water going to work?

Add a moisture layer to the heightmap.
Run a randomized process that moves moisture to lower elevation neighbors.
Rain adds more moisture up to a max.
Sun dries it up to a min.
Dirt replaces grass at some threshold.
Water "layer" for above some threshold.

Will the simulation process be too slow?
`}</code>
            </pre>
        </ReadingFrame>
    );
}

export const TILE = {};

function EngineView() {
    const engine = useEngine(() => {
        const rng = core.makeRNG();

        const heightMap = makeHeightMap(rng);
        Object.assign(TILE, heightMap.layers.tile.table.keys());

        engine.sequence(function* () {
            engine.actors.push(
                new OrbitCamera({ radius: 72, periodMS: 20000, offsetZ: 48 }), //
                new DayNightLighting({ speed: 1, nightSpeed: 16 }),
                heightMap,
                new WeatherSystem({ startState: 'rain', heightMap })
            );

            // Add some trees to give a sense of scale
            for (let clusters = 0; clusters < 6; clusters++) {
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

            if (false) {
                engine.actors.push(new TerrainMorphHeight({ heightMap }));
                engine.actors.push(new TerrainMorphAverage({ heightMap }));
            }
        });
    });

    return <EngineFrame engine={engine} recorder="three" />;
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
