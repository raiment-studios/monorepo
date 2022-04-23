import fs from 'fs/promises';
import path from 'path';

/**
 * Helper to load the package file for version info, etc.
 */
export async function loadPackageJSON() {
    const filename = path.resolve(
        path.join(
            path.dirname(path.relative(process.cwd(), import.meta.url.replace(/^file:\/\//, ''))),
            '../../package.json'
        )
    );
    let text = '';
    try {
        text = await fs.readFile(filename, 'utf8');
    } catch (e) {
        console.error(`Could not load package.json at "${filename}"`);
        process.exit(1);
    }
    return JSON.parse(text);
}
