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
            if (!actor) {
                console.error('Null or undefined actor added to actor list');
                debugger;
            }

            this._added.push(actor);
        }
    }
    remove(actor) {
        this._added = this._added.filter((a) => a !== actor);
        this._list = this._list.filter((a) => a !== actor);
        this._removed.push(actor);
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
