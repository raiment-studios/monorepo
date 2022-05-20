import React from 'react';
import { Flex, useCommonStyles } from '../../../lib/react-ex';
import data from 'yaml:./data.yaml';

export default function () {
    console.log(data);
    useCommonStyles();
    return (
        <div>
            <Flex style={{ padding: '0.5rem 2rem' }}>
                <div>logo</div>
                <div style={{ width: '1rem' }} />
                <div style={{ flex: '1 0 0' }} />
                <div>contact</div>
            </Flex>
            <div
                style={{
                    width: '62rem',
                    margin: '1rem auto 6rem',
                }}
            >
                <h1>Raiment Studios</h1>
                <h3>🚧 Under construction</h3>
                <hr />
                <h3>Library docs</h3>
                <div>
                    <a href={`core/docs`}>@raiment/core</a>
                </div>
                <h3>Engine examples</h3>
                {data.engine.examples.map((folder) => (
                    <div key={folder}>
                        <a href={`engine/examples/${folder}`}>{folder}</a>
                    </div>
                ))}
            </div>
        </div>
    );
}
