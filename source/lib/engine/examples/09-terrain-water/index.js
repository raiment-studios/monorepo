import React from 'react';
import * as THREE from 'three';
import * as ReactEx from '../../../react-ex';
import * as core from '../../../core/src';
import { useEngine, EngineFrame, OrbitCamera, GroundPlane, BasicLighting } from '../..';
import { Grid } from '../../src/actors/grid';

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

function updatePosition(actor, dt) {
    actor.velocity.addScaledVector(actor.acceleration, dt);
    actor.position.addScaledVector(actor.velocity, dt);
}

function updateBoxCollision(actor, box) {
    const dimensions = ['x', 'y', 'z'];
    const epsilon = 1e-6;

    for (let dim of dimensions) {
        if (actor.position[dim] <= box.min[dim]) {
            actor.position[dim] = box.min[dim] + epsilon;
            actor.velocity[dim] = Math.abs(actor.velocity[dim]);
        }
        if (actor.position[dim] >= box.max[dim]) {
            actor.position[dim] = box.max[dim] - epsilon;
            actor.velocity[dim] = -Math.abs(actor.velocity[dim]);
        }
    }
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

/**
 * Generates a unit terrain where, by default, it has size = 1 that covers the
 * area from 0,0 to 1,1 with `segments` number of quads covering that area.
 *
 * Changing `size` will internally scale the object to cover 0,0 to size, size.
 * The heightFunc will also be scaled by size.
 *
 * The "blocks" of the heightmap are referred to as segments.
 */
export class HeightMap {
    // ------------------------------------------------------------------------
    // @group Construction
    // ------------------------------------------------------------------------

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

        this._layers = {
            height: new Float32Array(segments * segments),
        };
        this._layers.height.fill(0);
        this._colorFunc = colorFunc;
        this._heightFunc = heightFunc;
        this._mesh = null;

        for (let y = 0; y < segments; y++) {
            for (let x = 0; x < segments; x++) {
                const u = (x + 0.5) / (segments - 1);
                const v = (y + 0.5) / (segments - 1);

                const i = y * segments + x;

                // Heights are "pre-scaled"
                this._layers.height[i] = this._heightFunc(scale * u, scale * v, u, v) * this._scale;
            }
        }

        core.assert(this._layers.height.length === this._segments * this._segments);
    }

    // ------------------------------------------------------------------------
    // @Properites
    // ------------------------------------------------------------------------

    get offset() {
        return this._offset;
    }
    get scale() {
        return this._scale;
    }

    get segments() {
        return this._segments;
    }

    // ------------------------------------------------------------------------
    // @group Coordinate systems
    // ------------------------------------------------------------------------

    // World -> Segment
    coordW2S(wx, wy) {
        const s = this._segments / this._scale;
        const sx = Math.floor((wx - this._offset[0]) * s);
        const sy = Math.floor((wy - this._offset[1]) * s);
        if (sx >= 0 && sx < this._segments && sy >= 0 && sy < this._segments) {
            return [sx, sy, sy * this._segments + sx];
        }
        return [-1, -1, -1];
    }

    coordS2W(sx, sy) {
        const wx = ((sx + 0.5) * this._scale) / this._segments + this._offset[0];
        const wy = ((sy + 0.5) * this._scale) / this._segments + this._offset[1];
        return [wx, wy];
    }
    coordValidS(sx, sy) {
        return sx >= 0 && sx < this._segments && sy >= 0 && sy < this._segments;
    }

    // ------------------------------------------------------------------------
    // @group Layer manipulation
    // ------------------------------------------------------------------------

    getLayerWC(layerName, wx, wy) {
        const [sx, sy] = this.coordW2S(wx, wy);
        return this.getLayerSC(layerName, sx, sy);
    }

    setLayerWC(layerName, wx, wy, value, updateMesh = true) {
        const [sx, sy] = this.coordW2S(wx, wy);
        this.setLayerSC(layerName, sx, sy, value, updateMesh);
    }

    getLayerSC(layerName, sx, sy) {
        const i = sy * this._segments + sx;
        return this._layers[layerName][i];
    }

    setLayerSC(layerName, sx, sy, value, updateMesh = true) {
        const index = sy * this._segments + sx;
        if (index === -1) {
            return;
        }
        this._layers[layerName][index] = value;

        // The quads to the side of each segment depend on the height of the neighbor,
        // so the neighbors need to be updated as well. Thus, is a large region is being
        // updated, it likely is more efficient to make all changes then update the
        // region rather than updating segment by segment.
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

    // ------------------------------------------------------------------------
    // @group Mesh
    //

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

        const heights = this._layers.height;
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

        const color = this._colorFunc(sx, sy, heights[i]);
        const scale0 = this._scale / this._segments;

        const x0 = sx * scale0;
        const x1 = (sx + 1) * scale0;
        const y0 = sy * scale0;
        const y1 = (sy + 1) * scale0;
        let [z0, z1] = [0, heights[i]];

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

        [z0, z1] = sort2(sx > 0 ? heights[i - 1] : 0, heights[i]);
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

        [z0, z1] = sort2(sx + 1 < segments ? heights[i + 1] : 0, heights[i]);
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

        [z0, z1] = sort2(sy > 0 ? heights[i - segments] : 0, heights[i]);
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

        [z0, z1] = sort2(sy + 1 < segments ? heights[i + segments] : 0, heights[i]);
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
