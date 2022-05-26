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

import { Graph2 } from './astar';
import assets from 'glob:$(MONOREPO_ROOT)/source;assets/proto/**/*{.png,.asset.yaml}';

const assetURL = Object.fromEntries(assets.matches.map(({ url }) => [url.split('/').pop(), url]));

export default function () {
    return (
        <ReadingFrame>
            <h1>World</h1>

            <div style={{ margin: '6px 0' }}>
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
            layers: ['height', 'type'],
            heightFunc: (sx, sy) => {
                const a = (1 + simplex3.noise2D(sx / S, sy / S)) / 2;
                return 0.1 * a;
            },
            colorFunc: function (sx, sy) {
                const type = this.getLayerSC('type', sx, sy);
                const a = (1 + simplex3.noise2D(sx / S, sy / S)) / 2;
                return type === 0 ? [0.1, 0.5 + a / 3, a] : [1, 0, 0];
            },
        });

        engine.actors.push(
            new Grid(),
            new OrbitCamera({ radius: 32, periodMS: 64000, offsetZ: 6 }), //
            new BasicLighting(),
            new GroundPlane(),
            heightMap,
            new Updater(heightMap)
        );
    });

    return <EngineFrame engine={engine} recorder="three" />;
}

function pathFindBehavior(heightmap) {
    const rng = core.makeRNG();

    const heightArray = heightmap.getLayerArray('height');
    const typeArray = heightmap.getLayerArray('type');

    return {
        _start: function* () {
            console.log('Starting...');
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

            const adapter = new Graph2(
                heightmap.segments,
                heightmap.segments,
                () => 1,
                (a, b) => {
                    const hb = heightmap.getLayerSC('height', a.x, a.y);
                    const ha = heightmap.getLayerSC('height', b.x, b.y);
                    return Math.max(0, hb - ha);
                }
            );

            const ret = adapter.pathfind(sx, sy, ex, ey);
            const path = ret.map((g) => ({ x: g[0], y: g[1] }));

            return ['move', path];
        },
        move: function* (path) {
            while (path.length) {
                const { x, y } = path.shift();
                const si = y * heightmap.segments + x;
                if (si !== -1) {
                    heightArray[si] *= 0.99;
                    typeArray[si] = 2.0;
                    heightmap.updateSegment(x, y);
                }
                yield;
            }
            return 'target';

            /*const cur = new THREE.Vector3();
            cur.copy(posA);

            const STEP = 0.1;
            let done = false;
            let count = 0;
            do {
                const dp = posB.clone().sub(cur).clampScalar(-STEP, STEP);

                if (dp.lengthSq() < (STEP / 3) * (STEP / 3)) {
                    cur.set(posB);
                    done = true;
                } else {
                    cur.add(dp);
                }

                const [sx, sy, si] = heightmap.coordW2S(cur.x, cur.y);
                if (si !== -1) {
                    typeArray[si] = 2.0;
                    heightmap.updateSegment(sx, sy);
                }
                if (++count % 10 == 0) {
                    yield;
                }
            } while (!done);*/

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
