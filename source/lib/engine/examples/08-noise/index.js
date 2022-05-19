import React from 'react';
import chroma from 'chroma-js';
import * as ReactEx from '../../../react-ex';
import * as core from '../../../core/src';
import { EngineFrame, useEngine } from '../..';

export default function () {
    const [params, setParams] = React.useState({
        scale: 40,
    });
    const engine = useEngine(() => {
        const noiseView = new NoiseView({ scale: params.scale });
        const actors = [noiseView];
        engine.actors.push(...actors);
    });

    const handleChange = (params) => {
        setParams(params);

        engine.actors.selectByID('noiseView').modify({
            scale: params.scale,
        });
    };

    return (
        <ReactEx.ReadingFrame>
            <ReactEx.Flex>
                <h1>Noise Example</h1>
                <div style={{ flex: '1 0 0 ' }} />
                <div>
                    <a
                        href="https://github.com/raiment-studios/monorepo/blob/main/source/lib/engine/examples/08-noise/index.js"
                        target="_blank"
                    >
                        Source code
                    </a>
                </div>
            </ReactEx.Flex>

            <EngineFrame engine={engine} />
            <ControlsBlock params={params} onChange={handleChange} />

            <h1>Notes</h1>
            <ul>
                <li>
                    Simple noise appears to be fairly slow. The current experiment is less than
                    60fps filling a block of ~600k pixels.
                </li>
            </ul>
        </ReactEx.ReadingFrame>
    );
}

function ControlsBlock({ params, onChange }) {
    const handleChange = (evt) => {
        let value = evt.target.value;
        try {
            value = parseFloat(value);
        } catch (ignored) {
            return;
        }

        if (value < 1) {
            return;
        }
        if (value > 100) {
            return;
        }

        onChange({ ...params, scale: value });
    };

    return (
        <div
            style={{
                margin: '4px 0',
                padding: '8px 12px',
                border: 'solid 1px #CCC',
                borderRadius: 8,
            }}
        >
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '8rem 1fr 1fr',
                    columnGap: '1rem',
                }}
            >
                <div>Scale</div>
                <div>
                    <input
                        style={{
                            width: '100%',
                        }}
                        type="range"
                        min={1}
                        max={100}
                        value={params.scale}
                        onChange={handleChange}
                    />
                </div>
                <div>
                    <input
                        type="number"
                        min={1}
                        max={100}
                        value={params.scale}
                        onChange={handleChange}
                    />
                </div>
            </div>
        </div>
    );
}

class NoiseView {
    constructor({ scale = 1 } = {}) {
        const rng = core.makeRNG();
        this._data = {
            rng,
            simplex: core.makeSimplexNoise(rng.uint31()),
            offset: 0,
        };
        this._imageData = null;
        this._scale = scale;
        this._uuid = rng.uuid();

        console.log(`new Actor: ${this._uuid}`);
    }

    get id() {
        return 'noiseView';
    }

    modify(values) {
        this._scale = values.scale;
    }

    update() {
        this._data.offset += 0.025;
    }

    init2D({ ctx, width, height }) {
        this._imageData = ctx.createImageData(width, height);
    }

    render2D({ ctx, width, height }) {
        const { rng, simplex, offset } = this._data;

        const scale = 1 / this._scale;
        const imageData = this._imageData;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const nx = (x - width / 2) * scale + offset;
                const ny = (y - height / 2) * scale;
                const v = (simplex.noise2D(nx, ny) + 1) / 2.0;

                const v1 = Math.floor(255 * v);

                const i = 4 * (y * width + x);
                imageData.data[i + 0] = v1;
                imageData.data[i + 1] = v1;
                imageData.data[i + 2] = v1;
                imageData.data[i + 3] = 255;
            }
        }
        ctx.putImageData(imageData, 0, 0);
    }
}
