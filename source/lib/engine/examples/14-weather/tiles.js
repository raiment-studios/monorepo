import { LookupTable } from './lookup_table';
import * as core from '../../../core';

export function initTileLookupTable() {
    const grassColorFunc = makeGrassColorFunc(256);

    const table = new LookupTable({
        normalize: (obj) => {
            return {
                walkCost: obj.walkable ? 0 : 1e10,
                tillable: true,
                ...obj,
            };
        },
        table: {
            GRASS: {
                walkable: true,
                colorFunc: grassColorFunc,
            },
            GRASS_UNWALKABLE: {
                walkable: false,
                colorFunc: grassColorFunc,
            },

            GRASS_UNTILLABLE: {
                walkable: true,
                walkCost: 20,
                tillable: false,
                colorFunc: grassColorFunc,
            },
            DIRT_WALKABLE: {
                walkable: true,
                walkCost: 10,
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
    });
    return table;
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
