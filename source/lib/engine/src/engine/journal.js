import React from 'react';

export class Journal {
    constructor(engine) {
        this._engine = engine;
    }
    message(s) {
        this._engine.events.fire('journal.message', s);
    }
}
