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

    const buffer2 = await fs.readFile(path.join(path.dirname(thisfile), 'assets/__bootstrap.js'));
    await fs.writeFile(path.join(path.dirname(filename), '__bootstrap.js'), buffer2);

    const buffer3 = await fs.readFile(filename);
    await fs.writeFile(path.join(path.dirname(filename), '__app.js'), buffer3);

    // Copy _bootstrap.js
    // esbuild source file -> client.js

    const options = {
        entryPoints: [path.join(path.dirname(filename), '__bootstrap.js')],
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

    const text = result.outputFiles[0].text;
    await fs.writeFile(path.join(path.dirname(filename), 'client.js'), text);

    console.log('jsexperiments', result);
}
main();
