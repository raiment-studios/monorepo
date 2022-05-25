import React from 'react';
import { ReadingFrame, useAsyncEffect, Flex } from '../../../react-ex';
import * as core from '../../../core';
import {
    useEngine,
    EngineFrame,
    Grid,
    OrbitCamera,
    BasicLighting,
    GroundPlane,
    loadImage,
    VoxelSprite,
    HeightMap,
} from '../..';
import assets from 'glob:$(MONOREPO_ROOT)/source;assets/proto/**/*{.png,.asset.yaml}';

const assetURL = Object.fromEntries(assets.matches.map(({ url }) => [url.split('/').pop(), url]));

export default function () {
    const [data, setData] = React.useState('');
    useAsyncEffect(async (token) => {
        const resp = await fetch(assetURL['kestrel.png.asset.yaml']);
        const text = await resp.text();
        token.check();
        setData(core.parseYAML(text));
    }, []);

    return (
        <ReadingFrame>
            <h1>VoxelSprite</h1>

            <div style={{ margin: '6px 0' }}>
                <EngineView />
            </div>
            {Object.entries(assetURL)
                .filter(([key]) => key.endsWith('.png'))
                .map(([key, value]) => (
                    <Flex key={key} dir="row">
                        <div style={{ flex: '1 0 0' }} />
                        <PixelatedImage src={value} />
                        <div style={{ flex: '1 0 0' }} />
                        <div>
                            <h3>{value}</h3>
                            <h3>Image license</h3>
                            <pre>{textToReact(data.license)}</pre>
                        </div>
                    </Flex>
                ))}
        </ReadingFrame>
    );
}

function EngineView() {
    const engine = useEngine(() => {
        const rng = core.makeRNG();

        let sprites = [];
        for (let i = 0; i < 8; i++) {
            const radius = rng.range(0, 32);
            const ang = rng.range(0, 2 * Math.PI);
            const worldX = radius * Math.cos(ang);
            const worldY = radius * Math.sin(ang);

            const RANGE = 96;

            const sprite = new VoxelSprite({
                url: assetURL[i == 0 ? 'kestrel.png' : rng.select(['wizard.png', 'ranger.png'])],
                flags: {
                    billboard: true,
                    pinToWorldGround: true,
                },
                worldX,
                worldY,
                stateMachine: function () {
                    return {
                        _start: function* () {
                            this.position.x = rng.rangei(-RANGE, RANGE);
                            this.position.y = rng.rangei(-RANGE, RANGE);
                            return 'target';
                        },
                        target: function* () {
                            const thinking = 60 * rng.range(0.5, 4);
                            yield thinking;

                            const dest = [rng.rangei(-RANGE, RANGE), rng.rangei(-RANGE, RANGE)];
                            return ['move', dest];
                        },
                        move: function* (dest) {
                            const step = 0.1;

                            do {
                                const dx = dest[0] - this.position.x;
                                const dy = dest[1] - this.position.y;
                                let count = 0;
                                if (dx < -step) {
                                    this.position.x -= step;
                                } else if (dx > step) {
                                    this.position.x += step;
                                } else {
                                    this.position.x = dest[0];
                                    count++;
                                }
                                if (dy < -step) {
                                    this.position.y -= step;
                                } else if (dy > step) {
                                    this.position.y += step;
                                } else {
                                    this.position.y = dest[1];
                                    count++;
                                }
                                if (count > 1) {
                                    return 'target';
                                }

                                yield;
                            } while (true);
                        },
                    };
                },
            });
            sprites.push(sprite);
        }

        engine.actors.push(
            new Grid(),
            new OrbitCamera({ radius: 48, periodMS: 9000, offsetZ: 16 }), //
            new BasicLighting(),
            new GroundPlane(),
            ...sprites,
            (() => {
                const simplex2 = core.makeSimplexNoise();
                const simplex3 = core.makeSimplexNoise();
                return new HeightMap({
                    offset: [-256 / 2, -256 / 2, 0],
                    scale: 256,
                    segments: 256,
                    heightFunc: (sx, sy) => {
                        const a = (1 + simplex3.noise2D(sx / 96, sy / 96)) / 2;
                        return 0.1 * a;
                    },
                    colorFunc: (sx, sy) => {
                        const rgb = [146 / 255, 201 / 255, 117 / 255];
                        const a = (1 + simplex3.noise2D(sx, sy)) / 2;
                        const b = (1 + simplex2.noise2D(sx / 100, sy / 100)) / 2;
                        const t = 0.5 * b + 0.5;
                        const s = t + a * (1 - t);
                        return [rgb[0] * s, rgb[1] * s, rgb[2] * s];
                    },
                });
            })()
        );
    });

    return <EngineFrame engine={engine} recorder="three" />;
}

function PixelatedImage({ src, scale = 6 }) {
    const [image, setImage] = React.useState(null);

    useAsyncEffect(async (token) => {
        const img = await loadImage(src);
        token.check();
        setImage(img);
    }, []);

    return (
        image && (
            <img
                style={{
                    width: image.width * scale,
                    height: image.height * scale,
                    imageRendering: 'pixelated',
                }}
                src={image.src}
            />
        )
    );
}

function textToReact(s) {
    if (!s) {
        return null;
    }

    const expression =
        /(https?:\/\/)[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)?/i;

    const re = new RegExp(expression);

    const parts = [];
    let t = s;
    while (t.length > 0) {
        const m = re.exec(t);
        if (!m || !(m.index >= 0)) {
            break;
        }
        const pre = t.substring(0, m.index);
        const match = m[0];
        const post = t.substring(m.index + match.length);

        const url = match.match(/^[a-z]+:\/\//) ? match : `https://${match}`;

        parts.push(
            <span>{pre}</span>, //
            <a href={url} target="_blank">
                {match}
            </a>
        );
        t = post;
    }
    if (t.length > 0) {
        parts.push(<span>{t}</span>);
    }

    return <>{parts}</>;
}
