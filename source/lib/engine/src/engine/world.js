import * as THREE from 'three';

export class World {
    constructor(engine) {
        this._engine = engine;
        this._groundHeightActors = [];

        engine.events.on('actor.postinit', ({ actor }) => {
            if (!actor.worldGroundHeight) {
                return;
            }
            this._groundHeightActors.push(actor);
        });
    }

    get engine() {
        return this._engine;
    }

    groundHeight(wx, wy) {
        let max = -Infinity;
        for (let actor of this._groundHeightActors) {
            const z = actor.worldGroundHeight(wx, wy);
            if (z > max) {
                max = z;
            }
        }
        return max;
    }

    generateRandomWalkablePosition({
        boundary = 0, //
        maxAttempts = 30,
    } = {}) {
        console.assert(boundary === 0, 'Boundary not yet implemented');

        const rng = this._engine.rng;
        const heightMap = this._engine.actors.selectByID('terrain');

        const walkable = (wx, wy) => {
            const si = heightMap.coordW2I(wx, wy);
            if (si === -1) {
                return false;
            }
            return heightMap.layers.tile.lookupIndex(si).walkable ?? true;
        };

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const worldX = rng.sign() * rng.rangei(0, heightMap.segments / 2);
            const worldY = rng.sign() * rng.rangei(0, heightMap.segments / 2);

            if (walkable(worldX, worldY)) {
                return new THREE.Vector3(worldX, worldY, 0.0);
            }
        }
        return null;
    }
}
