import * as THREE from 'three';

export class VoxelSprite {
    constructor({ url = null, scale = 1.0, depth = 1.0 } = {}) {
        if (!url) {
            throw new Error(`url must be defined`);
        }
        this._url = url;
        this._position = new THREE.Vector3(0, 0, 0);
        this._offset = new THREE.Vector3(0, 0, 0);
        this._scale = scale;
        this._depth = 1.0;
    }

    async mesh({ engine }) {
        const geometry = await engine.cache.imageGeometry.get(
            this._url,
            this._scale,
            this._depth,
            this._offset
        );
        let material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
        });
        material.vertexColors = true;

        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.position.set(0.5, 0.5, 0);

        const group = new THREE.Group();
        group.position.copy(this._position);
        group.add(mesh);
        return group;
    }
}
