import MersenneTwister from 'mersenne-twister';

export function makeRNG(...args) {
    return new RNG(...args);
}

/**
 * RNG = Random Number Generator
 */
class RNG {
    constructor(seed = Math.random() * 1e9) {
        this._rng = new MersenneTwister(seed);
    }

    /**
     * Useful in cases when a function wants to generate a deterministic series of
     * numbers but needs to generate a variable-sized subset of numbers in the
     * middle.
     *
     * const a = rng.real();
     * const rng2 = rng.fork();
     * const b = varLengthArray.map((i) =>rng2.real())
     * const c = rng.real();
     *
     * This will ensure a and b are consistent and b will be consistent between
     * any shared length array between calls.
     */
    fork(offset = 0) {
        return new RNG(this.int31() + offset);
    }

    // -- Numbers -------------------------------------------------------- //

    random() {
        return this._rng.random();
    }

    int31() {
        return this._rng.random_int31();
    }

    range(minValue, maxValue) {
        const a = this._rng.random();
        return minValue + a * (maxValue - minValue);
    }

    /**
     * Returns an integer in the range from [minValue, maxValue)
     */
    rangei(minValue, maxValue) {
        const a = this._rng.random();
        return Math.floor(minValue + a * (maxValue - minValue));
    }

    // -- Strings ---------------------------------------------------------- //

    _s4() {
        return Math.floor(this.real() * 0x10000)
            .toString(16)
            .substring(1);
    }

    /**
     * Returns a [Universally Unique Identifier (UUID)](https://www.wikiwand.com/en/Universally_unique_identifier) string.
     *
     * Implementation dervied from https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
     */
    uuid() {
        const s4 = () => this._s4();
        return `${s4() + s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
    }

    // -- Arrays ----------------------------------------------------------- //

    select(arr, weightFunc, count) {
        if (typeof weightFunc === 'function') {
            return this._selectWeighted(arr, weightFunc);
        }

        const i = Math.floor(this.random() * arr.length);
        return arr[i];
    }

    _selectWeighted(arr, cb) {
        let sum = 0;
        let tally = new Array(arr.length);
        for (let i = 0; i < arr.length; i++) {
            const entry = arr[i];
            const weight = cb(entry);

            sum += weight;
            tally[i] = sum;
        }

        const roll = this.range(0, sum);
        for (let i = 0; i < arr.length; i++) {
            if (roll < tally[i]) {
                return arr[i];
            }
        }
        throw new Error('RUNTIME_ERROR: Index out of range');
    }
}
