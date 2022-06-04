import { isEqual } from 'lodash';

export class LookupTable {
    constructor({ normalize = (obj) => obj, table = null } = {}) {
        this._list = [];
        this._free = [];
        this._normalize = normalize;
        this._set = {};

        if (table) {
            this.addSet(table);
        }
    }
    add(obj) {
        let i;
        if (this._free.length) {
            i = this._free.shift();
        } else {
            i = this._list.length;
        }
        this._normalize(obj, i);
        this._list.push(obj);
        return i;
    }
    get(index) {
        return this._list[index];
    }

    getDerived(baseIndex, props) {
        const base = this._list[baseIndex];
        const derived = { ...base, ...props };

        for (let index = 0; index < this._list.length; index++) {
            const value = this._list[index];
            if (isEqual(derived, value)) {
                return index;
            }
        }
        console.log(derived);
        return this.addSet({ derived });
    }

    remove(obj) {
        for (let i = 0; i < this._list.length; i++) {
            if (this._list[i] === obj) {
                this._list[i] = null;
                this._free.push(i);

                for (let [key, value] of Object.entries(this._set)) {
                    if (value === i) {
                        delete this._set[key];
                    }
                }

                break;
            }
        }
    }

    keys() {
        return this._set;
    }

    addSet(m) {
        for (let [key, value] of Object.entries(m)) {
            const index = this.add(value);
            this._set[key] = index;
        }
        return this._set;
    }
}
