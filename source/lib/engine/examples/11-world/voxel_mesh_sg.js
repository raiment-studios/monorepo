import * as core from '../../../core';
import * as THREE from 'three';

import { makeVoxelGeometry } from './make_voxel_geometry';

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
 * Voxel Mesh Simple Grid
 *
 * Design goals:
 * - Simple, easy to understand & use
 * - Relatively fast & flexible for small models
 *
 * Design non-goals:
 * - Not optimal for static models
 */
export class VoxelModelSG {
    constructor({ billboard = false } = {}) {
        this._chunks = new core.Map3D({ defaultCallback: () => new Chunk() });
        this._group = new THREE.Group();
        this._billboard = billboard;
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

    mesh({ engine }) {
        return this._group;
    }

    update({ engine }) {
        for (let [cx, cy, cz, chunk] of this._chunks.entries()) {
            chunk.updateMesh(engine, this._group, cx, cy, cz);
        }

        if (this._billboard) {
            const cam = engine.renderer.camera.position;
            const ang = Math.atan2(cam.y, cam.x);
            this._group.setRotationFromAxisAngle(new THREE.Vector3(0, 0, 1), ang + Math.PI / 2);
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

    updateMesh(engine, parent, cx, cy, cz) {
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
