import React from 'react';
import * as core from '@raiment/core';
import * as ReactEx from '@raiment/react-ex';
import { Database } from './datamodel/database';
import { IconContext } from 'react-icons';
import {
    VscMenu,
    VscFiles,
    VscSearch,
    VscSave,
    VscSettingsGear,
    VscAccount,
} from 'react-icons/vsc';
import { get as idbGet, set as idbSet } from 'idb-keyval';
import { EditorZeroState } from './views/editor_zero_state';
import { TodoList } from './views/todo_list';

const browserDB = {
    get: idbGet,
    set: idbSet,
};

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
    const [previousFileHandle, setPreviousFilehandle] = React.useState(undefined);
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

    if (previousFileHandle == undefined) {
        browserDB.get('last-fileHandle').then((fh) => {
            setPreviousFilehandle(fh ?? null);
        });
    }

    const handleReload = () => {
        if (database === defaultDatabase) {
            (async function () {
                // https://developer.mozilla.org/en-US/docs/Web/API/FileSystemHandle/requestPermission
                // https://stackoverflow.com/questions/66935991/react-useeffect-hook-causes-domexception-user-activation-is-required-to-request
                const fileHandle = await browserDB.get('last-fileHandle');

                const opts = { mode: 'readwrite' };
                if ((await fileHandle.queryPermission(opts)) === 'granted') {
                    console.log('granted');
                } else {
                    console.log('not granted');
                    const result = await fileHandle.requestPermission(opts);
                    console.log('not granted', result);
                }

                const fileData = await fileHandle.getFile();
                const text = await fileData.text();
                handleChangeDatabase({
                    name: fileData.name,
                    fileHandle,
                    text,
                });
            })();
        }
    };

    // TODO: what if current file is modified?
    const handleChangeDatabase = (databaseSource) => {
        const database = transformData(databaseSource);
        setDatabase(database);
    };
    const handleSave = async () => {
        const obj = database.export();
        const text = core.stringifyYAML(obj);

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
        <IconContext.Provider value={{ size: '20px' }}>
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
                    {previousFileHandle && database === defaultDatabase ? (
                        <EditorZeroState
                            onReload={handleReload}
                            previousFileHandle={previousFileHandle}
                        />
                    ) : (
                        <TodoList database={databaseView} />
                    )}
                </div>
            </AppFrame>
        </IconContext.Provider>
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
        padding: '6px 4px',
        userSelect: 'none',
        cursor: 'pointer',
    };

    return (
        <div className="flex-row">
            <div
                className="flex-col"
                style={{
                    padding: '8px 8px 16px 8px',
                    height: '100vh',
                    borderRight: 'solid 1px rgba(0,0,0,.08)',
                    background: 'rgba(0,0,0,.01)',
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
                            // https://web.dev/file-system-access/
                            [fileHandle] = await window.showOpenFilePicker();
                            if (fileHandle.kind !== 'file') {
                                return;
                            }

                            browserDB.set('last-fileHandle', fileHandle);

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
                    <VscFiles />
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
                <div style={{ flex: '1 0 0' }} />
                <div style={buttonStyle} onClick={() => alert('Not yet implemented')}>
                    <VscAccount />
                </div>
                <div style={buttonStyle} onClick={() => alert('Not yet implemented')}>
                    <VscSettingsGear />
                </div>
                <div style={{ flex: '0 0 8px' }} />
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
