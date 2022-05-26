import React from 'react';
import { Flex, useCommonStyles, useAsyncEffect, PixelatedImage } from '../../../lib/react-ex';
import assets from 'glob:$(MONOREPO_ROOT)/source;assets/proto/**/*{.png,.asset.yaml}';
import * as core from '../../../lib/core';

const assetURL = Object.fromEntries(assets.matches.map(({ url }) => [url.split('/').pop(), url]));

export default function () {
    const [sortOrder, setSortOrder] = React.useState('alphabetical');

    useCommonStyles();

    return (
        <div>
            <div
                style={{
                    width: '62rem',
                    margin: '1rem auto 6rem',
                }}
            >
                <h1>Raiment Studios</h1>
                <p>
                    🚧 Under construction: this page will house previews of all the content and
                    assets used in the Raiment Studios projects. As they are all have some form of
                    open license, the goal is to promote reuse and contribution.
                </p>
                <h3>Sprites</h3>
                <Flex style={{ margin: 4 }}>
                    <select value={sortOrder} onChange={(evt) => setSortOrder(evt.target.value)}>
                        <option>alphabetical</option>
                        <option>-alphabetical</option>
                    </select>
                </Flex>
                <div
                    style={{
                        display: 'grid',
                        gridGap: '15px',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    }}
                >
                    {Object.entries(assetURL)
                        .filter(([key]) => key.endsWith('.png'))
                        .sort(([keyA], [keyB]) => {
                            if (sortOrder === '-alphabetical') {
                                return -keyA.localeCompare(keyB);
                            } else {
                                return keyA.localeCompare(keyB);
                            }
                        })
                        .map(([key, value]) => (
                            <ImageInfo key={key} url={value} />
                        ))}
                </div>
            </div>
        </div>
    );
}

function ImageInfo({ url }) {
    const [data, setData] = React.useState(null);
    const [active, setActive] = React.useState(false);

    useAsyncEffect(async (token) => {
        const resp = await fetch(`${url}.asset.yaml`);
        const text = await resp.text();
        token.check();
        setData(core.parseYAML(text));
    }, []);

    return (
        <Flex
            dir="col"
            style={{
                border: 'solid 1px #CCC',
                padding: 4,
                borderRadius: 8,
                gridColumnStart: active ? 1 : 'inherit',
                gridColumnEnd: active ? 5 : 'inherit',
                boxShadow: '2px 2px 2px 2px rgba(0,0,0,0.05)',
            }}
            onClick={() => {
                setActive(!active);
            }}
        >
            <PixelatedImage src={url} scale={4} />
            <div style={{ marginTop: '0.25rem', fontSize: '90%' }}>{url.split('/').pop()}</div>
            <div style={{ fontSize: '90%' }}>{url.split('/')[1]}</div>
            {active && (
                <div style={{ width: '100%', boxSizing: 'border-box', padding: '0.5rem 1rem' }}>
                    <h3>Source</h3>
                    <div>
                        <a
                            href={`https://github.com/raiment-studios/monorepo/tree/main/source/${url}`}
                            target="_blank"
                        >
                            {`https://github.com/raiment-studios/monorepo/tree/main/source/${url}`}
                        </a>
                    </div>
                    <h3>License</h3>
                    <pre>{textToReact(data?.license)}</pre>
                </div>
            )}
        </Flex>
    );
}

function textToReact(s) {
    if (!s) {
        return null;
    }

    const expression =
        /(https?:\/\/)[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)?/i;

    const re = new RegExp(expression);

    const parts = [];
    let t = s;
    while (t.length > 0) {
        const m = re.exec(t);
        if (!m || !(m.index >= 0)) {
            break;
        }
        const pre = t.substring(0, m.index);
        const match = m[0];
        const post = t.substring(m.index + match.length);

        const url = match.match(/^[a-z]+:\/\//) ? match : `https://${match}`;

        parts.push(
            <span>{pre}</span>, //
            <a href={url} target="_blank">
                {match}
            </a>
        );
        t = post;
    }
    if (t.length > 0) {
        parts.push(<span>{t}</span>);
    }

    return <>{parts}</>;
}
