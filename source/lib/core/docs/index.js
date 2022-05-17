import React from 'react';
import * as ReactEx from '../../react-ex';
import * as core from '..';

export default function () {
    return (
        <ReactEx.ReadingFrame>
            <h3>RNG</h3>
            <h4>shuffle</h4>
            <ShuffleExample />
        </ReactEx.ReadingFrame>
    );
}

function ShuffleExample() {
    const [results, setResults] = React.useState([]);
    const example = `
arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
rng = core.makeRNG();

rng.shuffle(arr)
rng.shuffle(arr)
// Note: the original array is unaffected by the shuffle operation
arr

rng.shuffle(arr)
rng.shuffle(arr)
    `;

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
            result.exception = ret;
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
                borderRadius: 2,
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
                            border:
                                node.type === 'expression'
                                    ? 'solid 1px #AAA'
                                    : 'solid 1px rgba(0,0,0,0)',
                            borderRadius: node.type === 'expression' ? 4 : 0,
                            backgroundColor:
                                node.type === 'expression' ? 'rgba(0,0,255,.05)' : 'transparent',
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
                        <div style={{ flex: '2 0 0' }}>
                            {node.type === 'blank' ? null : node.type === 'comment' ? (
                                <code style={{ color: '#151' }}>{node.input}</code>
                            ) : (
                                <div>
                                    <code>{`${node.input}`}</code>
                                </div>
                            )}
                        </div>
                        <div style={{ flex: '0 0 1rem' }} />
                        <div style={{ flex: '1 0 0' }}>
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
