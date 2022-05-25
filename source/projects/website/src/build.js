import path from 'path';
import fs from 'fs/promises';
import glob from 'glob';
import sh from 'shelljs';
import _ from 'lodash';
import * as core from '@raiment/core';
import { spawn } from 'child_process';

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
        await exec('sea-jsx', [
            'build',
            `${base}/${folder}/index.js`,
            `--target=dist/engine/examples/${folder}.html`,
        ]);
    }

    sh.mkdir('-p', 'dist/core');
    await exec('sea-jsx', [
        'build',
        repo('source/lib/core/docs/index.js'),
        '--target=dist/core/docs.html',
    ]);
}
main();

function repo(...args) {
    return path.join(process.env.MONOREPO_ROOT, ...args);
}

function exec(cmd, args = [], options = {}) {
    return new Promise((resolve, reject) => {
        // Ignore stdin so CTRL-C goes to the parent process, not the children
        options = Object.assign({ stdio: ['ignore', 'inherit', 'inherit'] }, options);
        const handle = spawn(cmd, args, options);

        handle.on('exit', (errorCode) => {
            if (errorCode) {
                reject(errorCode);
            } else resolve();
        });
    });
}
