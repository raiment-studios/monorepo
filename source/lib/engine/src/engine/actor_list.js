import * as THREE from 'three';
import * as core from '../../../core';

export class ActorList {
    constructor() {
        this._list = [];
        this._added = [];
        this._removed = [];

        this._idCache = {};

        this[Symbol.iterator] = function* () {
            for (let actor of this._list) {
                yield actor;
            }
        };
    }

    async place(...args) {
        return placeActor(...args);
    }

    push(...actors) {
        for (let actor of actors) {
            if (!actor) {
                console.error('Null or undefined actor added to actor list');
                debugger;
            }

            if (actor.id) {
                const existing = this._idCache[actor.id];
                if (existing) {
                    console.warn(`Actor with id '${actor.id}' already exists`);
                } else {
                    this._idCache[actor.id] = actor;
                }
            }

            this._added.push(actor);
        }
    }
    remove(...actors) {
        for (let actor of actors) {
            const added = this._added.filter((a) => a !== actor);
            const list = this._list.filter((a) => a !== actor);

            let count = this._list.length - list.length + (this._added.length - added.length);
            if (count !== 1) {
                console.error('Did not remove exactly one actor from the actor lists');
                debugger;
            }

            if (actor.id) {
                delete this._idCache[actor.id];
            }
            this._added = added;
            this._list = list;
            this._removed.push(actor);
        }
    }

    filter(cb) {
        return this._list.filter(cb);
    }

    selectByID(id) {
        let actor = this._idCache[id];
        if (actor) {
            return actor;
        }
        for (let actor of this._list) {
            if (actor.id === id) {
                this._idCache[id] = actor;
                return actor;
            }
        }
        return null;
    }
}

async function placeActor({
    engine,
    actor,
    heightMap,
    foundationTile = null,

    generatePosition = (rng, minX, minY, maxX, maxY) => {
        const sx = rng.rangei(minX, maxX);
        const sy = rng.rangei(minY, maxY);
        return [sx, sy];
    },
}) {
    const rng = engine.rng;
    const heightArray = heightMap.getLayerArray('height');
    const malleabilityArray = heightMap.getLayerArray('malleability');

    //
    // Read the actor's constraints on how it should be placed
    //
    const constraints = await actor.placementConstraints({ engine });
    const bbox = constraints.box3;
    const size = new THREE.Vector3();
    bbox.min.floor();
    bbox.max.ceil();
    bbox.getSize(size);

    const {
        malleabilityMin = 0,
        malleabilityExponent = 1,
        malleabilityExtents = 8, //
        walkableBoundary = 2,
        foundationSize = null,
    } = constraints;

    const minX = -bbox.min.x;
    const minY = -bbox.min.y;
    const maxX = heightMap.segments - size.x - minX;
    const maxY = heightMap.segments - size.y - minY;

    //
    // Iteratively make a random selection until constraints are met or the
    // number of attemmpts is exceeded.
    //
    let placement = null;
    const cursor = new core.Cursor2D(heightMap.segments, heightMap.segments);
    for (let attempt = 0; placement === null && attempt < 20; attempt++) {
        const ε = 1e-6;

        const [sx, sy] = generatePosition(rng, minX, minY, maxX, maxY);
        if (sx < minX || sx > maxX || sy < minY || sy > maxY) {
            continue;
        }

        const modelBox = new THREE.Box2();
        modelBox.min.set(sx + bbox.min.x, sy + bbox.min.y);
        modelBox.max.set(sx + bbox.max.x, sy + bbox.max.y);

        //
        // Ensure placement only occurs on currently walkable tiles
        //
        let valid = true;
        const stats = new core.SimpleStats();
        cursor.box(modelBox, { inflate: walkableBoundary }, ({ index }) => {
            const tile = heightMap.layers.tile.lookupIndex(index);
            if (!tile.walkable || !tile.buildable) {
                valid = false;
            }
            stats.add(heightArray[index]);
        });
        if (!valid) {
            continue;
        }

        //
        // Flatten the "foundation" area that the actor covers and mark that
        // terrain as immalleable.
        //
        // If an explicit size has been set, use that rather than the model bounds
        //
        let malleabilityBase = 0.0;
        if (foundationSize !== null) {
            const center = new THREE.Vector2();
            modelBox.getCenter(center);

            const size = Math.max(1, foundationSize);
            modelBox.setFromCenterAndSize(center, new THREE.Vector2(size, size));
        }

        const baseHeight = (stats.average() * 2) / 3 + stats.max() / 3;
        cursor.box(modelBox, ({ index }) => {
            if (foundationTile !== null) {
                heightMap.layers.tile.setAtIndex(index, foundationTile);
            } else {
                heightMap.layers.tile.mutateAtIndex(index, { walkable: false });
            }
            heightArray[index] = baseHeight;
            if (foundationSize !== 0) {
                malleabilityArray[index] = malleabilityBase;
            }
        });

        // Both...
        //
        // (1) Blend the heights of area surrounding the foundation with the foundation
        // height to smooth the transitions.
        //
        // (2) Reduce the malleability of the area surrounding the foundation so that
        // future terrain modifications tend to leave smooth transitions.
        //
        const innerBounds = modelBox.clone();
        innerBounds.max.addScalar(-ε);

        cursor.box(modelBox, { inflate: malleabilityExtents }, ({ x, y, index }) => {
            const pt = new THREE.Vector2(x, y);
            const dist = innerBounds.distanceToPoint(pt);
            if (dist > 0) {
                const a1 = Math.pow(core.clamp(dist / malleabilityExtents, 0, 1), 0.75);
                const a0 = 1 - a1;
                const c = heightArray[index];
                heightArray[index] = baseHeight * a0 + a1 * c;

                const value =
                    malleabilityMin + (1 - malleabilityMin) * Math.pow(a1, malleabilityExponent);
                malleabilityArray[index] = Math.min(malleabilityArray[index], value);
            }
        });

        //
        // As heights have changed, update the region.  Remember that the neighbors
        // of any segment whose height has changed also need to be updated.
        //
        cursor.box(modelBox, { inflate: malleabilityExtents + 1 }, ({ x, y }) => {
            heightMap.updateSegment(x, y);
        });
        placement = { sx, sy };
    }
    if (placement === null) {
        console.warn('Could not place actor', actor);
        return false;
    }

    const { sx, sy } = placement;

    const [wx, wy] = heightMap.coordS2W(sx, sy);
    actor.position.set(wx, wy, 0.0);
    engine.actors.push(actor);

    return true;
}
