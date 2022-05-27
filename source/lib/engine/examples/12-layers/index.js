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

import { PathfinderGraph } from './astar';

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

function EngineView() {
    const engine = useEngine(() => {
        const rng = core.makeRNG();

        const S = 96;
        const simplex2 = core.makeSimplexNoise();
        const simplex3 = core.makeSimplexNoise();
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
                    ? [0.1, 0.5 + a / 3, a]
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

    const heightArray = heightmap.getLayerArray('height');
    const typeArray = heightmap.getLayerArray('type');

    const pathfinder = new PathfinderGraph(
        heightmap.segments,
        heightmap.segments,
        (a) => {
            const type = heightmap.getLayerSC('type', a.x, a.y);
            if (type == 2) {
                return 50;
            }
            if (type == 3) {
                return 1e10;
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
            console.log('Starting...');
            return 'setObstacles';
        },
        setObstacles: function* () {
            return 'target';
        },
        target: function* () {
            const angA = rng.range(0, 2 * Math.PI);
            const angB = angA + Math.PI + (Math.PI / 20) * rng.range(-1, 1);

            const R = 125;
            const posA = new THREE.Vector3(R * Math.cos(angA), R * Math.sin(angA), 0);
            const posB = new THREE.Vector3(R * Math.cos(angB), R * Math.sin(angB), 0);

            const [sx, sy] = heightmap.coordW2S(posA.x, posA.y);
            const [ex, ey] = heightmap.coordW2S(posB.x, posB.y);

            const ret = yield pathfinder.pathfind(sx, sy, ex, ey);
            const path = ret.map((g) => ({ x: g[0], y: g[1] }));

            return ['move', path];
        },
        move: function* (path) {
            while (path.length) {
                const { x, y } = path.shift();
                const si = y * heightmap.segments + x;
                if (si !== -1) {
                    typeArray[si] = 1;
                    heightmap.updateSegment(x, y);
                }
                yield;
            }
            return 'target';
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
