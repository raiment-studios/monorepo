import * as core from '../../../core/src';
import * as THREE from 'three';

function grid3d(x, y, z, size, out = {}) {
    out.gx = Math.floor(x / size);
    out.gy = Math.floor(y / size);
    out.gz = Math.floor(z / size);
    out.lx = x - out.gx * size;
    out.ly = y - out.gy * size;
    out.lz = z - out.gz * size;
    return out;
}

/**
 * Voxel Model Simple Grid (VoxelModelSG)
 *
 * A infinite voxel canvas that allows colored voxels to be set at any point in
 * the 3D space.  Colors are defined as RGB float triplets. A call to updateMesh()
 * is required after changes to the mesh (the mesh() function implicitly calls
 * updateMesh()).
 *
 * Design goals:
 * - Simple, easy to understand & use
 * - Relatively fast & flexible for small models
 */
export class VoxelModelSG {
    constructor() {
        this._chunks = new core.Map3DI({ defaultCallback: () => new Chunk() });
        this._group = new THREE.Group();
    }

    dispose() {
        for (let chunk of this._chunks.values()) {
            chunk.dispose();
        }
        this._chunks = null;
    }

    set(x, y, z, c) {
        if (!this._chunks) {
            return;
        }

        x = Math.floor(x);
        y = Math.floor(y);
        z = Math.floor(z);

        const p = grid3d(x, y, z, CHUNK_SIZE);
        const chunk = this._chunks.ensure(p.gx, p.gy, p.gz);
        chunk.set(p.lx, p.ly, p.lz, c);
    }

    heightAt(x, y, defaultValue = -Infinity) {
        let max = -Infinity;
        for (let [cx, cy, cz, chunk] of this._chunks.entries()) {
            const wx = cx * CHUNK_SIZE;
            const wy = cy * CHUNK_SIZE;
            if (x >= wx && x < wx + CHUNK_SIZE && y >= wy && y < wy + CHUNK_SIZE) {
                const lz = chunk.heightAt(x - wx, y - wy);
                if (lz > -Infinity) {
                    max = Math.max(max, cz * CHUNK_SIZE + lz);
                }
            }
        }
        return max > -Infinity ? max : defaultValue;
    }

    mesh() {
        this.updateMesh();
        return this._group;
    }

    updateMesh() {
        for (let [cx, cy, cz, chunk] of this._chunks.entries()) {
            chunk.updateMesh(this._group, cx, cy, cz);
        }
    }
}

const CHUNK_SIZE = 8;

class Chunk {
    constructor() {
        // 0 is a special value meaning an empty voxel
        this._data = new Uint32Array(CHUNK_SIZE * CHUNK_SIZE * CHUNK_SIZE);
        this._data.fill(0);
        this._dirty = true;
        this._mesh = null;
    }

    dispose() {
        // Remove old mesh
        if (this._mesh) {
            this._mesh.removeFromParent();
            this._mesh.geometry.dispose();
            this._mesh = null;
        }
    }

    set(x, y, z, c) {
        const i = chunkIndex(x, y, z);

        this._data[i] = colorClamp(c);
        this._dirty = true;
    }

    heightAt(x, y) {
        for (let z = CHUNK_SIZE - 1; z >= 0; z--) {
            const i = chunkIndex(x, y, z);
            const v = this._data[i];
            if (v > 0) {
                return z;
            }
        }
        return -Infinity;
    }

    updateMesh(parent, cx, cy, cz) {
        // Already up to date
        if (!this._dirty) {
            return;
        }

        // Remove old mesh
        if (this._mesh) {
            parent.remove(this._mesh);
            this._mesh.geometry.dispose();
            this._mesh = null;
        }

        const iface = {
            size: { x: 8, y: 8, z: 8 },
            get: (x, y, z) => {
                const i = (z * CHUNK_SIZE + y) * CHUNK_SIZE + x;
                const color = this._data[i];
                if (color === 0) {
                    return null;
                }
                return {
                    color: [
                        ((color >> 16) & 0xff) / 255.0, //
                        ((color >> 8) & 0xff) / 255.0,
                        ((color >> 0) & 0xff) / 255.0,
                    ],
                    texture: 0,
                };
            },
        };

        const arrays = makeVoxelGeometry(iface);
        let geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(arrays.position, 3));
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(arrays.normal, 3));
        //geometry.setAttribute('uv', new THREE.Float32BufferAttribute(arrays.uv, 2));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(arrays.color, 3));
        geometry.setIndex(Array.from(arrays.index));
        geometry.computeBoundingBox();
        geometry.uvsNeedUpdate = true;

        const material = materialCache.get('white');
        core.assert(material, `Material should always exist`);

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(cx * CHUNK_SIZE, cy * CHUNK_SIZE, cz * CHUNK_SIZE);
        parent.add(mesh);

        this._group = mesh;
        this._dirty = false;
    }
}

