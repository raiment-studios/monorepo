import fs from 'fs/promises';
import sh from 'shelljs';
import { parseYAML } from '@raiment/core';

async function main() {
    console.log('> Transforming assets...');
    sh.mkdir('-p', 'dist/assets');

    const content = await fs.readFile('./src/assets/values.yaml', 'utf8');
    fs.writeFile('./dist/assets/values.json', JSON.stringify(parseYAML(content), null, 4));
}
main();
