import React from 'react';
import * as ReactEx from '@raiment/react-ex';
import * as core from '@raiment/core';
import * as fs from './__runtime/fs';
import dayjs from 'dayjs';
import 'serve:data.yaml';
import _ from 'lodash';

export default function () {
    const [database, setDatabase] = React.useState(null);
    const [dirty, setDirty] = React.useState(false);

    ReactEx.useAsyncEffect(async (token) => {
        const resp = await fetch('data.yaml');
        const text = await resp.text();
        const obj = core.parseYAML(text);

        obj.entries ??= {};

        const todayID = makeTodayID();
        if (!obj.entries[todayID]) {
            const keys = Object.keys(obj.entries).sort((a, b) => parseInt(b, 10) - parseInt(a, 10));
            if (keys.length === 0) {
                obj.entries[todayID] = { text: '' };
            } else {
                obj.entries[todayID] = _.cloneDeep(obj.entries[keys[0]]);
            }
        }

        token.check();
        setDatabase(obj);
    }, []);

    React.useEffect(() => {
        let ctx = {
            timer: 0,
            lastSaved: null,
        };
        const save = async () => {
            if (dirty) {
                database.count++;
                await fs.writeFile('data.yaml', core.stringifyYAML(database));
                setDirty(false);
            }
        };
        ctx.timer = setTimeout(save, 2500);
        return () => {
            clearTimeout(ctx.timer);
        };
    }, [database]);

    if (!database) {
        return (
            <ReactEx.ReadingFrame>
                <h1>Loading...</h1>
            </ReactEx.ReadingFrame>
        );
    }

    const entryID = makeTodayID();
    const entry = database.entries[entryID];

    return (
        <ReactEx.ReadingFrame>
            <h1>Sea Notepad</h1>

            <EntryEditor
                entry={entry}
                onUpdate={(fields) => {
                    setDirty(true);
                    setDatabase({
                        ...database,
                        entries: {
                            ...database.entries,
                            [entryID]: { ...entry, ...fields },
                        },
                    });
                }}
            />
            <div style={{ marginBottom: '1rem', fontStyle: 'italic', fontSize: '80%' }}>
                {dirty ? 'modified' : 'saved'}
            </div>

            {Object.entries(database.entries)
                ?.sort((a, b) => parseInt(b, 10) - parseInt(a, 10))
                .slice(1)
                .map(
                    ([key, value]) =>
                        key !== entryID && (
                            <div key={key}>
                                <h3>{key}</h3>
                                <pre>{value.text}</pre>
                            </div>
                        )
                )}
        </ReactEx.ReadingFrame>
    );
}

function makeTodayID() {
    return dayjs().format('YYYYMMDD');
}

function EntryEditor({ entry, onUpdate }) {
    return (
        <textarea
            className="mono"
            style={{
                width: '43rem',
                height: '32rem',
                padding: '2rem',
            }}
            value={entry.text}
            onChange={(evt) => {
                onUpdate({ text: evt.target.value });
            }}
        />
    );
}
