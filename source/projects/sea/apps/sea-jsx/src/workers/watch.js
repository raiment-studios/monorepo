import fs from 'fs/promises';
import { build } from './build.js';

export async function watchLoop(app, { filename, watchList }) {
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
            let { mtime } = await fs.stat(filename);
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
            const { watches } = await build(app, { filename });
            state.watchList = watches;
            app.cacheID = app.generateRandomID();
        }
        await sleep(250 + Math.floor(Math.random() * 500));
    }
}

async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
