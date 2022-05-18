import React from 'react';
import * as THREE from 'three';
import chroma from 'chroma-js';
import * as ReactEx from '../../../react-ex';
import * as core from '../../../core/src';
import { EngineFrame, OrbitCamera, StateMachine, BasicLighting } from '../..';
import { Grid } from '../../src/actors/grid';

export default function () {
    const actors = [
        new Grid(),
        new OrbitCamera(), //
        new BasicLighting(),
        new GroundPlane(),
    ];

    for (let i = 0; i < 120; i++) {
        actors.push(new Sphere());
    }

    const h = new HeightMap();

    return (
        <ReactEx.ReadingFrame>
            <EngineFrame actors={actors} />
        </ReactEx.ReadingFrame>
    );
}

class GroundPlane {
    mesh() {
        const planeGeometry = new THREE.PlaneGeometry(256, 256, 32, 32);
        const planeMaterial = new THREE.MeshStandardMaterial({ color: 0xfcfcdc });
        const plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.position.set(0, 0, -0.05);
        plane.receiveShadow = true;
        return plane;
    }
}

class Sphere {
    constructor() {}
}

function terrain1(size, seed) {
    const rng = core.makeRNG(seed);
    const simplex = core.makeSimplexNoise(rng.uint31());
    return function (x, y) {
        const h0 = 0.5 + 0.5 * Math.sin((x / size) * 2 * Math.PI);
        const h1 = 0.5 + 0.5 * Math.sin((y / size) * 2 * Math.PI);
        const h = (h0 + h1) / 2;

        const n0 = 0.025 * simplex.noise2D((8 * x) / size, (8 * y) / size);
        const n1 = 0.5 * (0.5 + 0.5 * simplex.noise2D((2 * x) / size, (2 * y) / size));
        const h2 = n0 + n1;

        const n3 =
            0.25 *
            Math.pow(0.5 + 0.5 * simplex.noise2D((2 * x) / size + 32, (2 * y) / size + 84), 8);

        return {
            height: h + h2 + n3,
            moisture: 0.75,
        };
    };
}

