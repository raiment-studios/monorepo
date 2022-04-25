import fs from 'fs/promises';
import { build } from '../build/build.js';

export async function watchLoop(app) {
    while (true) {
        let dirty = false;
        for (let [filename, modified] of Object.entries(app.watches)) {
            let { mtime } = await fs.stat(filename);
            if (mtime > modified) {
                app.print(`Refreshing ({{obj ${filename}}} modified).`);
                app.watches[filename] = mtime;
                dirty = true;
            }

            // Slight delay to avoid hogging the filesystem
            await sleep(10);
        }
        if (dirty) {
            await build(app);
        }
        await sleep(250 + Math.floor(Math.random() * 500));
    }
}

async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
