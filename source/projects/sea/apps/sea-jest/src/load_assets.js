import fs from 'fs/promises';
import path from 'path';
import glob from 'glob';

/**
 * Helper to load the bootstrap, scaffolding content into memory once for
 * future use.
 */
export async function loadAssets(ctx) {
    const thisFile = path.relative(process.cwd(), import.meta.url.replace(/^file:\/\//, ''));
    const assetsDir = path.join(path.dirname(thisFile), 'assets');

    const assets = {};
    const promises = [];
    const files = glob.sync(`${assetsDir}/**`, { nodir: true });
    for (let filename of files) {
        const assetName = path.relative(assetsDir, filename);
        promises.push(
            fs.readFile(filename).then((buffer) => {
                assets[assetName] = buffer;
            })
        );
    }

    await Promise.all(promises);
    ctx.assets = assets;
}
