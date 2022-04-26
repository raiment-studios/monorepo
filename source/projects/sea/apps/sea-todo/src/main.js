/*!@sea:header
modules:
    "@raiment/core":     file:///workspaces/monorepo/source/lib/core/dist/raiment-core-latest.tgz
    "@raiment/react-ex": file:///workspaces/monorepo/source/lib/react-ex/dist/raiment-react-ex-latest.tgz
 */

import React from 'react';
import * as core from '@raiment/core';
import * as ReactEx from '@raiment/react-ex';
import { Database } from './datamodel/database';
import { IconContext } from 'react-icons';
import { VscMenu, VscFile, VscSearch, VscSave, VscSettingsGear } from 'react-icons/vsc';

function transformData(databaseSource) {
    const db = new Database({
        name: databaseSource.name,
        fileHandle: databaseSource.fileHandle,
    });
    const data = core.parseYAML(databaseSource.text);
    for (let desc of data.todos) {
        let title = desc;
        let done = false;

        title = title.replace(/\s!done/, () => {
            done = true;
            return '';
        });

        db._data.items.push({
            id: core.shortID(),
            title,
            done,
        });
    }
    return db;
}

const defaultDatabase = transformData({
    name: '(default)',
    text: `
todos:
    - Hello world
    - Hola mundo
    - Bonjour le monde
    - Add tags
`,
});

export default function () {
    const [database, setDatabase] = React.useState(defaultDatabase);
    const [databaseView, setDatabaseView] = React.useState(null);

    ReactEx.useAsyncEffect(
        async (token) => {
            const teardown = database.events.on('update', () => {
                setDatabaseView(database.view());
            });
            token.unwind(teardown);

            database.events.fire('update');
        },
        [database]
    );

    // TODO: what if current file is modified?
    const handleChangeDatabase = (databaseSource) => {
        const database = transformData(databaseSource);
        setDatabase(database);
    };
    const handleSave = async () => {
        const obj = database.export();
        const text = core.stringifyYAML(obj);
        console.log(text);

        let handle = database.fileHandle;
        if (!handle) {
            handle = await window.showSaveFilePicker();
        }
        const stream = await handle.createWritable();
        stream.write(text);
        stream.close();
    };

    if (!databaseView) {
        return 'Loading...';
    }

    return (
        <IconContext.Provider value={{ size: '1rem' }}>
            <AppFrame onChangeDatabase={handleChangeDatabase} onSave={handleSave}>
                <div
                    className="flex-row"
                    style={{
                        margin: '0 0 2rem',
                        borderBottom: '1px solid #CCC',
                        alignItems: 'end',
                    }}
                >
                    <div
                        style={{
                            fontWeight: 100,
                            fontSize: '16pt',
                        }}
                    >
                        sea-todo: {databaseView.name}
                    </div>
                </div>
                <div>
                    <TodoList database={databaseView} />
                </div>
            </AppFrame>
        </IconContext.Provider>
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

function AppFrame({
    children, //
    onChangeDatabase,
    onSave,
}) {
    ReactEx.useCommonStyles();

    React.useEffect(() => {
        document.title = 'sea-todo';
    }, []);

    const buttonStyle = {
        padding: 4,
        userSelect: 'none',
        cursor: 'pointer',
    };

    return (
        <div className="flex-row">
            <div
                className="flex-col"
                style={{
                    padding: 8,
                }}
            >
                <div style={buttonStyle} onClick={() => alert('Not yet implemented')}>
                    <VscMenu />
                </div>
                <div
                    style={buttonStyle}
                    onClick={() => {
                        let fileHandle;

                        async function getFile() {
                            [fileHandle] = await window.showOpenFilePicker();
                            if (fileHandle.kind !== 'file') {
                                return;
                            }
                            const fileData = await fileHandle.getFile();
                            const text = await fileData.text();
                            onChangeDatabase({
                                name: fileData.name,
                                fileHandle,
                                text,
                            });
                        }
                        getFile();
                    }}
                >
                    <VscFile />
                </div>
                <div
                    style={buttonStyle}
                    onClick={() => {
                        onSave();
                    }}
                >
                    <VscSave />
                </div>
                <div style={buttonStyle} onClick={() => alert('Not yet implemented')}>
                    <VscSearch />
                </div>
                <div style={buttonStyle} onClick={() => alert('Not yet implemented')}>
                    <VscSettingsGear />
                </div>
            </div>

            <div
                style={{
                    margin: '1rem auto',
                    width: '60rem',
                }}
            >
                {children}
            </div>
        </div>
    );
}
