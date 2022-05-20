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
        const nx = x / 30;
        const ny = y / 30;
        return [
            0.5 * noise(nx, ny), //
            0.25 + 0.75 * noise(nx + 300 + ny, ny + 217 - nx),
            0.5 * 0.5 * Math.pow(noise(2 * nx, 2 * ny), 0.25),
        ];
    };

    const actors = [
        new Grid(),
        new OrbitCamera({ radius: 64 }), //
        new BasicLighting(),
        new GroundPlane(),
        new HeightMap({
            scale: 30,
            size: 128,
            heightFunc: terrain1(128, 78234),
            colorFunc,
        }),
    ];

    return (
        <ReactEx.ReadingFrame>
            <div style={{ width: 1200 }}>
                <EngineFrame actors={actors} recorder={'three'} />
            </div>
        </ReactEx.ReadingFrame>
    );
}

function terrain1(size, seed) {
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

        return h + h2 + n3;
    };
}

export class HeightMap {
    // ------------------------------------------------------------------------
    // @group Construction
    //
    constructor({
        seed = 23484,
        terrainSeed = 324,
        size = 256, //
        scale = 1.0,
        heightFunc = null,
        colorFunc = (x, y, u, v) => [1, 0, 0.5],
    } = {}) {
        this._size = size;
        this._offset = [-size / 2, -size / 2];

        this._heights = new Float32Array(size * size);
        this._heights.fill(20);
        this._rng = core.makeRNG(seed);
        this._colorFunc = colorFunc;
        this._heightFunc = heightFunc;
        this._mesh = null;

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const u = (2 * (x + 0.5)) / (size - 1);
                const v = (2 * (y + 0.5)) / (size - 1);
                const result = this._heightFunc(x, y, u, v);

                const i = y * size + x;
                this._heights[i] = scale * result;
            }
        }

        core.assert(this._heights.length === this._size * this._size);
    }

    get size() {
        return this._size;
    }

    // ------------------------------------------------------------------------
    // @group Life Cycle
    //

    init({ engine }) {
        // Rain accumulation. Adds moisture to the tiles, which should
        // go from dirt to grass.
        //
        const simplex1 = core.makeSimplexNoise(this._rng.uint31());
        const genRange = (x, y, min, max) => {
            const a = 0.5 + 0.5 * simplex1.noise2D(x / 32, y / 32);
            return min + a * (max - min);
        };
    }

    mesh({ engine }) {
        const size = this._size;
        const arrays = {
            position: new Float32Array(5 * 4 * 3 * size * size),
            normal: new Float32Array(5 * 4 * 3 * size * size),
            color: new Float32Array(5 * 4 * 3 * size * size),
            index: new Uint32Array(5 * 6 * size * size),
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
        });

        this._mesh = new THREE.Mesh(geometry, material);
        this._mesh.position.set(this._offset[0], this._offset[1], 0);
        this._mesh.castShadow = false;
        this._mesh.receiveShadow = true;

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                this._recomputeVertexAttrs(x, y, true);
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
    _recomputeVertexAttrs(x, y, init = false) {
        const size = this._size;
        x = Math.floor(x);
        y = Math.floor(y);

        if (x < 0 || x >= size || y < 0 || y >= size) {
            return;
        }
        if (!this._mesh) {
            return;
        }

        const i = y * size + x;
        console.assert(i >= 0 && i < size * size, 'Index out of range');

        const height = this._heights[i];
        const indexAttr = this._mesh.geometry.index;
        const indexArr = indexAttr.array;
        const positionAttr = this._mesh.geometry.attributes.position;
        const positionArr = positionAttr.array;
        const normalAttr = this._mesh.geometry.attributes.normal;
        const normalArr = normalAttr.array;
        const colorAttr = this._mesh.geometry.attributes.color;
        const colorArr = colorAttr.array;

        core.assert(indexArr.length === 5 * 6 * size * size);
        core.assert(positionArr.length === 5 * 4 * 3 * size * size);
        core.assert(colorArr.length === 5 * 4 * 3 * size * size);

        function sort2(a, b) {
            return a < b ? [a, b] : [b, a];
        }
        function copy2(dst, index, src) {
            dst[index + 0] = src[0];
            dst[index + 1] = src[1];
        }
        function copy3(dst, index, src) {
            dst[index + 0] = src[0];
            dst[index + 1] = src[1];
            dst[index + 2] = src[2];
        }

        const self = this;
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

        // TODO: Temp
        const color = this._colorFunc(x, y, height);

        //
        // 5 Faces with 4 vertices of 3 components for each height tile
        // Stride per quad is 12
        // 5 Faces with 6 indices for each height tile
        //
        let vi = 5 * 4 * 3 * i;
        let fi = 5 * 6 * i;

        let [z0, z1] = [0, height];
        quad(
            vi,
            fi,
            [x + 0, y + 0, z1], //
            [x + 1, y + 0, z1], //
            [x + 1, y + 1, z1], //
            [x + 0, y + 1, z1], //
            [0, 0, 1],
            color,
            1.0
        );

        [z0, z1] = sort2(x > 0 ? this._heights[i - 1] : 0, height);
        quad(
            vi + 12,
            fi + 6,
            [x + 0, y + 0, z0], //
            [x + 0, y + 0, z1], //
            [x + 0, y + 1, z1], //
            [x + 0, y + 1, z0], //
            [-1, 0, 0],
            color,
            0.8
        );

        [z0, z1] = sort2(x + 1 < size ? this._heights[i + 1] : 0, height);
        quad(
            vi + 24,
            fi + 12,
            [x + 1, y + 0, z0], //
            [x + 1, y + 1, z0], //
            [x + 1, y + 1, z1], //
            [x + 1, y + 0, z1], //
            [1, 0, 0],
            color,
            0.8
        );

        [z0, z1] = sort2(y > 0 ? this._heights[i - size] : 0, height);
        quad(
            vi + 3 * 12,
            fi + 3 * 6,
            [x + 0, y + 0, z0], //
            [x + 1, y + 0, z0], //
            [x + 1, y + 0, z1], //
            [x + 0, y + 0, z1], //
            [-1, 0, 0],
            color,
            0.6
        );

        [z0, z1] = sort2(y + 1 < size ? this._heights[i + size] : 0, height);
        quad(
            vi + 4 * 12,
            fi + 4 * 6,
            [x + 0, y + 1, z0], //
            [x + 0, y + 1, z1], //
            [x + 1, y + 1, z1], //
            [x + 1, y + 1, z0], //
            [0, 1, 0],
            color,
            0.6
        );

        positionAttr.needsUpdate = true;
        normalArr.needsUpdate = true;
        colorAttr.needsUpdate = true;
        if (init) {
            indexAttr.needsUpdate = true;
        }
    }
}
