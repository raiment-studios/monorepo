/*!sea:header
    modules:
        simplex-noise: 3
*/

import React from 'react';
import * as core from '../../../../lib/core';
import * as ReactEx from '../../../../lib/react-ex';
import { Flex, Type, Panel } from '../../../../lib/react-ex';
import chroma from 'chroma-js';
import * as fs from './__runtime/fs';

async function fetchAsset(file) {
    const resp = await fetch(file);
    const text = await resp.text();
    const obj = core.parseYAML(text);

    // Normalize some essentials...
    obj.uuid ??= core.uuid();

    // Let the file location win over the meta data
    const actual = {};
    const parts = file.split('/');
    parts.shift(); // "assets"
    const filename = parts.pop();
    actual.pack = parts.shift();
    actual.type = parts.join('/');
    actual.id = filename.split('.').shift();

    for (const [key, value] of Object.entries(actual)) {
        if (obj[key] !== value) {
            console.warn(
                `Stored Asset key '${key}' does not reflect expected value. Using expected value.`,
                {
                    asset_value: obj[key],
                    expected_value: value,
                }
            );
            obj[key] = value;
        }
    }

    return obj;
}

export default function () {
    const [files, setFiles] = React.useState([]);

    ReactEx.useAsyncEffect(async (token) => {
        const results = await fs.glob('assets/**', { nodir: true });
        token.check();
        setFiles(results);
    });

    const [assets, setAssets] = React.useState([]);
    ReactEx.useAsyncEffect(async (token) => {
        const results = await fs.glob('assets/**', { nodir: true });

        const assets = await Promise.all(results.map(async (file) => fetchAsset(file)));
        token.check();
        setAssets(assets);
    }, []);

    return (
        <ReactEx.ReadingFrame>
            <h1>Hello World!</h1>

            <Type h2>Design / Palettes</Type>
            {files
                .filter((filename) => filename.match(/design\/palette\//))
                .map((filename) => (
                    <AssetWatcher
                        key={filename}
                        filename={filename}
                        onReady={(asset) => <Palette palette={asset} />}
                    />
                ))}
        </ReactEx.ReadingFrame>
    );
}

function AssetWatcher({ filename, onReady }) {
    const [asset, setAsset] = React.useState(null);
    const [incarnation, setIncarnation] = React.useState(0);

    ReactEx.useAsyncEffect(
        async (token) => {
            await new Promise((resolve) => setTimeout(resolve, Math.random() * 4000));
            const asset = await fetchAsset(filename);

            token.check();
            setAsset(asset);

            let ctx = { timer: null, stat: null };

            token.unwind(() => clearTimeout(ctx.timer));

            const wait = () => Math.floor(500 + 500 * Math.random());
            const poll = async () => {
                const stat = await fs.stat(filename);

                if (ctx.stat === null) {
                    ctx.stat = stat;
                } else if (ctx.stat.mtimeMs < stat.mtimeMs) {
                    console.log('Reloading...', filename);
                    setIncarnation(incarnation + 1);
                }
                ctx.timer = setTimeout(poll, wait());
            };
            ctx.timer = setTimeout(poll, wait());
        },
        [incarnation]
    );

    if (!asset) {
        return <div>Loading {filename}...</div>;
    }
    return onReady(asset);
}

function Palette({ palette }) {
    const { colors } = palette.content;
    return (
        <Panel>
            <Flex dir="col">
                <Type h3 mb={16}>
                    {palette.content.title}
                </Type>
                <Flex dir="row">
                    {Object.entries(colors).map(([name, color]) => (
                        <Flex key={name} dir="col">
                            <Flex dir="row" w="10rem" mb={12}>
                                <Box size={16} color={color.value} />
                                <div style={{ width: 8 }} />
                                <Type bold>{name}</Type>
                            </Flex>
                            {[100, 200, 300, 400, 500, 600, 700, 800, 900].map((n) => {
                                const mcolor = chroma(color.value)
                                    .set('hsl.l', (1000 - n) / 1000)
                                    .hex();
                                return (
                                    <Flex key={n} dir="row" my={2}>
                                        <Box color={mcolor} />
                                        <div style={{ width: 8 }} />
                                        <Flex dir="col" align="start">
                                            <Type bold>{n}</Type>
                                            <Type small>{mcolor}</Type>
                                        </Flex>
                                    </Flex>
                                );
                            })}
                        </Flex>
                    ))}
                </Flex>
            </Flex>
        </Panel>
    );
}

function Box({ size = 32, color }) {
    return (
        <div
            style={{
                width: size,
                height: size,
                borderRadius: 4,
                backgroundColor: color,
            }}
        />
    );
}
