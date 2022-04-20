import fs from 'fs/promises';
import path from 'path';
import esbuild from 'esbuild';
import sh from 'shelljs';
import yaml from 'yaml';
import { generateRandomID } from './util.js';

let previousFrontmatter;

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

    //
    // Read configuration
    //
    const userFrontmatter = parseFrontMatter(builtinFiles['./__app.js'].toString());
    const frontmatter = Object.assign(
        {
            type: 'sea-jsx@v1',
            imports: {},
        },
        userFrontmatter
    );

    if (ctx.config.verbosity > 0) {
        const text = yaml.stringify(frontmatter);

        // Only print this the first time and on changes to the front matter
        if (previousFrontmatter !== text) {
            ctx.print('Frontmatter configuration:');
            const lines = text.split('\n');
            for (let line of lines) {
                ctx.print(`  {{loc ${line}}}`);
            }
        }
        previousFrontmatter = text;
    }

    //
    // Use a custom plug-in to handle implicit packages
    //
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
                        const start = Date.now();

                        // Check if a specific version is being requested or if the latest
                        // should be used.  The version is passed along directly to npm so
                        // follows that format.
                        let packageIdentifier;
                        const version = frontmatter.imports[packageName];
                        if (version) {
                            ctx.printV1(`Using {{loc ${version}}}`);
                            packageIdentifier = `${packageName}@${version}`;
                        } else {
                            ctx.printV1('Using latest version');
                            packageIdentifier = packageName;
                        }

                        ctx.printV1(`Installing {{obj ${packageIdentifier}}}...`);
                        sh.config.silent = true;
                        sh.pushd(dir);
                        sh.exec(`npm i ${packageIdentifier}`);
                        sh.popd();
                        sh.config.silent = false;

                        // Read the version of what was just installed
                        // TODO: what if package.json doesn't exist?
                        const pkgJSON = JSON.parse(
                            await fs.readFile(
                                path.join(dir, 'node_modules', packageName, 'package.json'),
                                'utf8'
                            )
                        );

                        const duration = Date.now() - start;
                        ctx.print(
                            `Installed {{obj ${packageName}}} {{loc v${pkgJSON.version}}} ({{loc ${duration}ms}}).`
                        );
                    }

                    // It's been installed, now ask esbuild to find it in the new directory.
                    // This shouldn't fail, so print out a fairly verbose error for debugging.
                    //
                    result = await build.resolve(packageName, { resolveDir: dir });
                    if (result.errors.length > 0) {
                        console.error(`Could not resolve installed package ${packageName}`);
                        console.error('esbuild error:');
                        console.error(result.errors);
                        console.error('context:');
                        console.error({
                            packageName,
                            resolveDir: dir,
                        });
                        console.error(sh.ls(`${dir}/node_modules/${packageName}`).stdout);
                        process.exit(1);
                    }
                }

                if (result.errors.length > 0) {
                    return { errors: result.errors };
                }

                ctx.printV1(`Path {{obj ${result.path}}}`);
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

    // Catch any compilation errors.  Do not have the exception take down the host
    // process, but rather notify the user there's a error in their source code.
    try {
        const result = await esbuild.build(options);
        const text = result.outputFiles[0].text;

        ctx.cacheID = generateRandomID();
        ctx.content = text;
    } catch (e) {
        //
        // TODO: improve the error messaging. This seems a bit hacky
        //
        console.error(e);

        builtinFiles['./__app.js'] = [
            `import React from 'react';`,
            `export default function() {`,
            `   const msg = ${JSON.stringify(e.message)};`,
            `   return (<div>`,
            `       <h1>Build error in user source file</h1>`,
            `       <pre>{msg}</pre>`,
            `   </div>);`,
            '}',
        ].join('\n');
        const result = await esbuild.build(options);
        const text = result.outputFiles[0].text;

        ctx.cacheID = generateRandomID();
        ctx.content = text;
    }
}

/**
 * Scan the entry-point file for front-matter data that will be used in
 * configuration.
 *
 * @param {*} source
 *
 * TODO: make this more efficient. It is currently written for simplicity
 * with no thought to efficiency.
 */
function parseFrontMatter(source) {
    const lines = source.split('\n');
    const start = lines.findIndex((line) => line.trim().startsWith('/*!@sea:header'));

    // There's no front-matter defined
    if (start === -1) {
        return null;
    }

    const end = lines.slice(start + 1).findIndex((line) => line.trim() === '*/');
    if (end === -1) {
        console.error('Error: found front-matter begin token without end token');
        process.exit(1);
    }

    const content = lines.slice(start + 1, start + end + 1).join('\n');
    const obj = yaml.parse(content);
    return obj;
}
