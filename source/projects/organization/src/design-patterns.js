import React from 'react';
import { ReadingFrame, useLocalStorage, Flex } from '../../../lib/react-ex';
import contentImport from 'yaml:./design-patterns.yaml';
import _ from 'lodash';

export default function () {
    const content = normalize(contentImport);

    const groups = _.groupBy(content.patterns, (p) => p.type);
    return (
        <ReadingFrame width="42rem">
            <h1>Design Patterns</h1>

            {Object.entries(groups).map(([key, group]) => (
                <div key={key} style={{ marginBottom: '4rem' }}>
                    <h1>{key}</h1>
                    {group.map((pattern) => (
                        <Pattern key={pattern.name} pattern={pattern} />
                    ))}
                </div>
            ))}
        </ReadingFrame>
    );
}

function Pattern({ pattern }) {
    const [expanded, setExpanded] = useLocalStorage(`pattern-expanded-${pattern.name}`, true);

    return (
        <div>
            <Flex
                style={{
                    margin: '1.25rem 0 0.5rem',
                    borderBottom: 'solid 1px #CCC',
                }}
            >
                <div style={{ fontWeight: 'bold', fontSize: 24 }}>{pattern.name}</div>
                <div
                    style={{ padding: '0 8px', cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => setExpanded(!expanded)}
                >
                    {expanded ? '▼' : '▶'}
                </div>
            </Flex>
            {expanded && (
                <>
                    {pattern.overview &&
                        pattern.overview
                            ?.trim()
                            .split(/\n\n/)
                            .map((p, i) => <p key={i}>{p}</p>)}

                    <StringList title="Also known as" list={pattern.aliases} />
                    <StringList title="Potential benefits" list={pattern.benefits} />
                    <StringList title="Potential risks" list={pattern.risks} />
                    <StringList title="Illustrative examples" list={pattern.examples} />
                </>
            )}
        </div>
    );
}

function StringList({ title, list }) {
    return (
        <>
            <h4>{title}</h4>
            {list ? (
                <ol>
                    {list.map((name) => (
                        <li key={name}>{name}</li>
                    ))}
                </ol>
            ) : (
                <div style={{ color: 'red' }}>TODO</div>
            )}
        </>
    );
}

function normalize(content) {
    for (let pattern of content.patterns) {
        pattern.type ??= 'Software Pattern';
    }
    return content;
}
