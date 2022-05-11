import fs from 'fs/promises';
import path from 'path';

/**
 * Helper to load the bootstrap, scaffolding content into memory once for
 * future use.
 */
export async function loadAssets(ctx) {
    const prefix = ctx.config.bundle ? `production/` : '';

    const thisFile = path.relative(process.cwd(), import.meta.url.replace(/^file:\/\//, ''));
    ctx.assets['index.html'] = await fs.readFile(
        path.join(path.dirname(thisFile), `../assets/${prefix}index.html`)
    );

    ctx.assets['__bootstrap.js'] = await fs.readFile(
        path.join(path.dirname(thisFile), `../assets/${prefix}__bootstrap.js`)
    );
}
