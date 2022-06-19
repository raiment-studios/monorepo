import React from 'react';

export class Journal {
    constructor(engine) {
        this._engine = engine;
        this._entries = [];
    }

    get entries() {
        return this._entries;
    }

    message(s) {
        const entry = {
            type: 'message',
            timestamp: Date.now(),
            value: s,
        };
        this._entries.push(entry);
        this._engine.events.fire('journal.entry', entry);
        this._engine.events.fire('journal.message', s);
    }
}
