import React from 'react';
import * as core from '../../../lib/core';
import * as ReactEx from '../../../lib/react-ex';
import db from 'yaml:database.yaml';

export default function () {
    return (
        <ReactEx.ReadingFrame>
            <h1>Hello World</h1>
            <pre>{core.stringifyYAML(db)}</pre>
        </ReactEx.ReadingFrame>
    );
}
