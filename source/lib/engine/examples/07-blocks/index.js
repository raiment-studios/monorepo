import React from 'react';
import * as THREE from 'three';
import chroma from 'chroma-js';
import * as ReactEx from '../../../react-ex';
import * as core from '../../../core/src';
import { TextureAtlas, EngineFrame, OrbitCamera, GroundPlane, BasicLighting } from '../..';
import { Grid } from '../../src/actors/grid';

export default function () {
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

    const actors = [
        new Grid(),
        new OrbitCamera({ radius: 64 }), //
        new BasicLighting(),
        new GroundPlane(),
        new HeightMap({
            offset: [-256 / 2, -256 / 2, 0],
            scale: 256,
            segments: 256,
            heightFunc: terrain1(256, 0.65, 595),
            colorFunc,
        }),
    ];

    return (
        <ReactEx.ReadingFrame>
            <EngineFrame style={{ width: 960 }} actors={actors} recorder={'three'} />
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
