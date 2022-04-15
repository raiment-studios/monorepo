import fs from 'fs/promises';
import path from 'path';

async function main() {
    const filename = process.argv[2];

    const s = await fs.stat(filename);

    const thisfile = path.relative(process.cwd(), import.meta.url.replace(/^file:\/\//, ''));
    // TODO: copy to a temp directory not the host directory
    const htmlBuffer = await fs.readFile(path.join(path.dirname(thisfile), 'assets/index.html'));
    await fs.writeFile(path.join(path.dirname(filename), 'index.html'), htmlBuffer);

    console.log('jsexperiments');
}
main();
