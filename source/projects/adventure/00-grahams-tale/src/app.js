import React from 'react';
import { useCommonStyles, makeUseStyles, useLocalStorage, useAsyncEffect } from '@raiment/react-ex';
import { makeRNG } from '@raiment/core';
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
    },
};

function Map() {
    const refCanvas = React.useRef(null);

    useAsyncEffect(async (token) => {
        const canvas = refCanvas.current;

        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        const img = await loadImage('/assets/tiles/monochrome_packed.png');
        token.check();

        console.log(img);

        ctx.fillStyle = '#300';
        ctx.fillRect(0, 0, 320, 320);

        for (let ty = 0; ty < 10; ty++) {
            for (let tx = 0; tx < 10; tx++) {
                const sx = tiles.grass.offset[0] * 16;
                const sy = tiles.grass.offset[1] * 16;
                ctx.drawImage(img, sx, sy, 16, 16, tx * 32, ty * 32, 32, 32);
            }
        }
    }, []);

    return (
        <div
            style={{
                border: 'solid 1px #CCC',
            }}
        >
            <canvas
                ref={refCanvas}
                width={320}
                height={320}
                style={{
                    imageRendering: 'pixelated',
                }}
            />
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
            <img src="/assets/tiles/monochrome_packed.png" />
        </div>
    );
}
