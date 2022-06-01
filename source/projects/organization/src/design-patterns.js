import React from 'react';
import { ReadingFrame } from '../../../lib/react-ex';
import { parseYAML } from '../../../lib/core';

const content = parseYAML(`
patterns:
    -   name: Pattern Template
        aka: alias 1, alias 2, alias 3
        motivation: todo
        use_cases: todo
        structure: todo
        potential_benefits: todo
        potential_risks: todo
        implementation: todo
        illustrative_examples: todo
        known_uses: todo
        related: todo
    -   name: Shared Object
        risks:
            - Synchronized
    -   name: Callbacks
    -   name: Event Emitter
    -   name: Command
    -   name: Cursor
    -   name: Wrapper
`);

export default function () {
    return (
        <ReadingFrame>
            <h1>Design Patterns</h1>

            {content.patterns.map((pattern) => (
                <Pattern key={pattern.name} pattern={pattern} />
            ))}
        </ReadingFrame>
    );
}

function Pattern({ pattern }) {
    return (
        <div>
            <h2>{pattern.name}</h2>
            <h3>Potential risks</h3>
            {pattern.risks?.map((risk) => (
                <div>{risk}</div>
            ))}
        </div>
    );
}
