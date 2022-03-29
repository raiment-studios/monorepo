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
            <div className="flex-row">
                <Map />
                <Cards />
            </div>
            <div style={{ height: 48 }} />
            <img src="/assets/tiles/colored-transparent_packed.png" />
        </div>
    );
}

function Cards() {
    const image = '/assets/images/galthea-forest.png';
    const imageBrightness = 0.17;

    return (
        <div style={{ padding: '1rem' }}>
            <div
                className="flex-col serif"
                style={{
                    flex: '1 0 0',
                    border: 'solid 1px #444',
                    borderRadius: 8,
                    boxSizing: 'border-box',
                    width: 320,
                    minWidth: 320,
                    maxWidth: 320,
                    height: 400,
                    minHeight: 480,
                    maxHeight: 480,

                    backgroundColor: '#333',
                    backgroundImage: [
                        `linear-gradient(rgba(50, 0, 0, 0.15), rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0.95))`,
                        `url("${image}")`,
                    ].join(', '),
                    backgroundSize: 'cover',
                }}
            >
                <div
                    className="flex-row"
                    style={{
                        margin: '2px 2px 1px 2px',
                        padding: '0 4px 1px 4px',
                        alignItems: 'start',
                        backgroundColor: 'rgba(0, 0,0,.55)',
                        fontSize: 14,
                        borderRadius: 2,
                        backdropFilter: 'blur(8px)',
                    }}
                >
                    <div className="flex-col">
                        <div style={{ fontWeight: 600 }}>Galthea Forest</div>
                        <div
                            style={{
                                opacity: 0.8,
                                fontSize: 11,
                                fontWeight: 100,
                                fontStyle: 'italic',
                            }}
                        >
                            Area
                        </div>
                    </div>
                    <div style={{ flex: '1 0 0' }} />
                    <div style={{ opacity: 0.8, fontSize: 11, fontWeight: 100 }}>⚅ 1000</div>
                </div>
                <div className="flex-row-center" style={{ justifyContent: 'center', marginTop: 2 }}>
                    <div
                        className="flex-col"
                        style={{
                            boxSizing: 'content-box',
                            border: 'solid 2px rgba(80,80,80,0.95)',
                            width: 300,
                            minWidth: 300,
                            maxWidth: 300,
                            height: 200,
                            minHeight: 200,
                            maxHeight: 200,
                            backgroundColor: '#555',
                            backgroundSize: 'cover',
                            backgroundImage: `url(${image})`,
                            imageRendering: 'pixelated',
                            justifyContent: 'stretch',
                            alignItems: 'stretch',
                        }}
                    ></div>
                </div>
                <div className="flex-col" style={{ flex: '1 0 0', alignSelf: 'stretch' }}>
                    <div
                        className="flex-row"
                        style={{
                            margin: '2px 2px 1px 2px',
                            padding: '0 4px 1px 4px',
                            alignItems: 'start',
                            backgroundColor: 'rgba(0, 0,0,.45)',
                            fontSize: 11,
                            fontWeight: 100,
                            borderRadius: 2,
                            border: 'solid 1px rgba(127, 127, 127, 0.85)',
                        }}
                    >
                        <div></div>
                        <div style={{ flex: '1 0 0' }} />
                        <div
                            style={{
                                opacity: 0.5,
                                fontStyle: 'italic',
                                fontWeight: 100,
                                fontSize: 9,
                            }}
                        >
                            core
                        </div>
                    </div>
                    <div
                        className="flex-col"
                        style={{
                            flex: '1 0 0',
                            margin: '2px 2px 1px 2px',
                            padding: '4px 4px 1px 4px',
                            lineHeight: '0.80rem',
                            alignItems: 'start',
                            backgroundColor: 'rgba(0, 0,0,.45)',
                            color: '#DDD',
                            fontSize: 12,
                            fontWeight: 100,
                            borderRadius: 2,
                            border: 'solid 1px rgba(127, 127, 127, 0.85)',
                        }}
                    >
                        <div style={{ marginBottom: '0.75rem', fontStyle: 'italic' }}>
                            "This place would be a beautiful place for a walk in the afternoon if it
                            weren't for the constant fear of death."
                        </div>
                        <div>
                            A typical stretch of forest in Galthea: warm, pleasant, and haunted with
                            the ever-present danger of the Maelstrom.
                        </div>
                    </div>
                    <div
                        className="flex-row"
                        style={{
                            margin: '2px 2px 1px 2px',
                            padding: '0 4px 1px 4px',
                            alignItems: 'start',
                            backgroundColor: 'rgba(0, 0,0,.45)',
                            fontSize: 8,
                            fontWeight: 100,
                            borderRadius: 2,
                        }}
                    >
                        <div style={{ opacity: 0.7 }}>Ridley Winters 2022</div>
                        <div style={{ flex: '1 0 0 ' }} />
                        <div style={{ opacity: 0.7 }}>galthea-forest / 6eY3</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
