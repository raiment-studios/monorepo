export class ActorList {
    constructor() {
        this._list = [];
        this._added = [];
        this._removed = [];

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
}