function chunkIndex(x, y, z) {
    return (z * CHUNK_SIZE + y) * CHUNK_SIZE + x;
}

function colorClamp(c) {
    return (
        (Math.floor(Math.max(0, Math.min(255, c[0] * 255))) << 16) |
        (Math.floor(Math.max(0, Math.min(255, c[1] * 255))) << 8) |
        (Math.floor(Math.max(0, Math.min(255, c[2] * 255))) << 0)
    );
}

class MaterialCache {
    constructor() {
        this._cache = {};
    }

    get(color) {
        let material = this._cache[color];
        if (!material) {
            material = new THREE.MeshPhongMaterial({ color, shininess: 0 });
            material.vertexColors = true;
            material.needsUpdate = true;
            this._cache[color] = material;
        }
        return material;
    }
}

const materialCache = new MaterialCache();

/**
 * Given a voxel grid data structure, create a THREE based mesh.
 *
 * Each voxel will be 1x1x1 in model space.  The mesh's origin is a 0x0x0
 * with the mesh growing in the positive x, y, z directions.
 *
 * Voxel interface
 *
 *  size: x, y,z
 *  get(x,y,z)
 *      voxel:
 *          color
 *          texture : int index into texture atlas
 *
 *
 */
export function makeVoxelGeometry(voxels, options) {
    options = Object.assign(
        {
            voxelScale: 1.0,
            textureAtlasSize: 1,
        },
        options
    );

    const arrays = {
        elements: 0,
        index: [],
        position: new ChunkedFloat32Array(),
        normal: new ChunkedFloat32Array(),
        uv: new ChunkedFloat32Array(),
        color: new ChunkedFloat32Array(),
    };

    // Convience function for transferring a quad into the GeometryBuffer
    // arrays
    const quad2 = ({ label, corners, id, positions, normal, color, uv }) => {
        const [p0, p1, p2, p3] = positions.map((i) => corners[i]);
        const [uv0, uv1, uv2, uv3] = uv;

        // Quad points
        arrays.position.push(...p0);
        arrays.normal.push(...normal);
        arrays.uv.push(...uv0);

        arrays.position.push(...p1);
        arrays.normal.push(...normal);
        arrays.uv.push(...uv1);

        arrays.position.push(...p2);
        arrays.normal.push(...normal);
        arrays.uv.push(...uv2);

        arrays.position.push(...p3);
        arrays.normal.push(...normal);
        arrays.uv.push(...uv3);

        // Simple shading
        color = [...color];
        const colorScale = {
            top: 1.0,
            bottom: 0.1,
            left: 0.5,
            right: 0.75,
            front: 0.6,
            back: 0.6,
        }[label];
        color[0] *= colorScale;
        color[1] *= colorScale;
        color[2] *= colorScale;

        arrays.color.push(...color);
        arrays.color.push(...color);
        arrays.color.push(...color);
        arrays.color.push(...color);

        const s = arrays.elements;
        arrays.index.push(s);
        arrays.index.push(s + 1);
        arrays.index.push(s + 2);
        arrays.index.push(s);
        arrays.index.push(s + 2);
        arrays.index.push(s + 3);
        arrays.elements += 4;
    };

    // Test if there's a neighboring face so that faces that will never be
    // visible can be skipped.
    const hasNeighbor = (vx, vy, vz) => {
        if (
            vx < 0 ||
            vy < 0 ||
            vz < 0 ||
            vx >= voxels.size.x ||
            vy >= voxels.size.y ||
            vz >= voxels.size.z
        ) {
            return false;
        }
        const voxel = voxels.get(vx, vy, vz);
        if (!voxel) {
            return false;
        }
        return true;
    };

    //
    // For each voxel
    //
    let voxelID = 0;
    for (let vz = 0; vz < voxels.size.z; vz++) {
        for (let vy = 0; vy < voxels.size.y; vy++) {
            for (let vx = 0; vx < voxels.size.x; vx++, voxelID++) {
                const voxel = voxels.get(vx, vy, vz);
                if (!voxel) {
                    continue;
                }
                let { color, texture } = voxel;

                const vs = (1.0 - options.voxelScale) / 2.0;
                const f0 = 0 + vs;
                const f1 = 1 - vs;
                const corners = [
                    [f0 + vx, f0 + vy, f1 + vz],
                    [f1 + vx, f0 + vy, f1 + vz],
                    [f0 + vx, f1 + vy, f1 + vz],
                    [f1 + vx, f1 + vy, f1 + vz],
                    [f0 + vx, f0 + vy, f0 + vz],
                    [f1 + vx, f0 + vy, f0 + vz],
                    [f0 + vx, f1 + vy, f0 + vz],
                    [f1 + vx, f1 + vy, f0 + vz], // 7
                ];

                // U,V look-up in the texture atlas
                //
                // TODO: textureAtlasSize is wrong. It should be a tileSize and tileCount, which
                // may not be the same
                //
                const atlasSize = voxels.textureAtlasSize || 1;
                const nudge = 0 / atlasSize;
                const u0 = Math.floor(texture % atlasSize) / atlasSize + nudge;
                const u1 = u0 + 1 / atlasSize - nudge;
                const v0 = 1.0 - Math.floor(texture / atlasSize) - nudge;
                const v1 = v0 - 1 / atlasSize + nudge;

                if (!hasNeighbor(vx, vy, vz + 1)) {
                    quad2({
                        label: 'top',
                        id: voxelID,
                        corners,
                        positions: [0, 1, 3, 2],
                        normal: [0, 0, 1],
                        color,
                        uv: [
                            [u0, v0],
                            [u1, v0],
                            [u1, v1],
                            [u0, v1],
                        ],
                    });
                }

                if (!hasNeighbor(vx, vy, vz - 1)) {
                    quad2({
                        label: 'bottom',
                        id: voxelID,
                        corners,
                        positions: [4, 6, 7, 5],
                        normal: [0, 0, -1],
                        color,
                        uv: [
                            [u0, v0],
                            [u0, v1],
                            [u1, v1],
                            [u1, v0],
                        ],
                    });
                }
                if (!hasNeighbor(vx + 1, vy, vz)) {
                    quad2({
                        label: 'right',
                        id: voxelID,
                        corners,
                        positions: [3, 1, 5, 7],
                        normal: [1, 0, 0],
                        color,
                        uv: [
                            [u1, v0],
                            [u0, v0],
                            [u0, v1],
                            [u1, v1],
                        ],
                    });
                }

                if (!hasNeighbor(vx - 1, vy, vz)) {
                    quad2({
                        label: 'left',
                        id: voxelID,
                        corners,
                        positions: [6, 4, 0, 2],
                        normal: [-1, 0, 0],
                        color,
                        uv: [
                            [u0, v1],
                            [u1, v1],
                            [u1, v0],
                            [u0, v0],
                        ],
                    });
                }

                if (!hasNeighbor(vx, vy + 1, vz)) {
                    quad2({
                        label: 'front',
                        id: voxelID,
                        corners,
                        positions: [2, 3, 7, 6],
                        normal: [0, 1, 0],
                        color,
                        uv: [
                            [u1, v0],
                            [u0, v0],
                            [u0, v1],
                            [u1, v1],
                        ],
                    });
                }

                if (!hasNeighbor(vx, vy - 1, vz)) {
                    quad2({
                        label: 'back',
                        id: voxelID,
                        corners,
                        positions: [0, 4, 5, 1],
                        normal: [0, -1, 0],
                        color,
                        uv: [
                            [u0, v0],
                            [u0, v1],
                            [u1, v1],
                            [u1, v0],
                        ],
                    });
                }
            }
        }
        //await new Promise((resolve) => setTimeout(resolve, 0));
    }

    let geometry = {
        position: arrays.position.data(),
        normal: arrays.normal.data(),
        uv: arrays.uv.data(),
        color: arrays.color.data(),
        index: new Int32Array(arrays.index),
    };
    return geometry;
}

/**
 * TODO: how much does this actually help performance versus a regular array?
 * With some empirical testing, it is not notably faster.
 */
export class ChunkedFloat32Array {
    constructor() {
        this.chunks = [];
        this.index = 0;
    }
    push(...f) {
        for (let v of f) {
            const CHUNKSIZE = 32 * 1024;
            const ci = Math.floor(this.index / CHUNKSIZE);
            const co = this.index % CHUNKSIZE;

            let chunk = this.chunks[ci];
            if (!chunk) {
                chunk = new Float32Array(CHUNKSIZE);
                this.chunks[ci] = chunk;
            }
            chunk[co] = v;
            this.index++;
        }
    }
    data() {
        const arr = new Float32Array(this.index);
        let i = 0;
        for (let chunk of this.chunks) {
            for (let j = 0; j < chunk.length; j++) {
                arr[i++] = chunk[j];
            }
        }
        return arr;
    }
}
