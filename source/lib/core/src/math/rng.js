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
        this._seed = seed;
    }

    // -- Properties ------------------------------------------------------- //

    get seed() {
        return this._seed;
    }

    // -- General methods ------------------------------------------------- //

    reset() {
        this._rng = new MersenneTwister(this._seed);
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
        return new RNG(this.uint31() + offset);
    }

    // -- Numbers -------------------------------------------------------- //

    random() {
        return this._rng.random();
    }

    /**
     * Return -1 or 1 with equal probability
     */
    sign() {
        return this._rng.random() < 0.5 ? -1 : 1;
    }

    bool() {
        return this._rng.random() < 0.5 ? false : true;
    }

    int31() {
        return this.sign() * this.uint31();
    }

    uint31() {
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
        return Math.floor(this.random() * 0x10000)
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

    shuffle(arr) {
        const temp = [...arr];
        const dst = [];
        while (temp.length) {
            const i = Math.floor(this.random() * temp.length);
            dst.push(temp[i]);
            temp[i] = temp[temp.length - 1];
            temp.pop();
        }
        return dst;
    }

    select(arr, count, weightFunc) {
        //
        // Normalize based on arguments
        //
        if (arguments.length === 1) {
            count = 1;
        } else if (arguments.length === 2) {
            if (typeof count === 'function') {
                weightFunc = count;
                count = 1;
            }
        }

        //
        // Handle different cases
        //
        if (count === 1) {
            if (!weightFunc) {
                const i = Math.floor(this.random() * arr.length);
                return arr[i];
            } else {
                const i = this._selectWeightedIndex(arr, weightFunc);
                return arr[i];
            }
        } else {
            const b = [...arr];
            const results = [];

            while (count > 0 && b.length > 0) {
                let i;
                if (!weightFunc) {
                    i = Math.floor(this.random() * b.length);
                } else {
                    i = this._selectWeightedIndex(b, weightFunc);
                }
                const t = b[i];
                b[i] = b[b.length - 1];
                b.pop();
                results.push(t);
            }
            return results;
        }
    }

    _selectWeightedIndex(arr, cb) {
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
                return i;
            }
        }
        throw new Error('RUNTIME_ERROR: Index out of range');
    }
}
