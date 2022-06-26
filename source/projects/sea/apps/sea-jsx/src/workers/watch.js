import fs from 'fs/promises';
import { build } from './build.js';

export async function watchLoop(app, { filename, watchList, references, onBuild }) {
    const state = { watchList, references, cache: {}, recent: {} };

    const printV1Cache = () => {
        for (let [filename] of Object.entries(state.watchList)) {
            app.printV1(`Watching {{obj ${filename}}}`);
        }
    };

    const rebuildCache = async () => {
        state.cache = {};
        for (let [filename, modified] of Object.entries(state.watchList)) {
            state.cache[filename] = modified;
        }
        for (let { filepath } of Object.values(state.references)) {
            const modified = (await fs.stat(filepath)).mtime;
            state.cache[filepath] = modified;
        }
    };

    printV1Cache();
    await rebuildCache();

    const priorityTable = {
        js: 10,
        ts: 10,
        jsx: 10,
        tsx: 10,
        yaml: 20,
        yml: 20,
        json: 30,
    };

    while (true) {
        let dirty = false;

        const pairs = Object.entries(state.cache).sort(([fa], [fb]) => {
            const ap = state.recent[fa] ? 0 : priorityTable[fa.split('.').pop()] ?? 100;
            const bp = state.recent[fb] ? 0 : priorityTable[fb.split('.').pop()] ?? 100;
            return ap - bp;
        });

        for (let [filename, modified] of pairs) {
            let mtime;
            try {
                mtime = (await fs.stat(filename)).mtime;
            } catch (err) {
                if (err.code === 'ENOENT') {
                    console.warn('Warning: file not found', err.path);
                    continue;
                } else {
                    throw err;
                }
            }
            if (mtime > modified) {
                app.print(`Refreshing ({{obj ${filename}}} modified).`);
                state.cache[filename] = mtime;
                state.recent[filename] = true;

                printV1Cache();
                dirty = true;
                break;
            }

            // Slight delay to avoid hogging the filesystem
            await sleep(10);
        }

        if (dirty) {
            const ret = await build(app, { filename, sourcemap: true });
            state.watchList = ret.watches;
            state.references = ret.references;
            await rebuildCache();
            if (onBuild) {
                onBuild(ret);
            }
            app.cacheID = app.generateRandomID();
        }
        await sleep(250 + Math.floor(Math.random() * 500));
    }
}

async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
