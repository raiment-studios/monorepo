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
    remove(...actors) {
        for (let actor of actors) {
            const added = this._added.filter((a) => a !== actor);
            const list = this._list.filter((a) => a !== actor);

            let count = this._list.length - list.length + (this._added.length - added.length);
            if (count !== 1) {
                console.error('Did not remove exactly one actor from the actor lists');
                debugger;
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
