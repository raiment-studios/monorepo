import React from 'react';
import * as THREE from 'three';
import * as ReactEx from '../../../react-ex';
import * as core from '../../../core/src';
import {
    useEngine,
    updatePosition,
    updateBoxCollision,
    EngineFrame,
    OrbitCamera,
    GroundPlane,
    BasicLighting,
    Grid,
    HeightMap,
} from '../..';

export default function () {
    const engine = useEngine(({ engine }) => {
        const simplex2 = core.makeSimplexNoise();
        const simplex3 = core.makeSimplexNoise();
        const heightMap = new HeightMap({
            offset: [-256 / 2, -256 / 2, 0],
            scale: 256,
            segments: 256,
            heightFunc: () => 0.0005,
            colorFunc: (x, y) => {
                const rgb = [146 / 255, 201 / 255, 117 / 255];
                const a = (1 + simplex3.noise2D(x, y)) / 2;
                const b = (1 + simplex2.noise2D(x / 100, y / 100)) / 2;
                const t = 0.5 * b + 0.5;
                const s = t + a * (1 - t);
                return [rgb[0] * s, rgb[1] * s, rgb[2] * s];
            },
        });

        engine.actors.push(
            new Grid(),
            new OrbitCamera({ radius: 96 }), //
            new BasicLighting(),
            new GroundPlane(),
            heightMap,
            new Updater(heightMap),
            new Updater(heightMap)
        );
    }, []);

    return (
        <ReactEx.ReadingFrame>
            <h1>Dynamic Terrain</h1>
            <EngineFrame
                style={{ width: 960 }}
                engine={engine}
                recorder={'three'}
                autoRecord={false}
            />
        </ReactEx.ReadingFrame>
    );
}

class Updater {
    constructor(heightMap) {
        this._heightMap = heightMap;
        this._rng = core.makeRNG();
        this._heightFunc = null;

        // Note: this actor acts in "heightmap segment space", not "world space". For example,
        // the collider is set to the segment bounds, not the world heightmap bounds.
        this._position = new THREE.Vector3(0, 0, 0);
        this._velocity = new THREE.Vector3(0, 0, 0);
        this._acceleration = new THREE.Vector3(0, 0, 0);

        const S = this._heightMap.segments;
        this._collider = new THREE.Box3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(S, S, S));
    }

    get position() {
        return this._position;
    }
    get velocity() {
        return this._velocity;
    }

    get acceleration() {
        return this._acceleration;
    }

    update() {
        const rng = this._rng;

        updatePosition(this, 1);
        updateBoxCollision(this, this._collider);

        const K = 0.25;
        const MV = 2;
        this._velocity.x += K * rng.range(-1, 1);
        this._velocity.y += K * rng.range(-1, 1);
        this._velocity.clampScalar(-MV, MV);
    }

    stateMachine() {
        const rng = this._rng;

        return {
            _bind: this,
            _start: function* () {
                this._position.x = rng.range(0, this._heightMap.segments);
                this._position.y = rng.range(0, this._heightMap.segments);
                this._velocity.x = rng.sign() * rng.range(0.2, 2);
                this._velocity.y = rng.sign() * rng.range(0.2, 2);

                return 'changeTerrain';
            },
            changeTerrain: function* () {
                const seed = rng.uint31();
                this._heightFunc = terrain1(this._heightMap.segments, 0.65, seed);
                return 'update';
            },
            update: function* () {
                const D = 32;
                const MAX_DIST = Math.sqrt(2 * D * D);
                const heightMap = this._heightMap;

                const frames = rng.rangei(10, 100);
                for (let i = 0; i < frames; i++) {
                    const centerSX = Math.floor(this._position.x);
                    const centerSY = Math.floor(this._position.y);
                    for (let sy = centerSY - D, lsy = -D; sy <= centerSY + D; lsy++, sy++) {
                        for (let sx = centerSX - D, lsx = -D; sx <= centerSX + D; lsx++, sx++) {
                            if (!heightMap.coordValidS(sx, sy)) {
                                continue;
                            }
                            const [wx, wy] = heightMap.coordS2W(sx, sy);
                            const wz = heightMap.getLayerSC('height', sx, sy);

                            const tz = 512 * this._heightFunc(wx, wy);
                            let dz = tz - wz;
                            if (Math.abs(dz) < 1e-3) {
                                continue;
                            }
                            dz /= 20;

                            const normalizedDist = Math.sqrt(lsx * lsx + lsy * lsy) / MAX_DIST;
                            const k = 0.01;
                            dz *= k + (1 - k) * (1.0 - normalizedDist);
                            const nz = wz + dz;
                            heightMap.setLayerWC('height', wx, wy, nz, false);
                        }
                    }

                    const K = D + 1;
                    for (let sy = centerSY - K; sy <= centerSY + K; sy++) {
                        for (let sx = centerSX - K; sx <= centerSX + K; sx++) {
                            if (!heightMap.coordValidS(sx, sy)) {
                                continue;
                            }
                            heightMap.updateSegment(sx, sy);
                        }
                    }
                    yield;
                }

                return 'changeTerrain';
            },
        };
    }
}

function terrain1(size, heightScale, seed) {
    const rng = core.makeRNG(seed);
    const simplex = core.makeSimplexNoise(rng.uint31());
    return function (x, y, u, v) {
        const h0 = 0.5 + 0.5 * Math.sin((x / size) * 2 * Math.PI);
        const h1 = 0.5 + 0.5 * Math.sin((y / size) * 2 * Math.PI);
        const h = (h0 + h1) / 2;

        const n0 = 0.025 * simplex.noise2D((8 * x) / size, (8 * y) / size);
        const n1 = 0.5 * (0.5 + 0.5 * simplex.noise2D((2 * x) / size, (2 * y) / size));
        const h2 = n0 + n1;

        const n3 =
            0.25 *
            Math.pow(0.5 + 0.5 * simplex.noise2D((2 * x) / size + 32, (2 * y) / size + 84), 8);

        return (heightScale * (h + h2 + n3)) / 8;
    };
}
