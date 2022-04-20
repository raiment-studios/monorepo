import React from 'react';

export default function () {
    const checkpoints = [
        parse('Train for half-marathon'), //
        parse('Release sea-jsx v1.0'),
    ];

    return (
        <div
            style={{
                margin: '2rem 0 0 2rem',
            }}
        >
            <div>
                <h1>Roadmap</h1>
            </div>
            <div>
                {checkpoints.map((checkpoint, index) => (
                    <div key={index}>
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'row',
                            }}
                        >
                            <div
                                style={{
                                    margin: 2,
                                    marginLeft: index * 40,
                                    padding: 4,
                                    border: 'solid 1px #CCC',
                                    borderRadius: 4,
                                }}
                            >
                                {checkpoint.title}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function parse(s) {
    const json = {};
    json.title = s;

    return new Checkpoint(json);
}

class Checkpoint {
    constructor(json) {
        this._data = Object.assign(
            {
                title: null,
                start: null,
                end: null,
                taskTree: null,
            },
            json
        );
    }

    get title() {
        return this._data.title;
    }
}
