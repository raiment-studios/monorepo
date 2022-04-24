/*!@sea:header
modules:
    "@raiment/core":     file:///workspaces/monorepo/source/lib/core/dist/raiment-core-latest.tgz
    "@raiment/react-ex": file:///workspaces/monorepo/source/lib/react-ex/dist/raiment-react-ex-latest.tgz
 */

import React from 'react';
import * as core from '@raiment/core';
import * as ReactEx from '@raiment/react-ex';

const data = transformData(
    core.parseYAML(`
todos:
    - Hello world
    - Hola mundo
    - Bonjour le monde
`)
);

export default function () {
    ReactEx.useCommonStyles();
    return (
        <AppFrame>
            <div
                style={{
                    margin: '0 0 2rem',
                    borderBottom: '1px solid #CCC',
                    fontWeight: 100,
                    fontSize: '16pt',
                }}
            >
                sea-todo
            </div>
            <div>
                {data.todos.map((item) => (
                    <Item key={item.id} item={item} />
                ))}
            </div>
        </AppFrame>
    );
}

function transformData(data) {
    data.todos = data.todos.map((item) => {
        return {
            id: core.shortID(),
            title: item,
        };
    });
    return data;
}

function Item({ item }) {
    return (
        <div
            className="flex-row-center"
            style={{
                margin: '4px 0',
            }}
        >
            <div style={{ width: 2 }} />
            <div
                style={{
                    width: 14,
                    height: 14,
                    border: 'solid 1px #CCC',
                    borderRadius: 14,
                    cursor: 'pointer',
                    userSelect: 'none',
                }}
            />
            <div style={{ width: 8 }} />
            <div>{item.title}</div>
        </div>
    );
}

function AppFrame({ children }) {
    return (
        <div
            style={{
                margin: '1rem auto',
                width: '60rem',
            }}
        >
            {children}
        </div>
    );
}
