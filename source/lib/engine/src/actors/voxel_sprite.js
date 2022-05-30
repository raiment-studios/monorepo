import * as THREE from 'three';

export class VoxelSprite {
    constructor({
        id,
        url = null,
        scale = 1.0,
        depth = 1.0,
        flags = {},
        worldX = 0,
        worldY = 0,
        position = null,
        stateMachine = null,
        spriteScale = 1.0,
    } = {}) {
        if (!url) {
            throw new Error(`url must be defined`);
        }
        this._id = id;
        this._url = url;
        this._position = position || new THREE.Vector3(worldX, worldY, 0);
        this._offset = new THREE.Vector3(0, 0, 0);
        this._scale = scale;
        this._spriteScale = spriteScale;
        this._depth = 1.0;
        this._flags = Object.assign({}, flags);
        this._mesh = null;
        this._stateMachine = stateMachine;
    }

    get id() {
        return this._id;
    }

    get flags() {
        return this._flags;
    }

    get position() {
        return this._position;
    }

    get innerMesh() {
        return this._mesh?.children[0];
    }

    stateMachine(ctx) {
        if (!this._stateMachine) {
            return;
        }
        const stateMachine = this._stateMachine(ctx);
        stateMachine._bind = this;
        return stateMachine;
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
        mesh.scale.set(this._spriteScale, this._spriteScale, this._spriteScale);

        const group = new THREE.Group();
        group.position.copy(this._position);
        group.add(mesh);
        this._mesh = group;
        return this._mesh;
    }
}
