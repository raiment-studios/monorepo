import React from 'react';
import { useAsyncEffect } from '@raiment/react-ex';
import { generate, makeRNG } from '@raiment/core';
import { loadImage, tiles } from '../app';

async function makeDrawingInterface(ctx) {
    const img = await loadImage('/assets/tiles/colored-transparent_packed.png');

    return {
        drawTile: function (tile, tx, ty) {
            const sx = tile.offset[0] * 16;
            const sy = tile.offset[1] * 16;
            ctx.globalAlpha = tile.alpha || 1.0;
            ctx.drawImage(img, sx, sy, 16, 16, tx * 32, ty * 32, 32, 32);
            ctx.globalAlpha = 1.0;
        },
    };
}

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

export function MapView({ game, round }) {
    const refCanvas = React.useRef(null);

    useAsyncEffect(
        async (token) => {
            const canvas = refCanvas.current;

            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;

            const gi = await makeDrawingInterface(ctx);
            token.check();

            ctx.fillStyle = '#033';
            ctx.fillRect(0, 0, 640, 640);

            for (let ty = 0; ty < 20; ty++) {
                for (let tx = 0; tx < 20; tx++) {
                    gi.drawTile(tiles.grass, tx, ty);
                }
            }

            const rng = makeRNG(game.seed);
            const trees = generate(8, () => [rng.rangei(0, 20), rng.rangei(0, 20)]);
            for (let [tx, ty] of trees) {
                gi.drawTile(tiles.tree, tx, ty);
            }

            gi.drawTile(tiles.player, game.player.position.x, 20 - game.player.position.y);
        },
        [round]
    );

    return (
        <div
            className="flex-row"
            style={{
                flex: '0 0 0',
                height: 640,
            }}
        >
            <div
                style={{
                    flex: '0 0 0',
                }}
            >
                <canvas
                    ref={refCanvas}
                    width={640}
                    height={640}
                    style={{
                        imageRendering: 'pixelated',
                    }}
                />
            </div>
        </div>
    );
}
