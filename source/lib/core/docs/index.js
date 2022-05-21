import React from 'react';
import * as ReactEx from '../../react-ex';
import * as core from '..';

export default function () {
    return (
        <ReactEx.ReadingFrame>
            <h3>Format</h3>
            <h4>formatNumber</h4>
            <CodeExample
                example={`
formatNumber = core.formatNumber;
formatNumber(3)
formatNumber(3000)
formatNumber(3000000)
formatNumber(3000000000)
formatNumber(300000000000)
formatNumber(3.3e23)
formatNumber(3.311e23)
formatNumber(3.39923e42)
formatNumber(3.1)
formatNumber(3.003)
formatNumber(0.003)
formatNumber(3.00003)
formatNumber(0.000003)
formatNumber(0.000000003)

// Whole multiples of π are special-cased
formatNumber(2 * Math.PI)
    `}
            />

            <h3>RNG</h3>
            <h4>sign</h4>
            <CodeExample
                example={`
rng = core.makeRNG();
rng.sign()
rng.sign()
rng.sign()
    `}
            />
            <h4>int31</h4>
            <CodeExample
                example={`
rng = core.makeRNG();
rng.int31()
rng.int31()
rng.int31()
rng.int31()
rng.int31()
rng.int31()
    `}
            />
            <h4>shuffle</h4>
            <CodeExample
                example={`
arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
rng = core.makeRNG();

rng.shuffle(arr)
rng.shuffle(arr)
// Note: the original array is unaffected by the shuffle operation
arr

rng.shuffle(arr)
rng.shuffle(arr)
    `}
            />

            <h3>Distributions</h3>
            <h4>Math.random</h4>
            <SamplerChart f={Math.random} range={[0, 1]} />

            <h4>Math.sin</h4>
            <SamplerChart f={() => Math.sin(2 * Math.PI * Math.random())} range={[-1, 1]} />

            <h4>Custom</h4>
            <SamplerChart
                f={() => {
                    let v;
                    let prob;
                    do {
                        v = Math.random();
                        let d = Math.abs(v - 0.5);
                        prob = 2 * Math.pow(d * 2, 2 * Math.PI);
                    } while (Math.random() < prob);
                    return v;
                }}
                range={[0, 1]}
            />

            <h4>core.makeRNG</h4>
            <SamplerChart
                f={(() => {
                    const rng = core.makeRNG();
                    return () => {
                        return rng.random();
                    };
                })()}
                range={[0, 1]}
            />
            <h4>Simplex noise2D</h4>
            <SamplerChart
                f={(() => {
                    const simplex = core.makeSimplexNoise(Math.random());
                    return () => {
                        const x = (-1 + 2 * Math.random()) * 1e3;
                        const y = (-1 + 2 * Math.random()) * 1e3;
                        return simplex.noise2D(x, y);
                    };
                })()}
                range={[-1, 1]}
            />
            <h4>Simplex noise3D</h4>
            <SamplerChart
                f={(() => {
                    const simplex = core.makeSimplexNoise(Math.random());
                    return () => {
                        const x = (-1 + 2 * Math.random()) * 1e3;
                        const y = (-1 + 2 * Math.random()) * 1e3;
                        const z = (-1 + 2 * Math.random()) * 1e3;
                        return simplex.noise3D(x, y, z);
                    };
                })()}
                range={[-1, 1]}
            />
        </ReactEx.ReadingFrame>
    );
}

