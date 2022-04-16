import fs from 'fs/promises';
import path from 'path';
import esbuild from 'esbuild';
import express from 'express';

function generateRandomID() {
    return Math.floor(Math.random() * 1e9).toString(16);
}

async function main() {
    const app = {
        config: {
            filename: process.argv[2],
        },
        cacheID: generateRandomID(),
        assets: {},
        content: null,
    };

    await loadAssets(app);
    await build(app);

    const server = express();
    server.get('/cache-id', (req, res) => {
        res.send(app.cacheID);
    });
    server.get('/client.js', (req, res) => {
        res.set('etag', false);
        res.set('Cache-Control', 'no-store');
        res.contentType('text/javascript');
        res.send(app.content);
    });
    server.get('*', (req, res) => {
        res.contentType('text/html');
        res.send(app.assets['index.html']);
    });
    server.listen(8080);

    let lastModified = 0;
    while (true) {
        let { mtime } = await fs.stat(app.config.filename);
        if (mtime > lastModified) {
            lastModified = mtime;
            await build(app);
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
    }
}
main();

async function loadAssets(app) {
    const thisfile = path.relative(process.cwd(), import.meta.url.replace(/^file:\/\//, ''));
    app.assets['index.html'] = await fs.readFile(
        path.join(path.dirname(thisfile), 'assets/index.html')
    );
    app.assets['__bootstrap.js'] = await fs.readFile(
        path.join(path.dirname(thisfile), 'assets/__bootstrap.js')
    );
}

async function build(app) {
    const builtinFiles = {
        './__app.js': await fs.readFile(app.config.filename),
        './__bootstrap.js': app.assets['__bootstrap.js'],
    };

    const plugin = {
        name: 'sea-js',
        setup: function (build) {
            build.onResolve({ filter: /^\./ }, async (args) => {
                const builtin = builtinFiles[args.path];
                if (builtin) {
                    return {
                        path: args.path,
                        namespace: 'builtin',
                    };
                }
            });
            build.onResolve({ filter: /^[^\.]/ }, async (args) => {
                //console.log(args);
                //return { external: true };
            });
            build.onLoad({ filter: /.*/, namespace: 'builtin' }, async (args) => {
                const builtin = builtinFiles[args.path];
                if (builtin) {
                    return {
                        contents: builtin,
                        loader: 'jsx',
                        resolveDir: process.cwd(),
                    };
                }
            });
        },
    };

    const options = {
        entryPoints: ['./__bootstrap.js'],
        bundle: true,
        format: 'cjs',
        loader: {
            '.js': 'jsx',
        },
        write: false,
        //external: [...external, 'react'],
        plugins: [plugin],
    };

    const result = await esbuild.build(options);
    const text = result.outputFiles[0].text;

    app.cacheID = generateRandomID();
    app.content = text;
}
