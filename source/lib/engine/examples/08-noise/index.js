import React from 'react';
import chroma from 'chroma-js';
import * as ReactEx from '../../../react-ex';
import * as core from '../../../core/src';
import { EngineFrame, useEngine } from '../..';

export default function () {
    const controls = {
        scale: {
            type: 'slider',
            value: 40,
            min: 1,
            max: 200,
        },
        rotation: {
            type: 'slider',
            value: 0,
            min: 0,
            max: 2 * Math.PI,
            step: Math.PI / 180,
        },
    };
    const [params, setParams] = React.useState(
        Object.fromEntries(Object.entries(controls).map(([k, v]) => [k, v.value]))
    );

    const engine = useEngine(() => {
        const noiseView = new NoiseView({ scale: params.scale });
        const actors = [noiseView];
        engine.actors.push(...actors);
    });

    const handleChange = (params) => {
        setParams(params);

        engine.actors.selectByID('noiseView').modify({
            scale: params.scale,
            rotation: params.rotation,
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
            <EngineRecorder engine={engine} />
            <ControlsBlock params={params} controls={controls} onChange={handleChange} />

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

function EngineRecorder({ engine }) {

    return (
        <ReactEx.Flex>
            <button>record</button>
        </ReactEx.Flex>
    )
}

function ControlsBlock({ params, controls, onChange }) {
    const handleChange = (evt, name, ctl) => {
        let value = evt.target.value;
        try {
            value = parseFloat(value);
        } catch (ignored) {
            return;
        }

        value = Math.max(value, ctl.min ?? 0);
        value = Math.min(value, ctl.max ?? 100);

        if (params[name] === value) {
            return;
        }
        onChange({ ...params, [name]: value });
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
                {Object.entries(controls).map(([name, ctl]) => (
                    <React.Fragment key={name}>
                        <div>
                            <div>{name}</div>
                            <div>
                                <small>
                                    {ctl.min} - {ctl.max}
                                </small>
                            </div>
                        </div>
                        <div>
                            <input
                                style={{
                                    width: '100%',
                                }}
                                type="range"
                                min={ctl.min ?? 0}
                                max={ctl.max ?? 1000}
                                step={ctl.step ?? 1}
                                value={params[name]}
                                onChange={(evt) => handleChange(evt, name, ctl)}
                            />
                        </div>
                        <div>
                            <input
                                type="number"
                                min={ctl.min ?? 0}
                                max={ctl.max ?? 1000}
                                value={params[name]}
                                onChange={(evt) => handleChange(evt, name, ctl)}
                            />
                        </div>
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
}

class NoiseView {
    constructor({ scale = 1, rotation = 0 } = {}) {
        const rng = core.makeRNG();
        this._data = {
            rng,
            simplex: core.makeSimplexNoise(rng.uint31()),
            offset: 6000,
        };
        this._imageData = null;
        this._scale = scale;
        this._rotation = rotation;
        this._uuid = rng.uuid();

        console.log(`new Actor: ${this._uuid}`);
    }

    get id() {
        return 'noiseView';
    }

    modify({ scale, rotation }) {
        if (scale !== undefined) {
            this._scale = scale;
        }
        if (rotation !== undefined) {
            this._rotation = rotation;
        }
    }

    update() {
        this._data.offset += 1;
    }

    init2D({ ctx, width, height }) {
        this._imageData = ctx.createImageData(width, height);
    }

    render2D({ ctx, width, height }) {
        const { rng, simplex, offset } = this._data;

        const scale = 1 / this._scale;
        const angle = this._rotation;
        const imageData = this._imageData;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const cx = x - width / 2;
                const cy = y - height / 2;

                const rx = cx * Math.cos(angle) - cy * Math.sin(angle);
                const ry = cy * Math.cos(angle) + cx * Math.sin(angle);

                const nx = rx * scale + 0.1 * offset * Math.cos(angle);
                const ny = ry * scale + 0.1 * offset * Math.sin(angle);
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
