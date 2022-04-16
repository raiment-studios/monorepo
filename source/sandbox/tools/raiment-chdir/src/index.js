import path from 'path';
import fs from 'fs/promises';
import * as core from '@raiment/core';

async function main(word) {
    const root = process.env.MONOREPO_ROOT;

    const skipList = {
        node_modules: true,
        dist: true,
    };

    const table = {};
    async function walkDirectory(dir, depth) {
        let results = await fs.readdir(dir, { withFileTypes: true });

        for (let entry of results) {
            if (!entry.isDirectory()) {
                continue;
            }
            if (entry.name.startsWith('.') || skipList[entry.name]) {
                continue;
            }
            const fullpath = path.join(dir, '/', entry.name);

            table[entry.name] = table[entry.name] || [];
            table[entry.name].push({
                path: path.relative(root, fullpath),
                depth,
            });

            await walkDirectory(fullpath, depth + 1);
        }
    }

    await walkDirectory(root, 0);

    const keys = Object.keys(table);

    let results = core.nearestOverlap(keys, word).filter((entry) => entry.score <= 3);
    if (results.length === 0) {
        console.error('No matches.');
        process.exit(1);
    }

    const bestScore = results[0].score;
    if (bestScore > 0) {
        showSuggestions(table, results);
        process.exit(1);
    }

    const entry = table[results[0].candidate];
    entry.sort((a, b) => {
        return a.depth - b.depth;
    });

    console.log(path.join(root, '/', entry[0].path));
    process.exit(0);
}
main(...process.argv.slice(2));

function showSuggestions(table, results) {
    console.error('No exact matches. Did you mean?');

    let count = 0;
    for (let entry of results) {
        if (entry.score >= 3) {
            continue;
        }
        const name = entry.candidate;
        const directories = table[name];
        directories.sort((a, b) => a.depth - b.depth);
        let dir = directories[0];
        console.error(`  ${name.padEnd(20, ' ')}    ${dir.path}`);
        count++;
        if (count > 6) {
            return;
        }
    }
}
