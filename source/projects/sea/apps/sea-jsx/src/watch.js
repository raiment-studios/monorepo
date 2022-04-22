import fs from 'fs/promises';
import { build } from './build/build.js';

export async function watchLoop(app) {
    let lastModified = 0;
    while (true) {
        let { mtime } = await fs.stat(app.config.filename);
        if (mtime > lastModified) {
            lastModified = mtime;
            await build(app);
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
    }
}
