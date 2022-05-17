import fs from 'fs/promises';
import { build } from './build.js';

export async function watchLoop(app, { watches }) {
    const ctx = { watches };

    const printV1Watches = () => {
        for (let [filename] of Object.entries(ctx.watches)) {
            app.printV1(`Watching {{obj ${filename}}}`);
        }
    };

    printV1Watches();

    console.log(app.verbosity);
    while (true) {
        let dirty = false;
        for (let [filename, modified] of Object.entries(ctx.watches)) {
            let { mtime } = await fs.stat(filename);
            if (mtime > modified) {
                app.print(`Refreshing ({{obj ${filename}}} modified).`);
                app.watches[filename] = mtime;

                printV1Watches();
                dirty = true;
            }

            // Slight delay to avoid hogging the filesystem
            await sleep(10);
        }
        if (dirty) {
            const { watches } = await build(app);
            ctx.watches = watches;
        }
        await sleep(250 + Math.floor(Math.random() * 500));
    }
}

async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
