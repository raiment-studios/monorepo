import React from 'react';
import { Flex, useCommonStyles } from '../../../lib/react-ex';

export default function () {
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
            </div>
        </div>
    );
}
