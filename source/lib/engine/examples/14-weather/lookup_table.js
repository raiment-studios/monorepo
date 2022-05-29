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
