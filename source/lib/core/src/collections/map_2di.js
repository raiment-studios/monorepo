// Span is roughly the max integer value that can be used when compressing
// two integers into a JavaScript Number
const SPAN = 1 << 26;
const HALF = SPAN >> 1;

/**
 * Wrapper on a standard Map that indexes by 2 integer coordinates.
 * Can handle coordinates ranging from -67,108,864 to 67,108,864.
 * These limits are determined by what can be safely compressed into
 * a single JavaScript Number for the indexing.
 *
 * This should mirror the standard Map interface whenever reasonable
 * to do so.
 *
 * ⚠️ WARNING: out of range indexes silently wrap. ⚠️
 */
export class Map2DI {
    constructor(options = {}) {
        if (typeof options === 'function') {
            options = {
                defaultCallback: options,
            };
        }

        this._map = new Map();
        this._defaultCallback = options.defaultCallback;
    }

    key(x, y) {
        return _key(x, y);
    }

    get(x, y) {
        return this._map.get(_key(x, y));
    }
    set(x, y, value) {
        return this._map.set(_key(x, y), value);
    }

    ensure(x, y, defaultCallback) {
        const k = _key(x, y);
        let value = this._map.get(k);
        if (value === undefined) {
            const cb = defaultCallback || this._defaultCallback;
            value = cb();
            this._map.set(k, value);
        }
        return value;
    }

    clear() {
        this._map.clear();
    }

    delete(x, y) {
        this._map.delete(_key(x, y));
    }

    entries() {
        const e = [];
        for (let [k, v] of this._map.entries()) {
            const x = (k % SPAN) - HALF;
            const y = Math.floor(k / SPAN) - HALF;
            e.push([x, y, v]);
        }
        return e;
    }

    values() {
        return this._map.values();
    }
}

function _key(x, y) {
    return (y + HALF) * SPAN + (x + HALF);
}
