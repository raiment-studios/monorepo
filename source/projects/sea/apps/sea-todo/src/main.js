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

class Database {
    constructor() {
        this._data = data;
    }

    select() {
        return this._data;
    }
}

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
                <TodoList todos={data.todos} />
            </div>
        </AppFrame>
    );
}

function TodoList({ todos }) {
    return (
        <>
            {todos.map((item) => (
                <ItemRow key={item.id} item={item} />
            ))}
        </>
    );
}

class Item {
    constructor(json) {
        this._data = Object.assign(
            {
                id: core.shortID(),
                title: '',
                done: false,
            },
            json
        );
    }

    get title() {
        return this._data.title;
    }
    get id() {
        return this._data.id;
    }
    get done() {
        return this._data.done;
    }
}

function transformData(data) {
    data.todos = data.todos.map((item) => {
        return new Item({
            id: core.shortID(),
            title: item,
            done: false,
        });
    });
    return data;
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
                    width: 14,
                    height: 14,
                    border: 'solid 1px #777',
                    background: item.done ? '#CCC' : 'transparent',
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
