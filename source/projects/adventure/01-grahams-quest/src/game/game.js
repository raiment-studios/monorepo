import { last, cloneDeep, get, clone, isArray } from 'lodash';
import { generate, makeRNG } from '@raiment/core';

const defaultAppState = {
    player: {
        position: {
            x: 5,
            y: 4,
        },
    },
    tilemap: null,
};

class IndexedGrid2D {
    constructor() {
        this._valueToIndex = new Map();
        this._indexToValue = new Map();
        this._grid = new Array(20 * 20);
    }

    set(x, y, value) {
        let index = this._valueToIndex.get(value);

        if (index === undefined) {
            index = this._valueToIndex.size + 1;
            this._valueToIndex.set(value, index);
            this._indexToValue.set(index, value);
        }
        this._grid[y * 20 + x] = index;
    }
    get(x, y) {
        const index = this._grid[y * 20 + x];
        if (index === undefined) {
            return undefined;
        }
        return this._indexToValue.get(index);
    }
}

export class Game {
    constructor() {
        this._data = cloneDeep(defaultAppState);
        this._seed = Math.floor(8192 * Math.random());
        this._round = 1;

        this._data.tilemap = new IndexedGrid2D();
        const rng = makeRNG(this.seed);
        const { tilemap } = this._data;
        for (let i = 0; i < 8; i++) {
            const [x, y] = [rng.rangei(0, 20), rng.rangei(0, 20)];
            tilemap.set(x, y, 'tree');
        }
    }

    get seed() {
        return this._seed;
    }
    get round() {
        return this._round;
    }

    get player() {
        return this._data.player;
    }

    get tilemap() {
        return this._data.tilemap;
    }

    command(cmd, ...args) {
        const handlers = {
            move: (x, y) => {
                this._data.player.position.x += x;
                this._data.player.position.y += y;
            },
        };
        const handler = handlers[cmd];
        if (handler) {
            handler(...args);
        } else {
            throw new Error(`Unknown command '${cmd}'`);
        }

        this._round++;
    }
}
