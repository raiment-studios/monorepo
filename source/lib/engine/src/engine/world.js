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
}
