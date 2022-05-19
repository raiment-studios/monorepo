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

    push(...actors) {
        for (let actor of actors) {
            this._added.push(actor);
            this._list.push(actor);
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
