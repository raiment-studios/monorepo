import fs from 'fs/promises';
import path from 'path';
import sh from 'shelljs';
import esbuild from 'esbuild';

async function main() {
    const filename = process.argv[2];

    const s = await fs.stat(filename);

    const thisfile = path.relative(process.cwd(), import.meta.url.replace(/^file:\/\//, ''));
    // TODO: copy to a temp directory not the host directory
    const htmlBuffer = await fs.readFile(path.join(path.dirname(thisfile), 'assets/index.html'));
    await fs.writeFile(path.join(path.dirname(filename), 'index.html'), htmlBuffer);

    // Copy _bootstrap.js
    // esbuild source file -> client.js

    const options = {
        entryPoints: [filename],
        bundle: true,
        format: 'cjs',
        loader: {
            '.js': 'jsx',
        },
        write: false,
        //external: [...external, 'react'],
    };

    const result = await esbuild.build(options);
    //        outfile: path.join(path.dirname(filename), 'client.js'),

    console.log('jsexperiments', result);
}
main();
