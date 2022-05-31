import React from 'react';
import { Flex, useCommonStyles, useAsyncEffect, PixelatedImage } from '../../../lib/react-ex';
import assets from 'glob:$(MONOREPO_ROOT)/source;assets/**/*{.asset.yaml,.png,.vox}';
import * as core from '../../../lib/core';

const assetURL = Object.fromEntries(assets.matches.map(({ url }) => [url.split('/').pop(), url]));

export default function () {
    const [sortOrder, setSortOrder] = React.useState('alphabetical');

    useCommonStyles();

    return (
        <div
            style={{
                width: '62rem',
                margin: '1rem auto 6rem',
            }}
        >
            <h1>Raiment Studios</h1>
            <p>
                🚧 Under construction: this page will house previews of all the content and assets
                used in the Raiment Studios projects. As they are all have some form of open
                license, the goal is to promote reuse and contribution.
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
            <h3>VOX Models</h3>
            <div
                style={{
                    display: 'grid',
                    gridGap: '15px',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                }}
            >
                {Object.entries(assetURL)
                    .filter(([key]) => key.endsWith('.vox'))
                    .map(([key, value]) => (
                        <VOXTile key={key} name={key} url={value} />
                    ))}
            </div>
        </div>
    );
}

function VOXTile({ name, url }) {
    const [active, setActive] = React.useState(false);

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
                userSelect: 'none',
                cursor: 'pointer',
            }}
            onClick={() => {
                setActive(!active);
            }}
        >
            <div>{name}</div>
            {active && <VOXTileDetails url={url} />}
        </Flex>
    );
}

function VOXTileDetails({ url }) {
    const [data, setData] = React.useState(null);

    useAsyncEffect(
        async (token) => {
            const resp = await fetch(`${url}.asset.yaml`);
            const text = await resp.text();
            let data = core.parseYAML(text);
            token.check();
            setData(data);
            console.log(data);

            const resp2 = await fetch(url);
            const blob = await resp2.blob();
            data = { ...data };
            data.filesize = blob.size;

            console.log(url, blob);
            setData(data);
        },
        [url]
    );
    return (
        <div style={{ flex: '1 0 0', width: '100%', marginTop: '1rem' }}>
            {Object.entries(data || {}).map(([name, value]) => (
                <Flex align="start" style={{ marginBottom: '0.5rem' }}>
                    <div style={{ flex: '0 0 0.5rem' }} />
                    <div style={{ flex: '0 0 6rem' }}>{name}</div>
                    <div style={{ flex: '1 0 0', whiteSpace: 'pre-wrap' }}>
                        <code>{typeof value === 'string' ? textToReact(value) : value}</code>
                    </div>
                </Flex>
            ))}
            <Flex align="start" style={{ marginBottom: '0.5rem' }}>
                <div style={{ flex: '0 0 0.5rem' }} />
                <div style={{ flex: '0 0 6rem' }}>Preview</div>
                <div>
                    <div
                        style={{
                            padding: 96,
                            border: 'solid 1px #CCC',
                            borderRadius: 8,
                        }}
                    >
                        3D Preview goes here
                    </div>
                    <div>capture screenshot</div>
                </div>
            </Flex>
        </div>
    );
}

function ImageInfo({ url }) {
    const [data, setData] = React.useState(null);
    const [active, setActive] = React.useState(false);

    useAsyncEffect(async (token) => {
        const resp = await fetch(`${url}.asset.yaml`);
        const text = await resp.text();
        const data = core.parseYAML(text);
        token.check();
        setData(data);

        const img = await loadImage(url);
        console.log(img, img.width, img.height);
        data.attributes = data.attributes || {};
        const attr = data.attributes;
        if (attr.width !== img.width) {
            attr.width = img.width;
        }
        if (attr.height !== img.height) {
            attr.height = img.height;
        }
        token.check();
        setData(data);
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
                    <h3>Attributes</h3>
                    <pre>{data && data.attributes && core.stringifyYAML(data.attributes)}</pre>
                </div>
            )}
        </Flex>
    );
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        let img = new Image();
        img.onload = () => resolve(img);
        img.onerror = (err) => {
            console.error(err);
            reject(err);
        };
        img.src = src;
    });
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
