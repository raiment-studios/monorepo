import React from 'react';
import { useCommonStyles, useLocalStorage } from '@raiment/react-ex';
import { makeRNG, shortID } from '@raiment/core';
import { last, cloneDeep, get, clone } from 'lodash';

function normalizeData(data) {
    function normalizeItem(item) {
        let obj = {
            type: 'task',
            id: shortID(),
            children: [],
        };
        if (typeof item === 'string') {
            obj.name = item;
        } else {
            Object.assign(obj, item);
        }

        let name = obj.name;
        name = name.replace(/@(project|release|milestone|task|todo|P|R|M|T|D)/, (m, type) => {
            obj.type =
                {
                    P: 'project',
                    R: 'release',
                    M: 'milestone',
                    T: 'task',
                    D: 'todo',
                }[type] || type;
            return '';
        });

        obj.name = name;

        obj.children = obj.children.map((item) => normalizeItem(item));

        return obj;
    }

    data.backlog = data.backlog.map((item) => normalizeItem(item));

    return data;
}

export function App() {
    useCommonStyles();

    const [data, setData] = React.useState(null);
    React.useEffect(() => {
        fetch('/assets/data.json')
            .then((resp) => resp.json())
            .then((json) => {
                setData(normalizeData(json));
            });
    }, []);

    if (!data) {
        return 'Loading...';
    }

    const { backlog } = data;

    return (
        <div style={{ margin: '2rem auto', width: '62em' }}>
            <div className="flex-col">
                <h1>Raiment Studios: Project</h1>
                <div
                    style={{
                        fontWeight: 'bold',
                    }}
                >
                    Backlog
                </div>

                <div
                    style={{
                        margin: '0.5rem 0',
                        padding: '4px 2px',
                        borderRadius: 4,
                        backgroundColor: '#EEE',
                    }}
                >
                    {backlog.map((item) => (
                        <ItemRow key={item.id} item={item} />
                    ))}
                </div>
            </div>
        </div>
    );
}

function ItemRow({ item }) {
    console.log(shortID());
    const decor = Object.assign(
        {
            color: '#CCC',
            symbol: '?',
        },
        {
            project: {
                color: '#4A7',
                symbol: 'P',
            },
            release: {
                color: '#A6F',
                symbol: 'R',
            },
            milestone: {
                color: '#C00',
                symbol: 'M',
            },
            task: {
                color: '#59D',
                symbol: 'T',
            },
            todo: {
                color: '#888',
                symbol: 'D',
            },
        }[item.type]
    );

    return (
        <div>
            <div
                className="flex-row-center"
                style={{
                    margin: 2,
                    padding: '4px 2px',
                    border: 'solid 1px rgba(0,0,0,.15)',
                    backgroundColor: 'white',
                }}
            >
                <div style={{ flex: '0 0 0.25rem' }} />
                <div
                    style={{
                        width: '1rem',
                        height: '1rem',
                        borderRadius: 4,
                        backgroundColor: decor.color,
                        color: 'white',
                        fontSize: '70%',
                        fontWeight: 900,
                        textAlign: 'center',
                    }}
                >
                    {decor.symbol}
                </div>
                <div style={{ flex: '0 0 1rem' }} />
                <div>{item.name}</div>
            </div>
            <div style={{ marginLeft: '1rem' }}>
                {item.children.map((item) => (
                    <ItemRow item={item} />
                ))}
            </div>
        </div>
    );
}
