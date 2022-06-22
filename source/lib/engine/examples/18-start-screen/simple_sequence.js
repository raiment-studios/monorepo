import * as core from '../../../core/src';
import { HeightMap, DayNightLighting, WeatherSystem, TreeActor } from '../../src';
import { FirstPersonCamera } from './first_person_camera';

export function* simpleSequence({ engine }) {
    const { rng } = engine;
    const heightMap = makeHeightMap(rng, { amplitude: 0.25 });

    engine.actors.push(
        new FirstPersonCamera({ radius: 22, periodMS: 20000, offsetZ: 0 }), //
        new DayNightLighting({ speed: 1, nightSpeed: 4 }),
        heightMap,
        new WeatherSystem({ startState: 'clear', heightMap })
    );

    // Add some trees to give a sense of scale
    for (let clusters = 0; clusters < 1; clusters++) {
        const cx = rng.rangei(0, heightMap.segments);
        const cy = rng.rangei(0, heightMap.segments);
        const count = rng.rangei(3, 8);
        for (let i = 0; i < count; i++) {
            const actor = new TreeActor();

            yield engine.actors.place({
                engine,
                actor,
                heightMap,
                generatePosition: (rng) => {
                    return [cx + rng.rangei(-20, 20), cy + rng.rangei(-20, 20)];
                },
            });
            yield;
        }
        yield 10;
    }
}

function makeHeightMap(rng, { amplitude = 1.0 } = {}) {
    const S = 192;
    const simplex1 = core.makeSimplexNoise(rng.uint31());
    const simplex2 = core.makeSimplexNoise(rng.uint31());
    const simplex3 = core.makeSimplexNoise(rng.uint31());

    const heightMap = new HeightMap({
        id: 'terrain',
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
                },
            },
            object: { type: Int16Array },
            malleability: { type: Float32Array, defaultValue: 1.0 },
            snow: { type: Float32Array },
            water: { type: Float32Array, defaultValue: 0.5 },
        },
        heightFunc: (sx, sy) => {
            const nx = sx + 5 * simplex1.noise2D((4 * sx) / S, (4 * sy) / S);
            const ny = sy + 5 * simplex2.noise2D((4 * sx) / S, (4 * sy) / S);
            const a = 1 + simplex3.noise2D(nx / S, ny / S) / 2;
            return amplitude * 0.1 * Math.pow(1.1 * a, 1.5);
        },
    });

    function mix3(c0, c1, a) {
        const b = 1 - a;
        return [c0[0] * b + c1[0] * a, c0[1] * b + c1[1] * a, c0[2] * b + c1[2] * a];
    }

    const waterArray = heightMap.layers.water.array;
    heightMap.colorFunc = function (sx, sy, _wz, si) {
        const tile = heightMap.layers.tile.lookup(sx, sy);
        const rgb = tile.colorFunc(sx, sy);
        const water = waterArray[si] / 4;
        if (water < 0) {
            return [1, 0, 0];
        }
        const F = 0.45;
        const s = F * core.clamp(water, 0.0, 1.0);
        return mix3(rgb, [0.02, 0.19, 1.0], s);
    };

    addTiles(heightMap);
    heightMap.updateMesh();

    return heightMap;
}

function addTiles(heightMap) {
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

    heightMap.layers.tile.table.addSet({
        GRASS: {
            id: 'GRASS',
            walkable: true,
            walkCost: 10,
            colorFunc: grassColorFunc,
        },
        ROAD: {
            walkable: true,
            walkCost: 2,
            colorFunc: grassColorFunc,
        },
        ROAD_CENTER: {
            walkable: true,
            walkCost: 0.5,
            colorFunc: grassColorFunc,
        },
        FOUNDATION: {
            walkable: false,
            buildable: false,
            walkCost: 1000,
            colorFunc: (sx, sy) => [0.5, 0.5, 0.5],
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
    });
}
