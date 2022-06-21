import fs from 'fs/promises';
import { build } from './build.js';

export async function watchLoop(app, { filename, watchList, references, onBuild }) {
    const state = { watchList, references, cache: {} };

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

    while (true) {
        let dirty = false;

        for (let [filename, modified] of Object.entries(state.cache)) {
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
