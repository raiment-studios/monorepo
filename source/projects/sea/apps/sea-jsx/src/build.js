import fs from 'fs/promises';
import esbuild from 'esbuild';
import { generateRandomID } from './util.js';

/**
 * Compiles the user-specified input file along with necessary bootstraping.
 *
 * @param {*} ctx
 */
export async function build(ctx) {
    const builtinFiles = {
        './__app.js': await fs.readFile(ctx.config.filename),
        './__bootstrap.js': ctx.assets['__bootstrap.js'],
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

    ctx.cacheID = generateRandomID();
    ctx.content = text;
}
