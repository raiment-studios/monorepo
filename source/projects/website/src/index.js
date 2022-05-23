import React from 'react';
import { Flex, useCommonStyles } from '../../../lib/react-ex';
import data from 'yaml:./data.yaml';

export default function () {
    const [opacity, setOpacity] = React.useState(0);

    useCommonStyles();

    React.useEffect(() => {
        document.title = '🚧 Raiment Studios website';

        // Hack to avoid font loading re-layout flicker
        setTimeout(() => setOpacity(1.0), 100);
    }, []);

    return (
        <div style={{ opacity }}>
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
                <h3>Press kit</h3>
                <p>🚧 TODO</p>
                <h3>Support and contact</h3>
                <p>🚧 TODO</p>
            </div>
        </div>
    );
}
