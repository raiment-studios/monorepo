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
} from '../..';
import { Forest } from './forest.js';

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

        engine.actors.push(
            new Grid(),
            new OrbitCamera({ radius: 64, periodMS: 64000, offsetZ: 32 }), //
            new BasicLighting(),
            new GroundPlane(),
            heightMap,
            new Forest({ count: 128 }),
            ...core.generate(60, () => new Updater(heightMap))
        );
    });

    return <EngineFrame engine={engine} recorder="three" />;
}

function pathFindBehavior(heightmap) {
    const MAX_SEARCH_DISTANCE = 100;
    const rng = core.makeRNG();

    // A few shortcuts for the accessing the heightmap
    //
    const SEGMENTS = heightmap.segments;
    const tileArray = heightmap.getLayerArray('tile');
    const colorArray = heightmap.getLayerArray('color');

    const tileAt = (sx, sy) => {
        if (!(sx >= 0 && sx < SEGMENTS && sy >= 0 && sy < SEGMENTS)) {
            return null;
        }
        return db.tiles.get(tileArray[sy * SEGMENTS + sx]);
    };

    // Pathfinding object...
    //
    const pathfinder = new PathfinderGraph({
        width: heightmap.segments,
        height: heightmap.segments,
        baseCost: (a) => (tileAt(a.x, a.y)?.walkable ? 0 : 1e10),
        edgeCost: (a, b) => {
            const hb = heightmap.getLayerSC('height', a.x, a.y);
            const ha = heightmap.getLayerSC('height', b.x, b.y);
            return Math.max(0, 10 * (hb - ha));
        },
    });

    // State machine
    //
    return {
        _start: function* () {
            return 'target';
        },
        target: function* () {
            // "Think" for a few frames
            yield rng.rangei(5, 10);

            // Choose a random set of points
            const sx = rng.rangei(0, heightmap.segments);
            const sy = rng.rangei(0, heightmap.segments);
            const si = sy * heightmap.segments + sx;
            const ex = rng.rangei(0, heightmap.segments);
            const ey = rng.rangei(0, heightmap.segments);
            const ei = ey * heightmap.segments + ex;

            // Try again if the point is not valid...
            if (si === -1 || ei === -1) {
                return 'target';
            }

            // ...or it starts or ends on a non walkable tile
            if (!tileAt(sx, sy).walkable || !tileAt(ex, ey).walkable) {
                return 'target';
            }

            return ['moveLoop', sx, sy, ex, ey];
        },
        moveLoop: function* (sx, sy, ex, ey) {
            // If we're at the destination, end the loop and choose a new target
            if (sx === ex && sy === ey) {
                return 'target';
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
                let tile = tileAt(xg, yg);
                while (!tile?.walkable) {
                    xg = xi + Math.floor(rng.sign() + rng.range(1, jitter));
                    yg = yi + Math.floor(rng.sign() + rng.range(1, jitter));
                    tile = tileAt(xg, yg);
                    jitter += 0.2;
                }

                result = yield pathfinder.pathfind(sx, sy, xg, yg);
            }

            // Move!
            const path = result.map((g) => ({ x: g[0], y: g[1] }));
            const colorIndex = rng.select([COLOR_YELLOW, COLOR_ORANGE]);
            return ['move', path, ex, ey, colorIndex];
        },

        move: function* (path, ex, ey, colorIndex) {
            let x, y;
            while (path.length) {
                ({ x, y } = path.shift());
                const si = y * heightmap.segments + x;
                colorArray[si] = colorIndex;
                heightmap.updateSegment(x, y);
                yield;
            }
            return ['moveLoop', x, y, ex, ey];
        },
    };
}

class Updater {
    constructor(heightMap) {
        this._heightMap = heightMap;
    }
    stateMachine() {
        return pathFindBehavior(this._heightMap);
    }
}
