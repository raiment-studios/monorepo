import * as core from '@raiment/core';

/**
 * A single source of truth on the application data.
 *
 * "Views" into the data are created for React change / update purposes:
 * there is a single, in-place-modified source of truth, but the view objects
 * are recreated to trigger React updates.
 */
export class Database {
    constructor() {
        this._data = {
            items: [],
        };

        // TODO: split into proper EventEmitter class
        // Access as database.events.fire('name');
        this._eventCallbacks = {
            update: [],
        };
    }

    // TODO: change to event emitter
    on(event, cb) {
        this._eventCallbacks[event].push(cb);
    }
    fire(event) {
        for (let notificationCb of this._eventCallbacks[event]) {
            notificationCb(this);
        }
    }

    transaction(cb) {
        throw new Error('Placeholder for synchronized changes');
    }

    /**
     * View in the sense of "view into the data".
     *
     * TODO: these views allow modification. Find a better name.
     */
    view() {
        return new DatabaseDM(this);
    }
}

export class DatabaseDM {
    constructor(host) {
        this._host = host;
    }
    select(query) {
        return this._host._data.items.map((item) => {
            return new ItemDM(item, this._host);
        });
    }
}

class ItemDM {
    constructor(json, host) {
        // Should this be a generic callback instead?
        this._host = host;
        this._data = Object.assign(
            {
                id: core.shortID(),
                title: '',
                done: false,
            },
            json
        );
        this._json = json;
    }

    update(fields) {
        // TODO: this is relying on complete invalidation
        // of the data views.  This is fine for now, but some
        // more precise update scheme is needed eventually.
        for (let [key, value] of Object.entries(fields)) {
            this._json[key] = value;
        }
        this._host.fire('update');
    }

    get title() {
        return this._data.title;
    }
    get id() {
        return this._data.id;
    }
    get done() {
        return this._data.done;
    }
}
