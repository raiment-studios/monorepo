import React from 'react';
import {
    Flex,
    useCommonStyles,
    useAsyncEffect,
    useLocalStorage,
    PixelatedImage,
    TextDown,
} from '../../../lib/react-ex';
import * as core from '../../../lib/core';

import assets from 'glob:$(MONOREPO_ROOT)/source;assets/**/*{.asset.yaml,.png,.vox}';
import { VOXPreview } from './vox_preview';
import * as fs from './__runtime/fs';

const assetURL = Object.fromEntries(assets.map((url) => [url.split('/').pop(), url]));
import assetsActors from 'glob:$(MONOREPO_ROOT)/source/lib/engine/src;actors/**/*.js';

export default function () {
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

            <SpritesSection />
            <VOXModelSection />
            <ActorsSection />
        </div>
    );
}

function ActorsSection() {
    const assets = assetsActors;
    return (
        <Section title="Actors" count={assets.length}>
            {assets.map((actor) => (
                <ActorItem key={actor} url={actor} />
            ))}
        </Section>
    );
}

function parseFrontmatter(text) {
    const lines = text.split('\n');
    while (lines.length && !lines[0].trim().match(/^\/\*!/)) {
        lines.shift();
    }
    if (lines.length === 0) {
        return null;
    }
    lines.shift();
    while (lines.length && lines[0].trim().length === 0) {
        lines.shift();
    }

    const content = [];
    while (lines.length && !lines[0].trim().match(/^\*\//)) {
        const line = lines.shift();
        content.push(line);
    }
    if (!lines.length === 0 && content.length === 0) {
        return null;
    }
    return core.dedent(content.join('\n')).trim();
}

function ActorItem({ url }) {
    const [text, setText] = React.useState(null);
    useAsyncEffect(async (token) => {
        const resp = await fetch(url);
        const text = await resp.text();
        token.check();
        setText(parseFrontmatter(text));
    });

    return (
        <div>
            {text ? (
                <div>
                    <h3>{url}</h3>
                    <div
                        style={{
                            margin: '8px 0',
                            padding: '4px 0 4px 1rem',
                            borderLeft: 'solid 2px #CCC',
                        }}
                    >
                        <pre>
                            <code>{text}</code>
                        </pre>
                    </div>
                    <div>
                        <span>Source code: </span>
                        <a
                            href={`https://github.com/raiment-studios/monorepo/blob/main/source/lib/engine/src/${url}`}
                            target="_blank"
                        >
                            <span>source/lib/engine/src/{url}</span>
                        </a>
                    </div>
                </div>
            ) : (
                <div>
                    <h3>{url}</h3>
                    <p>Not documented</p>
                </div>
            )}
        </div>
    );
}

function SpritesSection() {
    const [sortOrder, setSortOrder] = React.useState('alphabetical');

    const assets = Object.entries(assetURL)
        .filter(([key, url]) => url.match(/sprites/) && key.endsWith('.png'))
        .sort(([keyA], [keyB]) => {
            if (sortOrder === '-alphabetical') {
                return -keyA.localeCompare(keyB);
            } else {
                return keyA.localeCompare(keyB);
            }
        });

    return (
        <Section title="Sprites" count={assets.length}>
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
                {assets.map(([key, value]) => (
                    <ImageInfo key={key} url={value} />
                ))}
            </div>
        </Section>
    );
}

function Section({ title, count, children }) {
    const [expanded, setExpanded] = useLocalStorage(`section-${title}`, false);
    return (
        <>
            <Flex dir="row" style={{ margin: '12px 0 24px', borderBottom: 'solid 1px #333' }}>
                <div
                    style={{ padding: '0 8px', cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => setExpanded(!expanded)}
                >
                    <div style={{ width: '2rem', textAlign: 'center' }}>{expanded ? '▼' : '▶'}</div>
                </div>
                <h3 style={{ margin: 0, paddingBottom: 0 }}>
                    <span>{title}</span>
                    <span style={{ paddingLeft: '1rem' }}>({count})</span>
                </h3>
            </Flex>
            {expanded && children}
        </>
    );
}

function VOXModelSection() {
    const assets = Object.entries(assetURL).filter(([key]) => key.endsWith('.vox'));
    return (
        <Section title="VOX Models" count={assets.length}>
            <div
                style={{
                    display: 'grid',
                    gridGap: '15px',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                }}
            >
                {assets.map(([key, value]) => (
                    <VOXTile key={key} name={key} url={value} />
                ))}
            </div>
        </Section>
    );
}

function VOXTile({ name, url }) {
    const [active, setActive] = useLocalStorage(`voxtile-active-${url}`, false);
    return (
        <Flex
            dir="col"
            style={{
                border: 'solid 1px #CCC',
                padding: '4px 4px 10px 4px',
                borderRadius: 8,
                gridColumnStart: active ? 1 : 'inherit',
                gridColumnEnd: active ? 5 : 'inherit',
                boxShadow: '2px 2px 2px 2px rgba(0,0,0,0.05)',
                userSelect: 'none',
                cursor: 'pointer',
            }}
        >
            <div
                style={{ margin: '2px 0 8px' }}
                onClick={() => {
                    setActive(!active);
                }}
            >
                {name} {active ? '🔼' : '🔽'}
            </div>
            <div>
                <img
                    style={{
                        display: 'block',
                        borderRadius: 8,
                        width: '90%',
                        maxWidth: 200,
                        margin: '0 auto',
                    }}
                    src={`${url}.screenshot.png`}
                />
            </div>
            {active && <VOXTileDetails url={url} />}
        </Flex>
    );
}

function parseYAMLWithErrorMessages(text, source) {
    try {
        return core.parseYAML(text);
    } catch (err) {
        console.error(`Could not parse YAML`, { source, text: text.split('\n') });
    }
}

function VOXTileDetails({ url }) {
    const [data, setData] = React.useState(null);

    useAsyncEffect(
        async (token) => {
            const resp = await fetch(`${url}.asset.yaml`);
            const text = await resp.text();
            const data = parseYAMLWithErrorMessages(text, url);
            token.check();
            setData(data);
        },
        [url]
    );
    return (
        <div style={{ flex: '1 0 0', width: '100%', marginTop: '1rem' }}>
            {Object.entries(data || {}).map(([name, value]) => (
                <Flex key={name} align="start" style={{ marginBottom: '0.5rem' }}>
                    <div style={{ flex: '0 0 0.5rem' }} />
                    <div style={{ flex: '0 0 6rem' }}>{name}</div>
                    <div style={{ flex: '1 0 0', whiteSpace: 'pre-wrap' }}>
                        <code>{typeof value === 'string' ? <TextDown text={value} /> : value}</code>
                    </div>
                </Flex>
            ))}
            <Flex align="start" style={{ marginBottom: '0.5rem' }}>
                <div style={{ flex: '0 0 0.5rem' }} />
                <div style={{ flex: '0 0 6rem' }}>Preview</div>
                <div>
                    <VOXPreview url={url} />
                </div>
            </Flex>
        </div>
    );
}

function ImageInfo({ url }) {
    const [data, setData] = React.useState(null);
    const [active, setActive] = useLocalStorage(`image-info-active-${url}`, false);

    useAsyncEffect(async (token) => {
        const resp = await fetch(`${url}.asset.yaml`);
        const text = await resp.text();
        const data = parseYAMLWithErrorMessages(text, url);
        token.check();
        setData(data);

        const img = await loadImage(url);
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
        >
            <PixelatedImage
                src={url}
                scale={4}
                onClick={() => {
                    setActive(!active);
                }}
            />
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
                    <pre>
                        <TextDown text={data?.license} />
                    </pre>
                    <h3>Attributes</h3>
                    <pre>{data && data.attributes && core.stringifyYAML(data.attributes)}</pre>
                    <h3>Update</h3>
                    <button
                        onClick={async (evt) => {
                            evt.preventDefault();
                            if (!data) {
                                return;
                            }
                            console.log('hi?');
                            const filename = `${url}.asset.yaml`;
                            await fs.writeFile(
                                `$(MONOREPO_ROOT)/source/${filename}`,
                                core.stringifyYAML(data),
                                {
                                    substitute_env: true,
                                }
                            );
                        }}
                    >
                        Update
                    </button>
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
