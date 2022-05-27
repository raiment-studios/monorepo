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

function EngineView() {
    const engine = useEngine(() => {
        const rng = core.makeRNG();

        const S = 96;
        const simplex3 = core.makeSimplexNoise();
        const grassColor = makeGrassColorFunc(256);
        const heightMap = new HeightMap({
            offset: [-256 / 2, -256 / 2, 0],
            scale: 256,
            segments: 256,
            layers: { type: Int32Array },
            heightFunc: (sx, sy) => {
                const a = (1 + simplex3.noise2D(sx / S, sy / S)) / 2;
                return 0.1 * a;
            },
            colorFunc: function (sx, sy) {
                const type = this.getLayerSC('type', sx, sy);
                const a = (1 + simplex3.noise2D(sx / S, sy / S)) / 2;
                return type === 0
                    ? grassColor(sx, sy)
                    : type === 1
                    ? [1, 1, 0.2]
                    : type === 2
                    ? [0, 0, 1]
                    : type === 3
                    ? [0.1, 0, 0]
                    : [0, 0, 1];
            },
        });

        const typeArray = heightMap.getLayerArray('type');
        iterateCount(400, (i) => {
            const cx = rng.rangei(0, heightMap.segments);
            const cy = rng.rangei(0, heightMap.segments);

            const type = i < 40 ? 3 : 2;
            const count = i < 40 ? 8 : 4;
            iterateBorder2D(cx, cy, count, (sx, sy) => {
                const si = heightMap.coordS2I(sx, sy);
                if (si !== -1) {
                    typeArray[si] = type;
                }
            });
        });
        heightMap.updateMesh();

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

function iterateCount(c, cb) {
    for (let i = 0; i < c; i++) {
        cb(i);
    }
}
function iterateBorder2D(cx, cy, width, cb) {
    for (let dy = -width; dy <= width; dy++) {
        for (let dx = -width; dx <= width; dx++) {
            cb(cx + dx, cy + dy);
        }
    }
}

function pathFindBehavior(heightmap) {
    const rng = core.makeRNG();

    const typeArray = heightmap.getLayerArray('type');

    const pathfinder = new PathfinderGraph(
        heightmap.segments,
        heightmap.segments,
        (a) => {
            const type = heightmap.getLayerSC('type', a.x, a.y);
            if (type == 2) {
                return 500;
            }
            if (type == 3) {
                return 1e20;
            }
            return 0;
        },
        (a, b) => {
            const hb = heightmap.getLayerSC('height', a.x, a.y);
            const ha = heightmap.getLayerSC('height', b.x, b.y);
            return Math.max(0, hb - ha);
        }
    );

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
            const maxDist = 60;
            const dx = ex - sx;
            const dy = ey - sy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const m = dist / maxDist;
            let result;
            if (m <= 1) {
                result = yield pathfinder.pathfind(sx, sy, ex, ey);
            } else {
                const N = heightmap.segments;
                const typeAt = (x, y) => {
                    if (!(x >= 0 && x < N && y >= 0 && y < N)) {
                        return -1;
                    }
                    return typeArray[y * N + x];
                };

                // Choose the naive "ideal" intermediate point (straight-line to the
                // target)
                const xi = Math.ceil(sx + dx / m);
                const yi = Math.ceil(sy + dy / m);

                // Make that the guess as to where we should go next
                let xg = xi;
                let yg = yi;

                let jitter = 1.0;
                while (typeAt(xg, yg) < 0 || typeAt(xg, yg) > 1) {
                    xg = xi + Math.floor(rng.sign() + rng.range(1, jitter));
                    yg = yi + Math.floor(rng.sign() + rng.range(1, jitter));
                    jitter += 0.2;
                }

                core.assert(typeAt(sx, sy) <= 1 && typeAt(xg, yg) <= 1, `Runtime error`);

                result = yield pathfinder.pathfind(sx, sy, xg, yg);
            }

            // Move!
            const path = result.map((g) => ({ x: g[0], y: g[1] }));
            return ['move', path, ex, ey];
        },

        move: function* (path, ex, ey) {
            while (path.length) {
                const { x, y } = path.shift();
                const si = y * heightmap.segments + x;
                if (si !== -1) {
                    typeArray[si] = 1;
                    heightmap.updateSegment(x, y);
                }
                if (path.length === 0) {
                    return ['moveLoop', x, y, ex, ey];
                }
                yield;
            }
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
