export class World {
    constructor(engine) {
        this._engine = engine;
    }

    get engine() {
        return this._engine;
    }

    groundHeight(wx, wy) {
        let max = -Infinity;
        for (let actor of this.engine.actors) {
            if (!actor.worldGroundHeight) {
                continue;
            }
            const z = actor.worldGroundHeight(wx, wy);
            if (z > max) {
                max = z;
            }
        }
        return max;
    }
}
