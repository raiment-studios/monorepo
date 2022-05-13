import fs from 'fs/promises';
import sh from 'shelljs';
import { parseYAML } from '@raiment/core';

async function main() {
    console.log('> Transforming assets...');
    sh.mkdir('-pf', 'dist/assets');

    sh.cp('-R', 'assets/', 'dist/');
    await transformYAML('cards/base');
}
main();

async function transformYAML(name) {
    try {
        const src = `./assets/${name}.yaml`;
        const dst = `./dist/assets/${name}.json`;
        const input = await fs.readFile(src, 'utf8');
        const output = JSON.stringify(parseYAML(input), null, 4);
        await fs.writeFile(dst, output);
    } catch (err) {
        console.log('Ignoring error', err);
    }
}
