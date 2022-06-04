export class SimpleStats {
    constructor() {
        this._sum = 0.0;
        this._count = 0;
        this._min = Infinity;
        this._max = -Infinity;
    }
    add(value) {
        this._sum += value;
        this._count++;
        if (value < this._min) {
            this._min = value;
        }
        if (value > this._max) {
            this._max = value;
        }
    }

    count() {
        return this._count;
    }

    min() {
        return this._min;
    }

    max() {
        return this._max;
    }

    average() {
        return this._sum / this._count;
    }
}
