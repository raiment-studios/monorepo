import { last, cloneDeep, get, clone, isArray } from 'lodash';

const defaultAppState = {
    player: {
        position: {
            x: 5,
            y: 4,
        },
    },
};

export class Game {
    constructor() {
        this._data = cloneDeep(defaultAppState);
        this._seed = Math.floor(8192 * Math.random());
        this._round = 1;
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
