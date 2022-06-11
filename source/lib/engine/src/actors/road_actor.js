import * as core from '../../../core/src';
import { Actor } from '../engine/actor';
import { PathfinderGraph } from '../ai/pathfinder_graph';

export class RoadActor extends Actor {
    constructor({
        heightMap,
        tiles = {}, //
        delay = 0,
        ...rest
    }) {
        super(rest);
        this._heightMap = heightMap;
        this._tiles = tiles;
        this._delay = delay;

        console.assert(Number.isInteger(tiles.FOUNDATION));
        console.assert(Number.isInteger(tiles.ROAD));
        console.assert(Number.isInteger(tiles.ROAD_CENTER));
    }

    *sequence({ engine }) {
        const heightMap = this._heightMap;
        const tiles = this._tiles;
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

            for (let [x, y] of result) {
                heightMap.layers.tile.mutate(x, y, { buildable: false });
            }

            for (let [x, y] of result) {
                if (heightMap.layers.tile.lookup(x, y).index === tiles.FOUNDATION) {
                    break;
                }

                cursor.border(x, y, roadWidth, (x, y, { distance }) => {
                    if (distance > roadWidth) {
                        return;
                    }
                    if (heightMap.layers.tile.lookup(x, y).index === tiles.FOUNDATION) {
                        return;
                    }

                    if (distance === 0) {
                        heightMap.layers.tile.set(x, y, tiles.ROAD_CENTER);
                    } else {
                        const tileP = heightMap.layers.tile.get(x, y);
                        if (tileP !== tiles.ROAD_CENTER) {
                            heightMap.layers.tile.set(x, y, tiles.ROAD);
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
    }
}
