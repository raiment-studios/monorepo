import * as THREE from 'three';
import * as core from '@raiment/core';
import { isEqual } from 'lodash';

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
        colorFunc = (sx, sy, si, worldHeight) => [1, 0, 0.5],
        opacity = 1.0,
        layers = {},
        isGround = true,
    } = {}) {
        this._offset = offset;
        this._scale = scale;
        this._segments = segments;
        this._opacity = opacity;
        this._layers = {};
        this._colorFunc = colorFunc;
        this._heightFunc = heightFunc;
        this._mesh = null;

        this.addLayer('height', { type: Float32Array });
        for (let [layerName, options] of Object.entries(layers)) {
            this.addLayer(layerName, options);
        }

        for (let y = 0; y < segments; y++) {
            for (let x = 0; x < segments; x++) {
                const u = (x + 0.5) / (segments - 1);
                const v = (y + 0.5) / (segments - 1);

                const i = y * segments + x;

                // Heights are "pre-scaled"
                this._layers.height.array[i] =
                    this._heightFunc(scale * u, scale * v, u, v) * this._scale;
            }
        }

        if (isGround) {
            this.worldGroundHeight = (wx, wy) => {
                return this.getLayerWC('height', wx, wy);
            };
        }
    }

    // ------------------------------------------------------------------------
    // @group Properties
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

    get layers() {
        return this._layers;
    }

    get colorFunc() {
        return this._colorFunc;
    }

    set colorFunc(value) {
        this._colorFunc = value;
    }

    // ------------------------------------------------------------------------
    // @group Engine methods
    // ------------------------------------------------------------------------

    initMesh(ctx) {
        return this._createMesh(ctx);
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

    coordW2I(wx, wy) {
        const N = this._segments;
        const s = N / this._scale;
        const sx = Math.floor((wx - this._offset[0]) * s);
        const sy = Math.floor((wy - this._offset[1]) * s);
        if (sx >= 0 && sx < N && sy >= 0 && sy < N) {
            return sy * N + sx;
        }
        return -1;
    }

    coordS2W(sx, sy) {
        const wx = ((sx + 0.5) * this._scale) / this._segments + this._offset[0];
        const wy = ((sy + 0.5) * this._scale) / this._segments + this._offset[1];
        return [wx, wy];
    }

    coordS2I(sx, sy) {
        const N = this._segments;
        if (sx >= 0 && sx < N && sy >= 0 && sy < N) {
            return sy * N + sx;
        }
        return -1;
    }

    coordValidS(sx, sy) {
        return sx >= 0 && sx < this._segments && sy >= 0 && sy < this._segments;
    }

    // ------------------------------------------------------------------------
    // @group Layer manipulation
    // ------------------------------------------------------------------------

    addLayer(layerName, { type, ...rest }) {
        const N = this.segments;
        const layer = new Layer(layerName, N, N, type, rest);
        this._layers[layerName] = layer;
    }

    getLayerArray(layerName) {
        const arr = this._layers[layerName]?.array;
        if (!arr) {
            throw new Error(`Unknown layer '${layer}'`);
        }
        return arr;
    }

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
        return this._layers[layerName].array[i];
    }

    setLayerSC(layerName, sx, sy, value, updateMesh = true) {
        const index = sy * this._segments + sx;
        if (index === -1) {
            return;
        }
        this._layers[layerName].array[index] = value;

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
    // ------------------------------------------------------------------------

    updateSegment(sx, sy) {
        this._recomputeVertexAttrs(sx, sy, false);
    }

    updateSegmentHeight(sx, sy) {
        this._recomputeVertexHeight(sx, sy);
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
    // @group Private methods
    // ------------------------------------------------------------------------

    _createMesh({ engine }) {
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

    /**
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

        const heights = this._layers.height.array;
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
            positionArr[vi + 0] = p0[0];
            positionArr[vi + 1] = p0[1];
            positionArr[vi + 2] = p0[2];

            positionArr[vi + 3] = p1[0];
            positionArr[vi + 4] = p1[1];
            positionArr[vi + 5] = p1[2];

            positionArr[vi + 6] = p2[0];
            positionArr[vi + 7] = p2[1];
            positionArr[vi + 8] = p2[2];

            positionArr[vi + 9] = p3[0];
            positionArr[vi + 10] = p3[1];
            positionArr[vi + 11] = p3[2];

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

        const color = this._colorFunc(sx, sy, heights[i], i);
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

    /**
     * Specialization of _recomputeVertexAttrs that only updates height.
     *
     * Given this can be called quite frequently, this optimization can be worth the
     * duplicated code.
     */
    _recomputeVertexHeight(sx, sy) {
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

        const heights = this._layers.height.array;
        const positionAttr = this._mesh.geometry.attributes.position;
        const positionArr = positionAttr.array;

        core.assert(positionArr.length === 5 * 4 * 3 * segments * segments);

        function sort2(a, b) {
            return a < b ? [a, b] : [b, a];
        }

        function quad(vi, p0, p1, p2, p3) {
            positionArr[vi + 2] = p0;
            positionArr[vi + 5] = p1;
            positionArr[vi + 8] = p2;
            positionArr[vi + 11] = p3;
        }

        let [z0, z1] = [0, heights[i]];

        //
        // 5 Faces with 4 vertices of 3 components for each height tile
        // Stride per quad is 12
        // 5 Faces with 6 indices for each height tile
        //
        let vi = 5 * 4 * 3 * i;

        quad(
            vi,
            z1, //
            z1, //
            z1, //
            z1 //
        );

        [z0, z1] = sort2(sx > 0 ? heights[i - 1] : 0, heights[i]);
        quad(
            vi + 12,
            z0, //
            z1, //
            z1, //
            z0 //
        );

        [z0, z1] = sort2(sx + 1 < segments ? heights[i + 1] : 0, heights[i]);
        quad(
            vi + 24,
            z0, //
            z0, //
            z1, //
            z1 //
        );

        [z0, z1] = sort2(sy > 0 ? heights[i - segments] : 0, heights[i]);
        quad(
            vi + 3 * 12,
            z0, //
            z0, //
            z1, //
            z1 //
        );

        [z0, z1] = sort2(sy + 1 < segments ? heights[i + segments] : 0, heights[i]);
        quad(
            vi + 4 * 12,
            z0, //
            z1, //
            z1, //
            z0 //
        );

        positionAttr.needsUpdate = true;
    }
}

/**
 * Layer represents a flexible class for storing information at each discrete
 * point of the height. There are two major variations.
 *
 * ### Numeric layers
 *
 * These layers are TypedArrays that can store values.
 *
 * ### Object layers
 *
 * There layers store an index value in the layer array itself and an
 * accompanying look-up table for mapping that value to a shared object.
 *
 */
class Layer {
    // --------------------------------------------------------------------- //
    // @group Construction
    // --------------------------------------------------------------------- //

    constructor(name, width, height, Type, { defaultValue = 0, lookup = null }) {
        this._name = name;
        this._width = width;
        this._height = height;
        this._array = new Type(width * height);
        this._table = lookup ? new LookupTable(lookup) : null;

        if (typeof defaultValue === 'string') {
            defaultValue = this._table.indexForName(defaultValue);
        }
        this._array.fill(defaultValue);
    }

    // --------------------------------------------------------------------- //
    // @group Properties
    // --------------------------------------------------------------------- //

    /**
     * Return direct access to the value array
     */
    get array() {
        return this._array;
    }

    /**
     * Return direct access to the lookup table
     */
    get table() {
        return this._table;
    }

    // --------------------------------------------------------------------- //
    // @group Accessors
    // --------------------------------------------------------------------- //

    /**
     * Return value at the given coordinate
     */
    get(x, y) {
        if (!(x >= 0 && x < this._width && y >= 0 && y < this._height)) {
            return null;
        }
        const i = y * this._width + x;
        return this._array[i];
    }

    /**
     * Return object at the given coordinate after looking up the value.
     */
    lookup(x, y) {
        if (!(x >= 0 && x < this._width && y >= 0 && y < this._height)) {
            return null;
        }
        const i = y * this._width + x;
        const value = this._array[i];
        return this._table.get(value);
    }

    /**
     * Return object using the array index rather than coordinate.
     */
    lookupIndex(i) {
        const value = this._array[i];
        return this._table.get(value);
    }

    // --------------------------------------------------------------------- //
    // @group Mutators
    // --------------------------------------------------------------------- //

    /**
     * Set value at the given coordinate
     */
    set(x, y, value) {
        if (!(x >= 0 && x < this._width && y >= 0 && y < this._height)) {
            return;
        }
        const i = y * this._width + x;
        return (this._array[i] = value);
    }

    /**
     * Set value at the given index
     */
    setAtIndex(i, value) {
        return (this._array[i] = value);
    }

    /**
     * Modify at the object given location (cloning into a new value if needed)
     *
     * 1. Look-up the object at the given index
     * 2. Modify the given props of the object
     * 3. Update the look-up table if this creates a unique object
     * 4. Set the object at the index to the modified object
     *
     * ⚠️ Performance warning: this requires a search of all existing objects
     * in the lookup table.
     */
    mutateAtIndex(index, props) {
        const value = this._array[index];
        this._array[index] = this._table.getDerived(value, props);
    }

    mutate(x, y, props) {
        if (!(x >= 0 && x < this._width && y >= 0 && y < this._height)) {
            return;
        }
        const index = y * this._width + x;
        const value = this._array[index];
        this._array[index] = this._table.getDerived(value, props);
    }
}

class LookupTable {
    constructor({ normalize = (obj) => obj, table = null } = {}) {
        this._list = [];
        this._free = [];
        this._normalize = normalize;
        this._set = {};

        if (table) {
            this.addSet(table);
        }

        this._uidCount = 0;
        this._uidMap = new Map();
    }

    get(index) {
        return this._list[index];
    }
    indexForName(name) {
        return this._set[name];
    }

    getDerived(baseIndex, props) {
        const baseObject = this._list[baseIndex];

        // Encode the deltas to create a deterministic derived name.
        //
        // 📝 This relies on object identity to avoid creating equivalent
        // objects. Thus getDerived is "safest" to use with primitive types
        // or where the caller is careful not to pass in temporary objects.
        //
        // 📝 The comparison is shallow.
        //
        const deltas = [];
        for (let [key, value] of Object.entries(props)) {
            if (baseObject[key] === value) {
                continue;
            }
            let id = this._uidMap.get(value);
            if (id === undefined) {
                id = this._uidCount++;
                this._uidMap.set(value, id);
            }
            deltas.push(id);
        }
        if (deltas.length == 0) {
            return baseIndex;
        }

        // Find or create the derived object
        const derivedName = `${baseObject.name}-d${deltas.join('-')}`;
        let derivedObject = this._set[derivedName];
        if (!derivedObject) {
            this.addSet({ [derivedName]: { ...baseObject, ...props, name: derivedName } });
            derivedObject = this._set[derivedName];
        }
        return derivedObject.index;
    }

    remove(obj) {
        for (let i = 0; i < this._list.length; i++) {
            if (this._list[i] === obj) {
                this._list[i] = null;
                this._free.push(i);

                for (let [key, value] of Object.entries(this._set)) {
                    if (value === i) {
                        delete this._set[key];
                    }
                }

                break;
            }
        }
    }

    keys() {
        return this._set;
    }

    addSet(m) {
        for (let [key, value] of Object.entries(m)) {
            const index = this._addObject(key, value);
            this._set[key] = index;
        }
        return this._set;
    }

    _addObject(name, obj) {
        let i;
        if (this._free.length) {
            i = this._free.shift();
        } else {
            i = this._list.length;
        }
        this._normalize(obj, i);
        obj.name = name;
        obj.index = i;

        this._list.push(obj);
        return i;
    }
}
