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
} from '../..';

import { PathfinderGraph } from './pathfinder_graph';

export default function () {
    return (
        <ReadingFrame>
            <h1>Pathfinding</h1>
            <div>
                <EngineView />
            </div>
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
        const b = (1 + simplex2.noise2D(sx * scale, sy * 100)) / 2;
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
            obj.weight = (1.0 - obj.walkability) * 1e20;
            return obj;
        },
    }),
};

const COLOR_DEFAULT = db.colors.add({});
const COLOR_YELLOW = db.colors.add({});

const TILE_GRASS = db.tiles.add({
    walkability: 1.0,
    colorFunc: makeGrassColorFunc(256),
});
const TILE_BLACK = db.tiles.add({
    walkability: 0.0,
    colorFunc: () => [0.3, 0.3, 0.3],
});
const TILE_BLUE = db.tiles.add({
    walkability: 0.1,
    colorFunc: () => [0.1, 0.5, 0.9],
});

function makeHeightMap(rng) {
    const S = 96;
    const simplex3 = core.makeSimplexNoise();

    const heightMap = new HeightMap({
        offset: [-256 / 2, -256 / 2, 0],
        scale: 256,
        segments: 256,
        layers: {
            type: Int8Array,
            color: Int8Array,
        },
        heightFunc: (sx, sy) => {
            const a = (1 + simplex3.noise2D(sx / S, sy / S)) / 2;
            return 0.1 * a;
        },
    });

    const typeArray = heightMap.getLayerArray('type');
    const colorArray = heightMap.getLayerArray('color');

    typeArray.fill(TILE_GRASS);
    colorArray.fill(COLOR_DEFAULT);

    heightMap.colorFunc = function (sx, sy, wz, si) {
        const type = typeArray[si];
        const color = colorArray[si];

        switch (color) {
            case COLOR_DEFAULT:
            default:
                return db.tiles.get(type).colorFunc(sx, sy);
            case COLOR_YELLOW:
                return [1, 1, 0.2];
        }
    };

    //
    // Create some unwalkable regions
    //
    core.iterateCount(400, (i) => {
        const cx = rng.rangei(0, heightMap.segments);
        const cy = rng.rangei(0, heightMap.segments);

        const type = i < 40 ? TILE_BLACK : TILE_BLUE;
        const count = i < 40 ? 8 : 4;
        core.iterateBorder2D(cx, cy, count, (sx, sy) => {
            const si = heightMap.coordS2I(sx, sy);
            if (si !== -1) {
                colorArray[si] = COLOR_DEFAULT;
                typeArray[si] = type;
            }
        });
    });
    heightMap.updateMesh();

    return heightMap;
}

function EngineView() {
    const engine = useEngine(() => {
        const rng = core.makeRNG();

        const heightMap = makeHeightMap(rng);

        engine.actors.push(
            new Grid(),
            new OrbitCamera({ radius: 64, periodMS: 64000, offsetZ: 128 }), //
            new BasicLighting(),
            new GroundPlane(),
            heightMap,
            ...core.generate(60, () => new Updater(heightMap))
        );
    });

    return <EngineFrame engine={engine} recorder="three" />;
}

function pathFindBehavior(heightmap) {
    const MAX_SEARCH_DISTANCE = 60;
    const rng = core.makeRNG();

    // A few shortcuts for the accessing the heightmap
    //
    const SEGMENTS = heightmap.segments;
    const typeArray = heightmap.getLayerArray('type');
    const colorArray = heightmap.getLayerArray('color');

    const tileAt = (sx, sy) => {
        if (!(sx >= 0 && sx < SEGMENTS && sy >= 0 && sy < SEGMENTS)) {
            return null;
        }
        return db.tiles.get(typeArray[sy * SEGMENTS + sx]);
    };

    // Pathfinding object...
    //
    const pathfinder = new PathfinderGraph({
        width: heightmap.segments,
        height: heightmap.segments,
        baseCost: (a) => {
            return tileAt(a.x, a.y)?.weight ?? 0.0;
        },
        edgeCost: (a, b) => {
            const hb = heightmap.getLayerSC('height', a.x, a.y);
            const ha = heightmap.getLayerSC('height', b.x, b.y);
            return Math.max(0, hb - ha);
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
            const posA = new THREE.Vector2(rng.rangei(-192, 192), rng.rangei(-192, 192));
            const posB = new THREE.Vector2(rng.rangei(-192, 192), rng.rangei(-192, 192));
            const [sx, sy, si] = heightmap.coordW2S(posA.x, posA.y);
            const [ex, ey, ei] = heightmap.coordW2S(posB.x, posB.y);

            // Try again if the point is not valid...
            if (si === -1 || ei === -1) {
                return 'target';
            }

            // ...or it starts or ends on a non walkable tile
            const stype = typeArray[si];
            const etype = typeArray[ei];
            if (stype > 1 || etype > 1) {
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
                while (!tile || tile.weight > 10) {
                    xg = xi + Math.floor(rng.sign() + rng.range(1, jitter));
                    yg = yi + Math.floor(rng.sign() + rng.range(1, jitter));
                    tile = tileAt(xg, yg);
                    jitter += 0.2;
                }

                result = yield pathfinder.pathfind(sx, sy, xg, yg);
            }

            // Move!
            const path = result.map((g) => ({ x: g[0], y: g[1] }));
            return ['move', path, ex, ey];
        },

        move: function* (path, ex, ey) {
            let x, y;
            while (path.length) {
                ({ x, y } = path.shift());
                const si = y * heightmap.segments + x;
                colorArray[si] = COLOR_YELLOW;
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
