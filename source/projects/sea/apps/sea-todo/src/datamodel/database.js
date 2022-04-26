import * as core from '@raiment/core';
import _ from 'lodash';

/**
 * A single source of truth on the application data.
 *
 * "Views" into the data are created for React change / update purposes:
 * there is a single, in-place-modified source of truth, but the view objects
 * are recreated to trigger React updates.
 */
export class Database {
    constructor({
        name, //
        fileHandle,
    }) {
        this._data = {
            name,
            fileHandle: fileHandle,
            items: [],
        };

        this.events = new core.EventEmitter();
    }

    get fileHandle() {
        return this._data.fileHandle;
    }

    export() {
        const obj = {
            todos: [],
        };

        obj.todos = this._data.items.map((item) =>
            [
                item.title.trim() ?? 'untitled', //
                item.done ? '!done' : '',
            ]
                .filter((s) => !!s)
                .join(' ')
                .trim()
        );

        return obj;
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

    get name() {
        return this._host._data.name;
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
        this._host.events.fire('update');
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
