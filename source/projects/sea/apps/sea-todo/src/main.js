/*!@sea:header
modules:
    "@raiment/core":     file:///workspaces/monorepo/source/lib/core/dist/raiment-core-latest.tgz
    "@raiment/react-ex": file:///workspaces/monorepo/source/lib/react-ex/dist/raiment-react-ex-latest.tgz
 */

import React from 'react';
import * as core from '@raiment/core';
import * as ReactEx from '@raiment/react-ex';
import { Database } from './datamodel/database';

function transformData(data) {
    const db = new Database();
    for (let desc of data.todos) {
        // TODO: add parsing
        db._data.items.push({
            id: core.shortID(),
            title: desc,
            done: false,
        });
    }
    return db;
}

const database = transformData(
    core.parseYAML(`
todos:
    - Hello world
    - Hola mundo
    - Bonjour le monde
    - Add tags
`)
);

export default function () {
    const [databaseView, setDatabaseView] = React.useState(null);

    ReactEx.useAsyncEffect(async (token) => {
        database.on('update', () => {
            setDatabaseView(database.view());
        });
        setDatabaseView(database.view());
    }, []);

    if (!databaseView) {
        return 'Loading...';
    }

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
                <TodoList database={databaseView} />
            </div>
        </AppFrame>
    );
}

function TodoList({ database }) {
    console.count('TodoList.render');
    return (
        <>
            {database.select().map((item) => (
                <ItemRow key={item.id} item={item} />
            ))}
        </>
    );
}

function ItemRow({ item }) {
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
                    width: 12,
                    height: 12,
                    margin: 2,
                    border: 'solid 1px #777',
                    background: item.done ? '#CCC' : 'transparent',
                    borderRadius: 12,
                    cursor: 'pointer',
                    userSelect: 'none',
                }}
                onClick={() => {
                    item.update({ done: !item.done });
                }}
            />
            <div style={{ width: 8 }} />
            <div>{item.title}</div>
        </div>
    );
}

function AppFrame({ children }) {
    ReactEx.useCommonStyles();

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
