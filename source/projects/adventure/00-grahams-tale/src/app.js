import React from 'react';
import { useCommonStyles, makeUseStyles, useLocalStorage, useAsyncEffect } from '@raiment/react-ex';
import { generate, makeRNG } from '@raiment/core';
import { last, cloneDeep, get, clone } from 'lodash';

const useGlobalStyles = makeUseStyles({
    '@global': {
        html: {
            margin: 0,
            padding: 0,
            height: '100%',
            background: 'white',
        },
        body: {
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            minHeight: '100%',
            maxHeight: '100%',
            minWidth: '100%',
            width: '100%',
            maxWidth: '100%',
            margin: 0,
            padding: 0,
            background: '#000',
            color: '#EEE',
        },
    },
});

async function loadImage(src) {
    return new Promise((resolve, reject) => {
        let img = new Image();
        img.onload = () => resolve(img);
        img.onerror = (err) => {
            console.error(err);
            reject(err);
        };
        img.src = src;
    });
}

const tiles = {
    grass: {
        offset: [5, 0],
        alpha: 0.25,
    },
    tree: {
        offset: [0, 1],
    },

    player: {
        offset: [26, 1],
    },
};

const areas = {
    forest: {
        tiles: [],
        map: [],
    },
};

function Map() {
    const refCanvas = React.useRef(null);

    useAsyncEffect(async (token) => {
        const canvas = refCanvas.current;

        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        const img = await loadImage('/assets/tiles/colored-transparent_packed.png');
        token.check();

        function drawTile(tile, tx, ty) {
            const sx = tile.offset[0] * 16;
            const sy = tile.offset[1] * 16;
            ctx.globalAlpha = tile.alpha || 1.0;
            ctx.drawImage(img, sx, sy, 16, 16, tx * 32, ty * 32, 32, 32);
            ctx.globalAlpha = 1.0;
        }

        ctx.fillStyle = '#033';
        ctx.fillRect(0, 0, 640, 640);

        for (let ty = 0; ty < 20; ty++) {
            for (let tx = 0; tx < 20; tx++) {
                drawTile(tiles.grass, tx, ty);
            }
        }

        const rng = makeRNG(237);
        const trees = generate(8, () => [rng.rangei(0, 20), rng.rangei(0, 20)]);
        for (let [tx, ty] of trees) {
            drawTile(tiles.tree, tx, ty);
        }

        drawTile(tiles.player, 4, 4);
    }, []);

    return (
        <div className="flex-row">
            <div
                style={{
                    flexGrow: 0,
                    border: 'solid 1px #CCC',
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

export function App() {
    useCommonStyles();
    useGlobalStyles();

    return (
        <div className="flex-col">
            <h1>Graham's Tale</h1>
            <Map />
            <div style={{ height: 48 }} />
            <img src="/assets/tiles/colored-transparent_packed.png" />
        </div>
    );
}
