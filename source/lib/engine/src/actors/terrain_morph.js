import * as core from '../../../core';
import * as THREE from 'three';
import { Actor } from '../engine/actor';
import { componentEvents, componentPhysicsPVA, componentSelfColliderBox3 } from '..';

export class TerrainMorphBase extends Actor {
    constructor({ heightMap, ...rest }) {
        super(rest);

        const S = heightMap.segments;

        this.mixin(componentEvents);
        this.mixin(componentPhysicsPVA, { update: true });
        this.mixin(componentSelfColliderBox3, {
            box: new THREE.Box3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(S, S, S)),
        });

        this._heightMap = heightMap;
    }

    updateInterval() {
        return 20;
    }

    update({ engine }) {
        const rng = engine.rng;

        const K = 0.25 / this.updateInterval();
        const MV = 2;
        this.velocity.x += K * rng.range(-1, 1);
        this.velocity.y += K * rng.range(-1, 1);
        this.velocity.clampScalar(-MV, MV);
    }

    _resetPositionVelocity(rng) {
        this.position.x = rng.range(0, this._heightMap.segments);
        this.position.y = rng.range(0, this._heightMap.segments);
        this.velocity.x = rng.sign() * rng.range(0.2, 2);
        this.velocity.y = rng.sign() * rng.range(0.2, 2);
    }
}

export class TerrainMorphHeight extends TerrainMorphBase {
    constructor({ heightMap, heightScale = 512, ...rest } = {}) {
        super({ heightMap, ...rest });

        this._heightFunc = null;
        this._heightScale = heightScale;
    }

    stateMachine({ engine }) {
        const rng = engine.rng;
        const heightMap = this._heightMap;
        const heightArray = heightMap.getLayerArray('height');
        const malleabilityArray = heightMap.getLayerArray('malleability');

        return {
            _bind: this,
            _start: function* () {
                this._resetPositionVelocity(rng);
                return 'changeTerrain';
            },
            changeTerrain: function* () {
                yield rng.rangei(30, 120);
                const simplex = core.makeSimplexNoise(4342);
                const amplitude = 0.04 * rng.range(0.4, 5);
                const ox = rng.range(-1000, 1000);
                const oy = rng.range(-1000, 1000);
                const s = 1 / (rng.range(0.5, 2) * this._heightMap.segments);
                const base = rng.range(0, 0.02);
                this._heightFunc = (x, y) =>
                    base + amplitude * (0.5 + 0.5 * simplex.noise2D(ox + x * s, oy + y * s));
                return 'update';
            },
            update: function* () {
                const D = 32;
                const MAX_DIST = Math.sqrt(2 * D * D);

                const frames = rng.rangei(10, 100);
                const pen = new core.Cursor2D(heightMap.segments, heightMap.segments);

                for (let i = 0; i < frames; i++) {
                    const centerSX = Math.floor(this.position.x);
                    const centerSY = Math.floor(this.position.y);

                    pen.border(centerSX, centerSY, D, (sx, sy) => {
                        const si = sy * heightMap.segments + sx;
                        const lsx = sx - centerSX;
                        const lsy = sy - centerSY;

                        const [wx, wy] = heightMap.coordS2W(sx, sy);
                        const wz = heightArray[si];

                        const tz = this._heightScale * this._heightFunc(wx, wy);
                        let dz = tz - wz;
                        if (Math.abs(dz) < 1e-3) {
                            return;
                        }
                        dz /= 20;

                        const normalizedDist = Math.sqrt(lsx * lsx + lsy * lsy) / MAX_DIST;
                        const k = 0.01;
                        dz *= k + (1 - k) * (1.0 - normalizedDist);

                        const m = malleabilityArray[si];
                        dz *= m;

                        heightArray[si] = wz + dz;
                    });

                    pen.border(centerSX, centerSY, D + 1, (sx, sy) => {
                        heightMap.updateSegmentHeight(sx, sy);
                    });
                    yield 2;
                }

                return 'changeTerrain';
            },
        };
    }
}

export class TerrainMorphAverage extends TerrainMorphBase {
    constructor({ ...rest }) {
        super(rest);
    }

    stateMachine({ engine, actor }) {
        const rng = engine.rng;
        const heightMap = this._heightMap;
        const heightArray = heightMap.getLayerArray('height');
        const malleabilityArray = heightMap.getLayerArray('malleability');

        return {
            _bind: actor,
            _start: function* () {
                this._resetPositionVelocity(rng);
                return 'update';
            },
            update: function* () {
                const D = 32;

                const frames = rng.rangei(10, 100);
                const pen = new core.Cursor2D(heightMap.segments, heightMap.segments);

                for (let i = 0; i < frames; i++) {
                    const centerSX = Math.floor(this.position.x);
                    const centerSY = Math.floor(this.position.y);

                    const stats = new core.SimpleStats();
                    pen.border(centerSX, centerSY, D, (sx, sy) => {
                        const si = sy * heightMap.segments + sx;
                        const wz = heightArray[si];
                        stats.add(wz);
                    });

                    const avg = stats.average();
                    pen.border(centerSX, centerSY, D, (sx, sy, { index: si, distance }) => {
                        const wz = heightArray[si];
                        const m = malleabilityArray[si];
                        const a = m * 0.25 * (1 - core.clamp(distance / D, 0, 1));
                        heightArray[si] = wz * (1 - a) + avg * a;
                    });

                    pen.border(centerSX, centerSY, D + 1, (sx, sy) => {
                        heightMap.updateSegmentHeight(sx, sy);
                    });
                    yield 2;
                }

                yield rng.rangei(10, 30);
                return 'update';
            },
        };
    }
}
