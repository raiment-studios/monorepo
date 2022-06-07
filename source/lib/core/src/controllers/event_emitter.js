export class EventEmitter {
    // ----------------------------------------------------------------------------------
    //  Constructor
    //
    constructor() {
        this._events = {};
        this._queue = [];
    }

    dispose() {
        this._events = {};
        this._queue = [];
    }

    static composeInto(object) {
        object._events = new EventEmitter();
        ['on', 'once', 'off', 'fire', 'enqueue', 'flush'].forEach(
            (name) => (object[name] = EventEmitter.prototype[name])
        );
        Object.defineProperty(object, 'events', {
            get: () => object._events,
        });
    }

    // ----------------------------------------------------------------------------------
    // Event management
    //

    /**
     * Registers a callback, calls it the next time the event occurs, and
     * removes it after one call.
     *
     * @param {*} event
     * @param {*} callback
     */
    once(event, callback) {
        const wrapper = () => {
            callback();
            this.off(event, wrapper);
        };
        this.on(event, wrapper);
    }

    on(event, callback) {
        this._events[event] = this._events[event] || [];
        this._events[event].push(callback);

        return () => {
            this.off(event, callback);
        };
    }

    off(event, callback) {
        if (this._events[event] === undefined) {
            throw new Error(`Cannot remove from unused event: '${event}'`);
        }

        const filtered = this._events[event].filter((cb) => cb !== callback);
        const delta = this._events[event].length - filtered.length;
        if (delta !== 1) {
            console.warn(
                `EventEmitter.off removed ${delta} entries. Expect to always remove exactly 1.`
            );
        }
        this._events[event] = filtered;
    }

    fire(event, ...args) {
        const arr = this._events[event];
        if (arr && arr.length > 0) {
            arr.forEach((cb) => {
                cb(...args);
            });
        }
    }

    /**
     * Defer events until the flush() call.
     *
     * Arguments are shallowly copied.
     */
    enqueue(event, ...args) {
        this._queue.push([event, args]);
    }

    /**
     * Fire any enqueued events
     */
    flush() {
        while (this._queue.length > 0) {
            const [event, args] = this._queue.shift();
            this.fire(event, ...args);
        }
    }
}
