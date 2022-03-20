import fs from 'fs/promises';
import sh from 'shelljs';
import { parseYAML } from '@raiment/core';

async function main() {
    console.log('> Transforming assets...');
    sh.mkdir('-p', 'dist/assets');

    await Promise.all(
        [
            'tome',
            'values', //
            'problems',
        ].map((name) => transformYAML(name))
    );
}
main();

async function transformYAML(name) {
    const src = `./src/assets/${name}.yaml`;
    const dst = `./dist/assets/${name}.json`;
    const input = await fs.readFile(src, 'utf8');
    const output = JSON.stringify(parseYAML(input), null, 4);
    return fs.writeFile(dst, output);
}
