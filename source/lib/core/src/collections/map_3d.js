// Span is roughly the max integer value that can be used when compressing
// integers into a JavaScript Number
const SPAN = 1 << 8; // 17
const HALF = SPAN >> 1;

/**
 */
export class Map3D {
    constructor(options = {}) {
        this._map = new Map();
        this._defaultCallback = options.defaultCallback;
    }

    key(x, y, z) {
        return _key(x, y, z);
    }

    get(x, y, z) {
        return this._map.get(_key(x, y, z));
    }
    set(x, y, z, value) {
        return this._map.set(_key(x, y, z), value);
    }

    ensure(x, y, z, defaultCallback) {
        const k = _key(x, y, z);
        let value = this._map.get(k);
        if (value === undefined) {
            const cb = defaultCallback || this._defaultCallback;
            value = cb();
            this._map.set(k, value);
        }
        return value;
    }

    delete(x, y, z) {
        this._map.delete(_key(x, y, z));
    }

    entries() {
        const e = [];
        for (let [k, v] of this._map.entries()) {
            const x = ((k >> 0) & 0xff) - HALF;
            const y = ((k >> 8) & 0xff) - HALF;
            const z = ((k >> 16) & 0xff) - HALF;
            e.push([x, y, z, v]);
        }
        return e;
    }

    values() {
        return this._map.values();
    }
}

function _key(x, y, z) {
    const px = x + HALF;
    const py = y + HALF;
    const pz = z + HALF;
    return (pz << 16) | (py << 8) | px;
}
