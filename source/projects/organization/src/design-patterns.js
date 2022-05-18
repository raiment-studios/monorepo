import React from 'react';
import { ReadingFrame } from '../../../lib/react-ex';
import { parseYAML } from '../../../lib/core';

const content = parseYAML(`
patterns:
    - name: Shared Object
`);

export default function () {
    return (
        <ReadingFrame>
            <h1>Design Patterns</h1>
            <h3>Shared Object</h3>
            <h3>Callbacks</h3>
            <h3>Event Emitter</h3>
            <h3>Command</h3>
            {content.patterns.map((pattern) => (
                <Pattern key={pattern.name} pattern={pattern} />
            ))}
        </ReadingFrame>
    );
}

function Pattern({ pattern }) {
    return <h3>{pattern.name}</h3>;
}
