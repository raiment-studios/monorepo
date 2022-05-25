import React from 'react';
import { ReadingFrame, useAsyncEffect, Flex, PixelatedImage } from '../../../react-ex';
import * as core from '../../../core';
import * as THREE from 'three';
import {
    useEngine,
    EngineFrame,
    Grid,
    OrbitCamera,
    BasicLighting,
    GroundPlane,
    VoxelSprite,
    HeightMap,
    updatePosition,
    updateBoxCollision,
} from '../..';
import assets from 'glob:$(MONOREPO_ROOT)/source;assets/proto/**/*{.png,.asset.yaml}';

const assetURL = Object.fromEntries(assets.matches.map(({ url }) => [url.split('/').pop(), url]));

export default function () {
    return (
        <ReadingFrame>
            <h1>World</h1>

            <div style={{ margin: '6px 0' }}>
                <EngineView />
            </div>
            {Object.entries(assetURL)
                .filter(([key]) => key.endsWith('.png'))
                .map(([key, value]) => (
                    <ImageInfo key={key} url={value} />
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
                url: assetURL[
                    i == 0 ? 'kestrel.png' : rng.select(['wizard.png', 'ranger.png', 'ranger2.png'])
                ],
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
        const simplex2 = core.makeSimplexNoise();
        const simplex3 = core.makeSimplexNoise();
        const heightMap = new HeightMap({
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

        engine.actors.push(
            new Grid(),
            new OrbitCamera({ radius: 48, periodMS: 9000, offsetZ: 16 }), //
            new BasicLighting(),
            new GroundPlane(),
            ...sprites,
            heightMap,
            new Updater(heightMap)
        );
    });

    return <EngineFrame engine={engine} recorder="three" />;
}

class Updater {
    constructor(heightMap, { heightScale = 512, makeHeightFunc = null } = {}) {
        this._heightMap = heightMap;
        this._rng = core.makeRNG();
        this._heightFunc = null;
        this._makeHeightFunc = makeHeightFunc;
        this._heightScale = heightScale;

        // Note: this actor acts in "heightmap segment space", not "world space". For example,
        // the collider is set to the segment bounds, not the world heightmap bounds.
        this._position = new THREE.Vector3(0, 0, 0);
        this._velocity = new THREE.Vector3(0, 0, 0);
        this._acceleration = new THREE.Vector3(0, 0, 0);

        const S = this._heightMap.segments;
        this._collider = new THREE.Box3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(S, S, S));
    }

    get position() {
        return this._position;
    }
    get velocity() {
        return this._velocity;
    }

    get acceleration() {
        return this._acceleration;
    }

    update() {
        const rng = this._rng;

        updatePosition(this, 1);
        updateBoxCollision(this, this._collider);

        const K = 0.25;
        const MV = 2;
        this._velocity.x += K * rng.range(-1, 1);
        this._velocity.y += K * rng.range(-1, 1);
        this._velocity.clampScalar(-MV, MV);
    }

    stateMachine() {
        const rng = this._rng;
        let offsetX = 0.0;
        let offsetZ = 0;

        return {
            _bind: this,
            _start: function* () {
                this._position.x = rng.range(0, this._heightMap.segments);
                this._position.y = rng.range(0, this._heightMap.segments);
                this._velocity.x = rng.sign() * rng.range(0.2, 2);
                this._velocity.y = rng.sign() * rng.range(0.2, 2);

                return 'changeTerrain';
            },
            changeTerrain: function* () {
                if (this._makeHeightFunc) {
                    this._heightFunc = this._makeHeightFunc({ heightMap: this._heightMap });
                } else {
                    const simplex = core.makeSimplexNoise(4342);
                    const amplitude = 0.01 * rng.range(0.4, 3);
                    const s = 1 / this._heightMap.segments;
                    offsetX += 1;
                    offsetZ = 0.5 + 0.5 * Math.sin(offsetX / 10);
                    this._heightFunc = (x, y) =>
                        amplitude *
                        (offsetZ + (0.5 + 0.5 * simplex.noise2D(offsetX + x * s, y * s)));
                }
                return 'update';
            },
            update: function* () {
                const D = 32;
                const MAX_DIST = Math.sqrt(2 * D * D);
                const heightMap = this._heightMap;

                const frames = rng.rangei(10, 100);
                for (let i = 0; i < frames; i++) {
                    const centerSX = Math.floor(this._position.x);
                    const centerSY = Math.floor(this._position.y);
                    for (let sy = centerSY - D, lsy = -D; sy <= centerSY + D; lsy++, sy++) {
                        for (let sx = centerSX - D, lsx = -D; sx <= centerSX + D; lsx++, sx++) {
                            if (!heightMap.coordValidS(sx, sy)) {
                                continue;
                            }
                            const [wx, wy] = heightMap.coordS2W(sx, sy);
                            const wz = heightMap.getLayerSC('height', sx, sy);

                            const tz = this._heightScale * this._heightFunc(wx, wy);
                            let dz = tz - wz;
                            if (Math.abs(dz) < 1e-3) {
                                continue;
                            }
                            dz /= 20;

                            const normalizedDist = Math.sqrt(lsx * lsx + lsy * lsy) / MAX_DIST;
                            const k = 0.01;
                            dz *= k + (1 - k) * (1.0 - normalizedDist);
                            const nz = wz + dz;
                            heightMap.setLayerWC('height', wx, wy, nz, false);
                        }
                    }

                    const K = D + 1;
                    for (let sy = centerSY - K; sy <= centerSY + K; sy++) {
                        for (let sx = centerSX - K; sx <= centerSX + K; sx++) {
                            if (!heightMap.coordValidS(sx, sy)) {
                                continue;
                            }
                            heightMap.updateSegment(sx, sy);
                        }
                    }
                    yield;
                }

                return 'changeTerrain';
            },
        };
    }
}

function ImageInfo({ url }) {
    const [data, setData] = React.useState(null);

    useAsyncEffect(async (token) => {
        const resp = await fetch(`${url}.asset.yaml`);
        const text = await resp.text();
        token.check();
        setData(core.parseYAML(text));
    }, []);

    return (
        <Flex dir="row">
            <div style={{ flex: '1 0 0' }} />
            <PixelatedImage src={url} />
            <div style={{ flex: '1 0 0' }} />
            <div>
                <h3>{url}</h3>
                <h3>License</h3>
                <pre>{textToReact(data?.license)}</pre>
            </div>
        </Flex>
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