function SamplerChart({ f, range }) {
    const [min, setMin] = React.useState(0);
    const [max, setMax] = React.useState(0);
    const [outOfRange, setOutOfRange] = React.useState(0);
    const [bucketMax, setBucketMax] = React.useState(0);
    const [buckets, setBuckets] = React.useState([]);

    React.useEffect(() => {
        const buckets = new Array(100);
        buckets.fill(0);
        let bucketMax = 0;

        let min = Infinity;
        let max = -Infinity;
        let outOfRange = 0;

        const state = {
            stop: false,
        };
        (async () => {
            for (let j = 0; j < 10000; j++) {
                for (let i = 0; i < 100; i++) {
                    const v = f();

                    min = Math.min(min, v);
                    max = Math.max(max, v);

                    if (!(v >= range[0] && v <= range[1])) {
                        outOfRange++;
                        continue;
                    }

                    const bi = Math.floor(((v - range[0]) / (range[1] - range[0])) * 100);
                    buckets[bi]++;
                    bucketMax = Math.max(bucketMax, buckets[bi]);
                }

                if (state.stop) {
                    return;
                }

                setMin(min);
                setMax(max);
                setOutOfRange(outOfRange);
                setBucketMax(bucketMax);
                setBuckets(buckets);
                await new Promise((resolve) => setTimeout(resolve, 1000 / 30));
            }
        })();

        return () => {
            state.stop = true;
        };
    }, []);

    return (
        <div>
            <div>Max: {max}</div>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'row',
                }}
            >
                {buckets.map((bucket, index) => (
                    <div
                        key={index}
                        style={{
                            position: 'relative',
                            width: 6,
                            height: 100,
                            backgroundColor: 'white',
                            borderBottom: 'solid 2px #AAA',
                        }}
                    >
                        <div
                            key={index}
                            style={{
                                position: 'absolute',
                                bottom: 0,
                                width: 6,
                                height: `${Math.floor((100 * bucket) / bucketMax)}px`,
                                backgroundColor: index % 2 ? '#CCE' : '#BBB',
                            }}
                        />
                    </div>
                ))}
            </div>
            <div>Min: {min}</div>
            <div>
                Out of range: {outOfRange} [{range[0]}, {range[1]}]
            </div>
        </div>
    );
}

function CodeExample({ example }) {
    const [results, setResults] = React.useState([]);

    const _state = {};
    const context = {
        _state,
        core,
    };

    const evaluateExpression = (line) => {
        const result = {
            value: undefined,
            exception: undefined,
        };
        const f = new Function(...Object.keys(context), `return ${line}`);
        try {
            const ret = f(...Object.values(context));
            Object.assign(context, _state);
            result.value = ret;
        } catch (err) {
            result.exception = err;
        }
        return result;
    };

    React.useEffect(() => {
        for (let line of example.trim().split('\n')) {
            let node = {
                type: 'generic',
                input: line,
                result: undefined,
            };

            let m;
            if (line.trim().length === 0) {
                node.type = 'blank';
            } else if (line.trim().startsWith('//')) {
                node.type = 'comment';
            } else if ((m = line.trim().match(/^([a-z]+)\s+=\s+(.+)$/i))) {
                node.type = 'assignment';

                let varName = m[1];
                let expression = m[2];
                line = line = `_state.${varName} = ${expression}`;
                const result = evaluateExpression(line);
                node = { ...node, varName, expression, result };
            } else {
                node.type = 'expression';
                const result = evaluateExpression(line);
                node = { ...node, result };
            }
            setResults((results) => [...results, node]);
        }
    }, []);

    return (
        <div
            style={{
                padding: 8,
                border: 'solid 1px #CCC',
                borderRadius: 4,
                backgroundColor: 'rgba(0,0,0,.02)',
            }}
        >
            {results.map((node, index) => (
                <div key={index} style={{ minHeight: '1rem' }}>
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'row',

                            margin: node.type === 'expression' ? '4px 0 ' : 0,
                            padding: node.type === 'expression' ? '4px 0' : 0,
                            borderRadius: node.type === 'expression' ? 4 : 0,
                            backgroundColor:
                                node.type === 'expression' ? 'rgba(80,160,255,.10)' : 'transparent',
                        }}
                    >
                        <div
                            style={{
                                color: '#999',
                                padding: '0 0 0 0.25rem',
                            }}
                        >
                            <code>{`${index + 1}`.padStart(3, '0')}</code>
                        </div>
                        <div style={{ flex: '0 0 1rem' }} />
                        <div style={{ flex: '1 0 8rem' }}>
                            {node.type === 'blank' ? null : node.type === 'comment' ? (
                                <code style={{ color: '#151' }}>{node.input}</code>
                            ) : (
                                <div>
                                    <code style={{ whiteSpace: 'nowrap' }}>{`${node.input}`}</code>
                                </div>
                            )}
                        </div>
                        <div style={{ flex: '0 0 1rem' }} />
                        <div style={{ flex: `${node.type === 'expression' ? 8 : 0} 0 0` }}>
                            {node.type === 'expression' && <Result result={node.result} />}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function Result({ result }) {
    return (
        <div style={{ color: '#33C' }}>
            <code>
                {'→ '}
                {Array.isArray(result.value) ? `[ ${result.value.join(', ')} ]` : result.value}
            </code>
        </div>
    );
}
