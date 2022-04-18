import fs from 'fs/promises';
import path from 'path';
import esbuild from 'esbuild';
import sh from 'shelljs';
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
                // Only use this custom resolution if the import comes from the user files
                if (!args.importer.match(/^\./)) {
                    return;
                }

                // TODO: use the "dynamic-load:" prefix until the feature is ready
                let parts = args.path.split('/');
                const packageName = parts[0].startsWith('@') ? `${parts[0]}/${parts[1]}` : parts[0];

                ctx.printV1(`Resolving {{obj ${packageName}}}`);

                const dir = ctx.tempDirectory;
                let result = await build.resolve(packageName, { resolveDir: dir });
                if (result.errors.length > 0) {
                    if (!sh.test('-e', `${dir}/node_modules/${packageName}`)) {
                        ctx.print(`Installing latest version of {{obj ${packageName}}}...`);
                        sh.config.silent = true;
                        sh.pushd(dir);
                        sh.exec(`npm i ${packageName}`);
                        sh.popd();
                        sh.config.silent = false;
                        ctx.print(`Done installing {{obj ${packageName}}}.`);
                    }
                    result = await build.resolve(packageName, { resolveDir: dir });
                }

                if (result.errors.length > 0) {
                    return { errors: result.errors };
                }
                return { path: result.path, namespace: result.namespace, external: false };
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
