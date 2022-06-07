import fs from 'fs/promises';
import { build } from './build.js';

export async function watchLoop(app, { filename, watchList, onBuild }) {
    const state = { watchList };

    const printV1WatchList = () => {
        for (let [filename] of Object.entries(state.watchList)) {
            app.printV1(`Watching {{obj ${filename}}}`);
        }
    };

    printV1WatchList();

    while (true) {
        let dirty = false;
        for (let [filename, modified] of Object.entries(state.watchList)) {
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
                state.watchList[filename] = mtime;

                printV1WatchList();
                dirty = true;
            }

            // Slight delay to avoid hogging the filesystem
            await sleep(10);
        }
        if (dirty) {
            const ret = await build(app, { filename, sourcemap: true });
            state.watchList = ret.watches;
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
