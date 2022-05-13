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

            const { tilemap } = game;
            for (let ty = 0; ty < 20; ty++) {
                for (let tx = 0; tx < 20; tx++) {
                    const value = tilemap.get(tx, ty);
                    if (value) {
                        gi.drawTile(tiles[value], tx, 19 - ty);
                    }
                }
            }

            gi.drawTile(tiles.player, game.player.position.x, 19 - game.player.position.y);
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
