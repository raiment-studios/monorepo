import * as THREE from 'three';
import * as core from '@raiment/core';

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
        opacity = 1.0,
    } = {}) {
        this._offset = offset;
        this._scale = scale;
        this._segments = segments;
        this._opacity = opacity;

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
    // @group Engine methods
    // ------------------------------------------------------------------------

    worldGroundHeight(wx, wy) {
        return this.getLayerWC('height', wx, wy);
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
        //
        const materialOptions = {
            color: 0xffffff,
            shininess: 10,
            //side: THREE.DoubleSide,
        };
        if (this._opacity < 1.0) {
            materialOptions.opacity = this._opacity;
            materialOptions.transparent = true;
        }
        let material = new THREE.MeshPhongMaterial(materialOptions);

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
            0.95
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
            0.95
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
            0.9
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
            0.9
        );

        positionAttr.needsUpdate = true;
        normalArr.needsUpdate = true;
        colorAttr.needsUpdate = true;
        if (init) {
            indexAttr.needsUpdate = true;
        }
    }
}
