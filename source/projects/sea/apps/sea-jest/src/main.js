import fs from 'fs/promises';
import path from 'path';
import sh from 'shelljs';
import { spawn } from 'child_process';
import { loadAssets } from './load_assets.js';

/**
 * Main program entry-point.
 */
async function main(...args) {
    console.log('sea-jest test runner');

    const ctx = {};
    await loadAssets(ctx);

    const jest = await jestPath();
    const esbuildJest = await esbuildJestPath();

    const teardown = [];
    const files = ['jest.config.json', 'jest.snapshot-resolver.cjs'];
    for (let filename of files) {
        if (sh.test('-e', filename)) {
            continue;
        }
        const text = ctx.assets[filename]
            .toString()
            .replace(/\$\{\{ESBUILD_JEST_PATH\}\}/g, esbuildJest);
        await fs.writeFile(filename, text);
        teardown.push(async () => {
            await fs.unlink(filename);
        });
    }

    const code = await exec('node', [jest, ...args], {});

    for (let func of teardown) {
        await func();
    }

    process.exit(code);
}
main(...process.argv.slice(2));

function exec(cmd, args = [], options = {}) {
    return new Promise((resolve, reject) => {
        // Ignore stdin so CTRL-C goes to the parent process, not the children
        options = Object.assign({ stdio: ['ignore', 'inherit', 'inherit'] }, options);
        const handle = spawn(cmd, args, options);

        handle.on('exit', (errorCode) => {
            resolve(errorCode);
        });
    });
}

async function jestPath(ctx) {
    const thisFile = path.relative(process.cwd(), import.meta.url.replace(/^file:\/\//, ''));
    let pkgPath = path.join(path.dirname(thisFile), '../node_modules/jest');
    if (!sh.test('-e', pkgPath)) {
        pkgPath = path.join(path.dirname(thisFile), '../../../jest');
    }

    const pkg = JSON.parse(await fs.readFile(path.join(pkgPath, 'package.json'), 'utf8'));

    const fullpath = path.join(pkgPath, pkg.bin);
    return fullpath;
}

async function esbuildJestPath(ctx) {
    const thisFile = path.relative(process.cwd(), import.meta.url.replace(/^file:\/\//, ''));

    const attempts = [];
    let pkgPath = path.join(path.dirname(thisFile), '../node_modules/esbuild-jest');
    attempts.push(pkgPath);
    if (!sh.test('-e', pkgPath)) {
        pkgPath = path.join(path.dirname(thisFile), '../../../esbuild-jest');
        attempts.push(pkgPath);
    }
    if (!sh.test('-e', pkgPath)) {
        console.error('Could not locate path to esbuild-jest');
        console.error('Attempts', attempts);
        process.exit(1);
    }

    return pkgPath;
}
