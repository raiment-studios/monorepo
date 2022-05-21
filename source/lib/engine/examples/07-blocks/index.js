import React from 'react';
import * as THREE from 'three';
import * as ReactEx from '../../../react-ex';
import * as core from '../../../core/src';
import { useEngine, EngineFrame, OrbitCamera, GroundPlane, BasicLighting } from '../..';
import { Grid } from '../../src/actors/grid';

export default function () {
    const engine = useEngine(({ engine }) => {
        const simplex = core.makeSimplexNoise(4378);
        const noise = (...args) => (1 + simplex.noise2D(...args)) / 2;
        const colorFunc = (x, y) => {
            const nx = x / 100;
            const ny = y / 100;
            return [
                0.15 * 0.85 * noise(101 + nx * 80, ny * 80), //
                0.35 + 0.35 * noise(nx + 300 + ny, ny + 217 - nx),
                0.1 * 0.25 * Math.pow(noise(2 * nx, 2 * ny), 0.25),
            ];
        };

        const builder = {
            heightFunc: terrain1(256, 0.65, 595),
        };

        const rng = core.makeRNG();
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
                const t = 0.3 * b + 0.7;
                const s = t + a * (1 - t);
                return [rgb[0] * s, rgb[1] * s, rgb[2] * s];
            },
        });

        class Updater {
            constructor() {
                this._centerX = 0;
                this._centerY = 0;
            }

            update() {
                this._centerX += this._velocityX;
                this._centerY += this._velocityY;

                if (this._centerX < 0) {
                    this._centerX = 0;
                    this._velocityX = Math.abs(this._velocityX);
                }
                if (this._centerX > 256) {
                    this._centerX = 256;
                    this._velocityX = -Math.abs(this._velocityX);
                }

                if (this._centerY < 0) {
                    this._centerY = 0;
                    this._velocityY = Math.abs(this._velocityY);
                }
                if (this._centerX > 256) {
                    this._centerX = 256;
                    this._velocityY = -Math.abs(this._velocityY);
                }

                const K = 0.25;
                const MV = 2;
                this._velocityX += K * rng.range(-1, 1);
                this._velocityY += K * rng.range(-1, 1);
                this._velocityX = Math.max(-MV, Math.min(MV, this._velocityX));
                this._velocityY = Math.max(-MV, Math.min(MV, this._velocityY));
            }

            stateMachine() {
                const rng = core.makeRNG();
                return {
                    _bind: this,
                    _start: function* () {
                        this._centerX = rng.range(0, 256);
                        this._centerY = rng.range(0, 256);
                        this._velocityX = rng.sign() * rng.range(0.2, 2);
                        this._velocityY = rng.sign() * rng.range(0.2, 2);

                        return 'update';
                    },
                    changeTerrain: function* () {
                        const seed = rng.uint31();
                        builder.heightFunc = terrain1(256, 0.65, seed);
                        return 'update';
                    },
                    update: function* () {
                        const D = 32;
                        const MAX_DIST = Math.sqrt(2 * D * D);

                        const frames = rng.rangei(10, 100);
                        for (let i = 0; i < frames; i++) {
                            const centerSX = Math.floor(this._centerX);
                            const centerSY = Math.floor(this._centerY);
                            for (let sy = centerSY - D, lsy = -D; sy <= centerSY + D; lsy++, sy++) {
                                for (
                                    let sx = centerSX - D, lsx = -D;
                                    sx <= centerSX + D;
                                    lsx++, sx++
                                ) {
                                    if (!heightMap.validSegment(sx, sy)) {
                                        continue;
                                    }
                                    const [wx, wy] = heightMap.segToWorld(sx, sy);
                                    const wz = heightMap.heightAtSegment(sx, sy);

                                    const tz = 512 * builder.heightFunc(wx, wy);
                                    let dz = tz - wz;
                                    if (Math.abs(dz) < 1e-3) {
                                        continue;
                                    }
                                    dz /= 20;

                                    const normalizedDist =
                                        Math.sqrt(lsx * lsx + lsy * lsy) / MAX_DIST;
                                    const k = 0.01;
                                    dz *= k + (1 - k) * (1.0 - normalizedDist);
                                    const nz = wz + dz;
                                    heightMap.setHeightAt(wx, wy, nz, false);
                                }
                            }

                            const K = D + 1;
                            for (let sy = centerSY - K; sy <= centerSY + K; sy++) {
                                for (let sx = centerSX - K; sx <= centerSX + K; sx++) {
                                    if (!heightMap.validSegment(sx, sy)) {
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

        engine.actors.push(
            new Grid(),
            new OrbitCamera({ radius: 96 }), //
            new BasicLighting(),
            new GroundPlane(),
            heightMap,
            new Updater(),
            new Updater()
        );
    }, []);

    return (
        <ReactEx.ReadingFrame>
            <EngineFrame
                style={{ width: 960 }}
                engine={engine}
                recorder={'three'}
                autoRecord={true}
            />
        </ReactEx.ReadingFrame>
    );
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

class Layer {}

/**
 * Generates a unit terrain where, by default, it has size = 1 that covers the
 * area from 0,0 to 1,1 with `segments` number of quads covering that area.
 *
 * Changing `size` will internally scale the object to cover 0,0 to size, size.
 * The heightFunc will also be scaled by size.
 */
export class HeightMap {
    // ------------------------------------------------------------------------
    // @group Construction
    //
    constructor({
        offset = [0, 0, 0],
        scale = 1.0,
        segments = 16,
        heightFunc = null,
        colorFunc = (x, y, u, v) => [1, 0, 0.5],
    } = {}) {
        this._offset = offset;
        this._scale = scale;
        this._segments = segments;

        this._heights = new Float32Array(segments * segments);
        this._heights.fill(0);
        this._colorFunc = colorFunc;
        this._heightFunc = heightFunc;
        this._mesh = null;

        for (let y = 0; y < segments; y++) {
            for (let x = 0; x < segments; x++) {
                const u = (x + 0.5) / (segments - 1);
                const v = (y + 0.5) / (segments - 1);

                const i = y * segments + x;

                // Heights are "pre-scaled"
                this._heights[i] = this._heightFunc(scale * u, scale * v, u, v) * this._scale;
            }
        }

        core.assert(this._heights.length === this._segments * this._segments);
    }

    // ------------------------------------------------------------------------
    // @group
    //

    worldToSegmentPosition(wx, wy, p = {}) {
        const s = this._segments / this._scale;
        p.sx = Math.floor((wx - this._offset[0]) * s);
        p.sy = Math.floor((wy - this._offset[1]) * s);
        p.valid = p.sx >= 0 && p.sx < this._segments && p.sy >= 0 && p.sy < this._segments;
        p.index = p.sy * this._segments + p.sx;
        return p;
    }

    segToWorld(sx, sy) {
        const wx = ((sx + 0.5) * this._scale) / this._segments + this._offset[0];
        const wy = ((sy + 0.5) * this._scale) / this._segments + this._offset[1];
        return [wx, wy];
    }

    heightAt(wx, wy) {
        const { index, valid } = this.worldToSegmentPosition(wx, wy);
        if (!valid) {
            return -Infinity;
        }
        return this._heights[index];
    }

    validSegment(sx, sy) {
        return sx >= 0 && sx < this._segments && sy >= 0 && sy < this._segments;
    }

    heightAtSegment(sx, sy) {
        const i = sy * this._segments + sx;
        return this._heights[i];
    }

    setHeightAt(wx, wy, wz, updateMesh = true) {
        const { sx, sy, index, valid } = this.worldToSegmentPosition(wx, wy);
        if (!valid) {
            return -Infinity;
        }
        this._heights[index] = wz;

        if (updateMesh) {
            for (let y = sy - 1; y <= sy + 1; y++) {
                for (let x = sx - 1; x <= sx + 1; x++) {
                    if (x >= 0 && x < this._segments && y >= 0 && y < this._segments) {
                        this._recomputeVertexAttrs(x, y, false);
                    }
                }
            }
        }
    }

    updateSegment(sx, sy) {
        this._recomputeVertexAttrs(sx, sy, false);
    }

    updateMesh() {
        const segs = this._segments;
        for (let sy = 0; sy < segs; sy++) {
            for (let sx = 0; sx < segs; sx++) {
                this._recomputeVertexAttrs(sx, sy, false);
            }
        }
    }

    // ------------------------------------------------------------------------
    // @group Life Cycle
    //

    mesh({ engine }) {
        const segs = this._segments;
        const arrays = {
            position: new Float32Array(5 * 4 * 3 * segs * segs),
            normal: new Float32Array(5 * 4 * 3 * segs * segs),
            color: new Float32Array(5 * 4 * 3 * segs * segs),
            index: new Uint32Array(5 * 6 * segs * segs),
        };

        let geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(arrays.position, 3));
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(arrays.normal, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(arrays.color, 3));
        geometry.setIndex(new THREE.BufferAttribute(arrays.index, 1));

        geometry.computeBoundingBox();

        // Add normals so this can be a phong material and lights can be used
        let material = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            shininess: 10,
            //side: THREE.DoubleSide,
        });

        this._mesh = new THREE.Mesh(geometry, material);
        this._mesh.position.set(...this._offset);
        this._mesh.castShadow = false;
        this._mesh.receiveShadow = true;

        for (let sy = 0; sy < segs; sy++) {
            for (let sx = 0; sx < segs; sx++) {
                this._recomputeVertexAttrs(sx, sy, true);
            }
        }
        geometry.computeBoundingBox();
        material.vertexColors = true;
        material.needsUpdate = true;

        return this._mesh;
    }

    // ------------------------------------------------------------------------
    // @group Private methods
    //

    /**
     *
     * @todo: Merge this with the build function to encapsulate the dependencies on the
     * array layout (i.e. avoid either hard-coded indexing in lots of different places or
     * low-level abstracted functions that complicate the code).
     */
    _recomputeVertexAttrs(sx, sy, init = false) {
        const segments = this._segments;
        sx = Math.floor(sx);
        sy = Math.floor(sy);

        if (sx < 0 || sx >= segments || sy < 0 || sy >= segments) {
            return;
        }
        if (!this._mesh) {
            return;
        }

        const i = sy * segments + sx;
        console.assert(i >= 0 && i < segments * segments, 'Index out of range');

        const height = this._heights[i];
        const indexAttr = this._mesh.geometry.index;
        const indexArr = indexAttr.array;
        const positionAttr = this._mesh.geometry.attributes.position;
        const positionArr = positionAttr.array;
        const normalAttr = this._mesh.geometry.attributes.normal;
        const normalArr = normalAttr.array;
        const colorAttr = this._mesh.geometry.attributes.color;
        const colorArr = colorAttr.array;

        core.assert(indexArr.length === 5 * 6 * segments * segments);
        core.assert(positionArr.length === 5 * 4 * 3 * segments * segments);
        core.assert(colorArr.length === 5 * 4 * 3 * segments * segments);

        function sort2(a, b) {
            return a < b ? [a, b] : [b, a];
        }
        function copy3(dst, index, src) {
            dst[index + 0] = src[0];
            dst[index + 1] = src[1];
            dst[index + 2] = src[2];
        }

        function quad(vi, fi, p0, p1, p2, p3, normal, color, shade) {
            copy3(positionArr, vi + 0, p0);
            copy3(positionArr, vi + 3, p1);
            copy3(positionArr, vi + 6, p2);
            copy3(positionArr, vi + 9, p3);

            copy3(normalArr, vi + 0, normal);
            copy3(normalArr, vi + 3, normal);
            copy3(normalArr, vi + 6, normal);
            copy3(normalArr, vi + 9, normal);

            const c = [
                color[0] * shade, //
                color[1] * shade,
                color[2] * shade,
            ];
            copy3(colorArr, vi + 0, c);
            copy3(colorArr, vi + 3, c);
            copy3(colorArr, vi + 6, c);
            copy3(colorArr, vi + 9, c);

            // This should be a noop for the update case
            if (init) {
                indexArr[fi + 0] = vi / 3 + 0;
                indexArr[fi + 1] = vi / 3 + 1;
                indexArr[fi + 2] = vi / 3 + 2;

                indexArr[fi + 3] = vi / 3 + 2;
                indexArr[fi + 4] = vi / 3 + 3;
                indexArr[fi + 5] = vi / 3 + 0;
            }
        }

        const color = this._colorFunc(sx, sy, height);
        const scale0 = this._scale / this._segments;

        const x0 = sx * scale0;
        const x1 = (sx + 1) * scale0;
        const y0 = sy * scale0;
        const y1 = (sy + 1) * scale0;
        let [z0, z1] = [0, height];

        //
        // 5 Faces with 4 vertices of 3 components for each height tile
        // Stride per quad is 12
        // 5 Faces with 6 indices for each height tile
        //
        let vi = 5 * 4 * 3 * i;
        let fi = 5 * 6 * i;

        quad(
            vi,
            fi,
            [x0, y0, z1], //
            [x1, y0, z1], //
            [x1, y1, z1], //
            [x0, y1, z1], //
            [0, 0, 1],
            color,
            1.0
        );

        [z0, z1] = sort2(sx > 0 ? this._heights[i - 1] : 0, height);
        quad(
            vi + 12,
            fi + 6,
            [x0, y0, z0], //
            [x0, y0, z1], //
            [x0, y1, z1], //
            [x0, y1, z0], //
            [-1, 0, 0],
            color,
            0.9
        );

        [z0, z1] = sort2(sx + 1 < segments ? this._heights[i + 1] : 0, height);
        quad(
            vi + 24,
            fi + 12,
            [x1, y0, z0], //
            [x1, y1, z0], //
            [x1, y1, z1], //
            [x1, y0, z1], //
            [1, 0, 0],
            color,
            0.9
        );

        [z0, z1] = sort2(sy > 0 ? this._heights[i - segments] : 0, height);
        quad(
            vi + 3 * 12,
            fi + 3 * 6,
            [x0, y0, z0], //
            [x1, y0, z0], //
            [x1, y0, z1], //
            [x0, y0, z1], //
            [-1, 0, 0],
            color,
            0.8
        );

        [z0, z1] = sort2(sy + 1 < segments ? this._heights[i + segments] : 0, height);
        quad(
            vi + 4 * 12,
            fi + 4 * 6,
            [x0, y1, z0], //
            [x0, y1, z1], //
            [x1, y1, z1], //
            [x1, y1, z0], //
            [0, 1, 0],
            color,
            0.8
        );

        positionAttr.needsUpdate = true;
        normalArr.needsUpdate = true;
        colorAttr.needsUpdate = true;
        if (init) {
            indexAttr.needsUpdate = true;
        }
    }
}