function terrain2(size, seed) {
    const rng = core.makeRNG(seed);
    const simplex = core.makeSimplexNoise(rng.uint31());

    const ox = rng.range(-500, 500);
    const oy = rng.range(-500, 500);

    return function (x, y) {
        const h0 = 0.5 + 0.5 * Math.sin((x / size) * 2 * Math.PI + ox);
        const h1 = 0.5 + 0.5 * Math.sin((y / size) * 2 * Math.PI + oy);
        const h = (h0 + h1) / 2;

        const n0 = 0.025 * simplex.noise2D((8 * x) / size + ox, (8 * y) / size + oy);
        const n1 = 0.5 * (0.5 + 0.5 * simplex.noise2D((2 * x) / size, (2 * y) / size));
        const h2 = n0 + n1;

        const n3 =
            0.25 *
            Math.pow(0.5 + 0.5 * simplex.noise2D((2 * x) / size + 11, (2 * y) / size + 84), 3);

        return {
            height: h + h2 + n3,
            moisture: 0.0,
        };
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
        terrain = null,
    } = {}) {
        this._size = size;
        this._offset = [-size / 2, -size / 2];

        this._heights = new Float32Array(size * size);
        this._snow = new Array(size * size);
        this._moisture = new Array(size * size);
        this._type = new Uint8Array(size * size);
        this._heights.fill(20);
        this._snow.fill(0.0);
        this._moisture.fill(0.6);
        this._type.fill(0);

        console.log('H!', core);
        this._rng = core.makeRNG(seed);
        this._generateColor = this._makeGenerateColor();

        this._mesh = null;

        let func;
        if (typeof terrain === 'function') {
            func = terrain;
        } else {
            const generate =
                {
                    terrain1,
                    terrain2,
                }[terrain] || terrain1;
            func = generate(size, terrainSeed);
        }
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const u = (2 * (x + 0.5)) / (size - 1);
                const v = (2 * (y + 0.5)) / (size - 1);
                const result = func(x, y, u, v);
                const moisture = result.moisture ?? 0.75;

                const i = y * size + x;
                this._heights[i] = scale * result.height;
                this._moisture[i] = moisture;
            }
        }

        core.assert(this._heights.length === this._size * this._size);
    }

    get size() {
        return this._size;
    }

    _makeGenerateColor() {
        const rng = this._rng;
        const simplex1 = core.makeSimplexNoise(rng.uint31());

        //
        // Deterministic pseudo-randomness :)  Ensure it's random
        // but consistently the same value for each x,y.
        //
        const rngRange = (x, y, min, max) => {
            const a = 0.5 + 0.5 * simplex1.noise2D(5.2 * x, 4.9 * y);
            return min + a * (max - min);
        };
        const rngSelect = (x, y, arr) => {
            const i = Math.floor(rngRange(x, y, 0, arr.length));
            return arr[i];
        };

        function mulclamp(c, s) {
            return [
                Math.min(1, Math.max(0, c[0] * s)),
                Math.min(1, Math.max(0, c[1] * s)),
                Math.min(1, Math.max(0, c[2] * s)),
            ];
        }

        function toRGB(arr) {
            return arr.map((c) => chroma(c).gl().slice(0, 3));
        }

        const colorSet = {
            fertileSoil: toRGB([
                '#7d551e', //
                '#703e0c', //
            ]),
            yellowGrass: toRGB([
                '#ab9e49', //
                '#dbe06c', //
                '#9ba646',
            ]),
            dryDirt: toRGB([
                '#c4b79b', //
                '#bfaa95',
                '#d1bf97',
                '#a1957c',
            ]),

            stone: toRGB([
                '#ccc',
                '#aaa', //
                '#999',
            ]),
        };
        const selectFromColorSet = (x, y, set, shadeMin, shadeMax) => {
            const shade = rngRange(x, y, shadeMin, shadeMax);
            return mulclamp(rngSelect(x, y, set), shade);
        };

        return (x, y) => {
            const i = y * this._size + x;
            const type = this._type[i];
            //
            // Step 1: Use moisture value to determine base color
            //
            let color = [1, 0, 0];
            if (type > 0) {
                color = selectFromColorSet(x, y, colorSet.stone, 1.5, 1.6);
            } else {
                const colorForValue = (value) => {
                    if (value > 0.8) {
                        // Lush
                        return [
                            rngRange(x, y, 0.4, 0.6),
                            rngRange(x, y, 0.55, 0.8),
                            rngRange(x, y, 0.1, 0.2),
                        ];
                    } else if (value > 0.6) {
                        // Green grass
                        return [
                            rngRange(x, y, 0.4, 0.6),
                            rngRange(x, y, 0.55, 0.8),
                            rngRange(x, y, 0.1, 0.2),
                        ];
                    } else if (value > 0.4) {
                        // Yellow grass
                        return selectFromColorSet(x, y, colorSet.yellowGrass, 0.5, 0.9);
                    } else if (value > 0.2) {
                        // Fertile soil
                        return selectFromColorSet(x, y, colorSet.fertileSoil, 0.9, 1.1);
                    } else {
                        // Dry dirt
                        return selectFromColorSet(x, y, colorSet.dryDirt, 0.6, 0.7);
                    }
                };
                const value = Math.max(0, Math.min(1, this._moisture[i]));
                let mw = value * 5;
                let mf = mw - Math.floor(mw);

                const color1 = colorForValue(value);
                const color2 = colorForValue(value + 0.2);
                for (let i = 0; i < 3; i++) {
                    color[i] = (1 - mf) * color1[i] + mf * color2[i];
                }
            }

            //
            // Step 2: account for snow
            //
            {
                let snow = this._snow[i];
                let snowColor = [1, 1, 1];
                if (type > 0) {
                    snowColor = [2, 2, 2];
                }
                const shade = rngSelect(x, y, [0.96, 0.98, 1.0]);
                snowColor[0] *= shade;
                snowColor[1] *= shade;
                snowColor[2] *= shade;

                const alpha = 1 - Math.max(0, Math.min(1, snow));
                color[0] = color[0] * alpha + (1 - alpha) * snowColor[0];
                color[1] = color[1] * alpha + (1 - alpha) * snowColor[1];
                color[2] = color[2] * alpha + (1 - alpha) * snowColor[2];
            }

            //
            // Done
            //
            return color;
        };
    }

    // ------------------------------------------------------------------------
    // @group Mutators
    //

    heightAt(x, y) {
        const size = this._size;
        x = Math.floor(x - this._offset[0]);
        y = Math.floor(y - this._offset[1]);

        if (x >= 0 && x < size && y >= 0 && y < size) {
            return this._heights[y * size + x];
        }
        return -Infinity;
    }

    setMoistureLevel(x, y, value) {
        const size = this._size;
        x = Math.floor(x - this._offset[0]);
        y = Math.floor(y - this._offset[1]);
        if (x < 0 || y < 0 || x >= size || y >= size) {
            return;
        }
        const i = y * size + x;

        this._moisture[i] = value;
        this._recomputeVertexAttrs(x, y);
    }

    getValue(x, y, field) {
        const size = this._size;
        x = Math.floor(x - this._offset[0]);
        y = Math.floor(y - this._offset[1]);
        if (x < 0 || y < 0 || x >= size || y >= size) {
            return;
        }
        const i = y * size + x;

        switch (field) {
            case 'null':
                break;
            case 'height':
                return this._heights[i];
            case 'moisture':
                return this._moisture[i];
            case 'snow':
                return this._snow[i];
            case 'type':
                return this._type[i];
        }
    }

    setValue(x, y, field, cb) {
        const size = this._size;
        x = Math.floor(x - this._offset[0]);
        y = Math.floor(y - this._offset[1]);
        if (x < 0 || y < 0 || x >= size || y >= size) {
            return;
        }
        const i = y * size + x;

        switch (field) {
            case 'null':
                break;
            case 'height':
                this._heights[i] = cb(this._heights[i]);
                break;
            case 'moisture':
                this._moisture[i] = cb(this._moisture[i]);
                break;
            case 'snow':
                this._snow[i] = cb(this._snow[i]);
                break;
            case 'type':
                this._type[i] = cb(this._type[i]);
                break;
        }
        this._recomputeVertexAttrs(x, y);
    }

    // ------------------------------------------------------------------------
    // @group Life Cycle
    //

    _initTextureAtlas({ engine }) {
        this._textureAtlas = new engine.textures.TextureAtlas({
            atlasSize: 256,
            tileSize: 16,
        });

        const prefix = '/assets/modules/raiment-assets/base/tiles';
        const tiles = {
            white: 'white.png',
            transparent: 'transparent.png',
            debug: 'debug.png',
            grass0: 'grass.png',
            grass1: 'grass_b.png',
            stone: 'stone.png',
            road: 'road.png',
            road2: 'road2.png',
            road3: 'road3.png',
            road4: 'road4.png',
        };
        for (let [name, filename] of Object.entries(tiles)) {
            this._textureAtlas.addImage(name, `${prefix}/${filename}`);
        }
    }

    init({ engine }) {
        this._initTextureAtlas({ engine });

        engine.world.terrain = this;
        engine.world.groundHeight = (x, y) => {
            return this.heightAt(x, y);
        };

        // Soft dependency on snow
        engine.events.on('snow.accumulate', (sx, sy) => {
            this._accumulate(sx, sy, 3, (i, dx, dy) => {
                const amount = 0.025 / Math.sqrt(dx * dx + dy * dy + 1);
                this._snow[i] += amount * 6;
            });
        });

        // Rain accumulation. Adds moisture to the tiles, which should
        // go from dirt to grass.
        //
        const simplex1 = core.makeSimplexNoise(this._rng.uint31());
        const genRange = (x, y, min, max) => {
            const a = 0.5 + 0.5 * simplex1.noise2D(x / 32, y / 32);
            return min + a * (max - min);
        };
        engine.events.on('rain.accumulate', (x, y) => {
            const size = this._size;
            x = Math.floor(x - this._offset[0]);
            y = Math.floor(y - this._offset[1]);
            if (x < 0 || y < 0 || x >= size || y >= size) {
                return;
            }
            const i = y * size + x;

            const amount = 1.0;
            const scale = 5.1;
            const perm = 0.1 * genRange(x, y, 0.5, 1);
            const value = this._moisture[i];
            let extra = (1.0 - perm) * scale * amount;
            this._moisture[i] += perm * scale * amount;
            this._recomputeVertexAttrs(x, y);

            const EXTENT = 3;
            for (let dy = -EXTENT; dy <= EXTENT; dy++) {
                for (let dx = -EXTENT; extra > 1e-3 && dx <= EXTENT; dx++) {
                    if (dx === 0 && dy === 0) {
                        continue;
                    }
                    const cx = x + dx;
                    const cy = y + dy;
                    if (cx < 0 || cy < 0 || cx >= size || cy >= size) {
                        continue;
                    }
                    const i = cy * size + cx;
                    const m = this._moisture[i];
                    if (m < value) {
                        const a = (0.25 * this._rng.range(0.25, 0.5)) / (EXTENT * EXTENT);
                        this._moisture[i] += extra * a;
                        extra *= 1 - a;
                        this._recomputeVertexAttrs(cx, cy);
                    }
                }
            }
        });
    }

    update() {}
    mesh() {
        const size = this._size;
        const arrays = {
            position: new Float32Array(5 * 4 * 3 * size * size),
            normal: new Float32Array(5 * 4 * 3 * size * size),
            color: new Float32Array(5 * 4 * 3 * size * size),
            uvs: new Float32Array(5 * 4 * 2 * size * size),
            index: new Uint32Array(5 * 6 * size * size),
        };

        let geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(arrays.position, 3));
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(arrays.normal, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(arrays.color, 3));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(arrays.uvs, 2));
        geometry.setIndex(new THREE.BufferAttribute(arrays.index, 1));

        //Array.from(arrays.index));
        geometry.computeBoundingBox();

        // Add normals so this can be a phong material and lights can be used
        let material = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            shininess: 10,
            //side: THREE.DoubleSide,
            map: this._textureAtlas.texture(),
        });

        this._mesh = new THREE.Mesh(geometry, material);
        this._mesh.position.set(this._offset[0], this._offset[1], 0);

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                this._recomputeVertexAttrs(x, y, true);
            }
        }
        geometry.computeBoundingBox();
        material.vertexColors = true;
        material.needsUpdate = true;

        this._mesh.castShadow = false;
        this._mesh.receiveShadow = true;

        return this._mesh;
    }

    // ------------------------------------------------------------------------
    // @group Private methods
    //

    _accumulate(sx, sy, extent, cb) {
        const size = this._size;
        sx = Math.floor(sx - this._offset[0]);
        sy = Math.floor(sy - this._offset[1]);
        if (sx < 0 || sy < 0 || sx >= size || sy >= size) {
            return;
        }

        for (let dy = -extent; dy <= extent; dy++) {
            for (let dx = -extent; dx <= extent; dx++) {
                const x = Math.floor(sx + dx);
                const y = Math.floor(sy + dy);
                if (x < 0 || x >= size || y < 0 || y >= size) {
                    continue;
                }

                const i = y * size + x;
                cb(i, dx, dy, x, y);
            }
        }
        extent += 1;
        for (let dy = -extent; dy <= extent; dy++) {
            for (let dx = -extent; dx <= extent; dx++) {
                const x = Math.floor(sx + dx);
                const y = Math.floor(sy + dy);
                if (x < 0 || x >= size || y < 0 || y >= size) {
                    continue;
                }
                this._recomputeVertexAttrs(x, y);
            }
        }
    }

    _simplex1 = core.makeSimplexNoise(2346623);

    //
    // Deterministic pseudo-randomness :)  Ensure it's random
    // but consistently the same value for each x,y.
    //
    rngRange(x, y, min, max) {
        const a = 0.5 + 0.5 * this._simplex1.noise2D(5.2 * x, 4.9 * y);
        return min + a * (max - min);
    }

    rngSelect(x, y, arr) {
        const i = Math.floor(this.rngRange(x, y, 0, arr.length));
        return arr[i];
    }

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
        const type = this._type[i];

        const indexAttr = this._mesh.geometry.index;
        const indexArr = indexAttr.array;
        const positionAttr = this._mesh.geometry.attributes.position;
        const positionArr = positionAttr.array;
        const normalAttr = this._mesh.geometry.attributes.normal;
        const normalArr = normalAttr.array;
        const colorAttr = this._mesh.geometry.attributes.color;
        const colorArr = colorAttr.array;
        const uvAttr = this._mesh.geometry.attributes.uv;
        const uvArr = uvAttr.array;

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

        const atlas = this._textureAtlas;
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

            // if type == stone, 5, 0
            // else t = 0,0
            let textureName = 'white';
            if (type > 0) {
                textureName = self.rngSelect(fi, 7 * fi, [
                    'road',
                    'road',
                    'road2',
                    'road3',
                    'road4',
                ]);
            }
            const [u0, v0, u1, v1] = atlas.uv(textureName);
            copy2(uvArr, Math.floor((vi * 2) / 3) + 0, [u0, v0]);
            copy2(uvArr, Math.floor((vi * 2) / 3) + 2, [u1, v0]);
            copy2(uvArr, Math.floor((vi * 2) / 3) + 4, [u1, v1]);
            copy2(uvArr, Math.floor((vi * 2) / 3) + 6, [u0, v1]);

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
        const color = this._generateColor(x, y);

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
            0.9
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
            0.9
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
            0.8
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
            0.8
        );

        positionAttr.needsUpdate = true;
        normalArr.needsUpdate = true;
        colorAttr.needsUpdate = true;
        uvAttr.needsUpdate = true;
        if (init) {
            indexAttr.needsUpdate = true;
        }
    }
}
