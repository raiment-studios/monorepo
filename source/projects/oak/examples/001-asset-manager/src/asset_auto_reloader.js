import React from 'react';
import * as core from '../../../../../lib/core';
import * as ReactEx from '../../../../../lib/react-ex';
import * as fs from './__runtime/fs';

export function AssetAutoReloader({ onReady }) {
    const [assets, setAssets] = React.useState(null);

    ReactEx.useAsyncEffect(async (token) => {
        const results = await fs.glob('assets/**', { nodir: true });
        token.check();

        const assets = {};

        //
        // Pass 1: group all files by asset
        //
        for (let file of results) {
            const actual = {};
            const parts = file.split('/');
            parts.shift(); // "assets"

            const filename = parts.pop();
            actual.pack = parts.shift();
            actual.type = parts.join('/');
            const fileparts = filename.split('.');
            actual.id = fileparts.shift();
            const fullext = fileparts.join('.');

            assets[actual.id] ??= {
                id: actual.id,
                uuid: null,
                pack: actual.pack,
                type: actual.type,
                schema: null,
                version: null,
                tags: [],
                license: null,
                author: null,
                status: null,
                labels: {},
                content: null,
                files: {},
                attributes: {},
            };
            const asset = assets[actual.id];
            asset.files[fullext] = {
                extension: fullext,
                path: file,
                modified_ms: null,
            };
        }

        //
        // Pass 2: load meta files
        //
        try {
            for (let [id, asset] of Object.entries(assets)) {
                token.check();

                const filename = `assets/${asset.pack}/${asset.type}/${asset.id}.yaml`;
                if (asset.files['yaml'] === undefined) {
                    asset.uuid = core.uuid();
                    const meta = {};
                    const metaKeys = Object.keys({
                        id: null,
                        uuid: null,
                        pack: null,
                        type: null,
                        schema: null,
                        version: null,
                        tags: [],
                        license: null,
                        author: null,
                        status: null,
                        labels: {},
                    });
                    for (const key of metaKeys) {
                        meta[key] = asset[key];
                    }
                    await fs.writeFile(filename, core.stringifyYAML(meta));
                } else {
                    const resp = await fetch(filename);
                    const text = await resp.text();
                    const meta = core.parseYAML(text);
                    delete meta.id;
                    delete meta.pack;
                    delete meta.type;
                    Object.assign(asset, meta);
                }
            }
        } catch (err) {
            console.error(err);
        }

        token.check();
        setAssets(Object.values(assets));
    });

    ReactEx.useAsyncEffect(
        async (token) => {
            if (!assets) {
                return;
            }

            const wait = (ms = 500) => Math.ceil(ms / 2 + (ms / 2) * Math.random());
            const sleep = (ms) => {
                const actual = wait(ms);
                return new Promise((resolve) => setTimeout(resolve, actual));
            };

            let ctx = { timer: null, stat: {} };

            token.unwind(() => clearTimeout(ctx.timer));

            const poll = async () => {
                for (let index = 0; index < assets.length; index++) {
                    const asset = assets[index];
                    for (let { path } of Object.values(asset.files)) {
                        await sleep(wait(20));

                        const stat = await fs.stat(path);

                        const prev = ctx.stat[path];
                        ctx.stat[path] = stat.mtimeMs;
                        if (prev && prev < stat.mtimeMs) {
                            console.log('Reloading', asset.id);
                            const resp = await fetch(asset.files.yaml.path);
                            const text = await resp.text();
                            const meta = core.parseYAML(text);
                            delete meta.id;
                            delete meta.pack;
                            delete meta.type;

                            const nassets = [...assets];
                            nassets[index] = { ...asset, ...meta };
                            setAssets(nassets);
                        }
                    }
                }
                ctx.timer = setTimeout(poll, wait(500));
            };
            ctx.timer = setTimeout(poll, wait());
        },
        [assets]
    );

    if (!assets) {
        return 'Loading...';
    }
    return onReady(assets);
}
