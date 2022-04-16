import fs from 'fs/promises';
import path from 'path';
import esbuild from 'esbuild';
import express from 'express';
import chalk from 'chalk';
import meow from 'meow';

async function main() {
    const pkg = await loadPackageJSON();

    const cli = meow(
        `
Usage
    $ sea-jsx <filename>
`.trim(),
        {
            importMeta: import.meta,
            flags: {},
        }
    );

    if (cli.input.length !== 1) {
        cli.showHelp();
    }

    con(
        '', //
        `{{brand 〜 sea-jsx ${pkg.version} 〜}}`
    );

    const app = {
        config: {
            filename: cli.input[0],
            port: 8080,
        },
        cacheID: generateRandomID(),
        assets: {},
        content: null,
    };

    try {
        await fs.stat(app.config.filename);
    } catch (e) {
        con(`{{err Error:}} could not open file {{obj ${app.config.filename}}}`);
        process.exit(1);
    }

    con(
        `Running {{obj ${app.config.filename}}} on port {{loc ${app.config.port}}}`,
        `Press {{loc CTRL-C}} to exit`
    );

    await loadAssets(app);
    await build(app);
    await startServer(app);
    await watchLoop(app);
}
main();

async function loadPackageJSON() {
    const filename = path.join(
        path.dirname(path.relative(process.cwd(), import.meta.url.replace(/^file:\/\//, ''))),
        '../package.json'
    );
    const text = await fs.readFile('package.json', 'utf8');
    return JSON.parse(text);
}

async function watchLoop(app) {
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

async function startServer(app) {
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
    server.listen(app.config.port);
}

function generateRandomID() {
    return Math.floor(Math.random() * 1e9).toString(16);
}

async function loadAssets(app) {
    const thisFile = path.relative(process.cwd(), import.meta.url.replace(/^file:\/\//, ''));
    app.assets['index.html'] = await fs.readFile(
        path.join(path.dirname(thisFile), 'assets/index.html')
    );
    app.assets['__bootstrap.js'] = await fs.readFile(
        path.join(path.dirname(thisFile), 'assets/__bootstrap.js')
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

// Simple colorized text.  Not a very robust implementation.
//
// Limitations:
// - Doesn't support escaping the {{ }} template blocks
// - No checks that embedded variables could contain template blocks
//
function con(...args) {
    for (let s of args) {
        s = s.replace(/{{(obj|loc|err|brand) (.*?)}}/g, (m, style, string) => {
            switch (style) {
                case 'brand':
                    return chalk.hex('#47a1f5').bold(string);
                case 'obj':
                    return chalk.hex('#f7de5e')(string);
                case 'loc':
                    return chalk.hex('#be99cf')(string);
                case 'err':
                    return chalk.hex('#d4220b')(string);
            }
            return string;
        });
        console.log(chalk.hex('#8a92b8')(s));
    }
}
