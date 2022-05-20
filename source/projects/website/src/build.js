import path from 'path';
import fs from 'fs/promises';
import glob from 'glob';
import sh from 'shelljs';
import _ from 'lodash';
import * as core from '@raiment/core';

async function main() {
    const data = {};

    const base = path.join(process.env.MONOREPO_ROOT, 'source/lib/engine/examples');
    const pattern = `${base}/**/`;
    const results = glob
        .sync(pattern)
        .map((p) => p.replace(`${base}/`, '').replace(/\/$/, ''))
        .filter((p) => !!p);

    _.set(data, 'engine.examples', results);

    await fs.writeFile('src/data.yaml', core.stringifyYAML(data));

    for (let folder of results) {
        const cmd = `sea-jsx build ${base}/${folder}/index.js --target=dist/engine/examples/${folder}.html`;
        exec(cmd);
    }

    sh.mkdir('-p', 'dist/core');
    exec(`sea-jsx build ${repo('source/lib/core/docs/index.js')} --target=dist/core/docs.html`);
}
main();

function repo(...args) {
    return path.join(process.env.MONOREPO_ROOT, ...args);
}

function exec(cmd) {
    console.log(cmd);
    sh.exec(cmd);
}
