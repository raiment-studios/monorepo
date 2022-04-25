import fs from 'fs/promises';
import { constants } from 'fs';
import path from 'path';
import esbuild from 'esbuild';
import sh from 'shelljs';
import yaml from 'yaml';
import { generateRandomID } from '../util/util.js';
import { parseFrontMatter } from './parse_front_matter.js';

/**
 * Compiles the user-specified input file along with necessary bootstraping.
 *
 * @param {*} app
 */
export async function build(app) {
    const builtinFiles = {
        './__app.js': await fs.readFile(app.config.filename),
        './__bootstrap.js': app.assets['__bootstrap.js'],
    };

    app.runtime.buildCount++;

    //
    // Read configuration
    //
    const userFrontmatter = parseFrontMatter(builtinFiles['./__app.js'].toString());
    const frontmatter = Object.assign(
        {
            type: 'sea-jsx@v1',
            modules: {},
        },
        userFrontmatter
    );

    if (app.config.verbosity > 0) {
        const text = yaml.stringify(frontmatter);

        // Only print this the first time and on changes to the front matter
        if (app.runtime.priorFrontMatter !== text) {
            app.print('Frontmatter configuration:');
            const lines = text.split('\n');
            for (let line of lines) {
                app.print(`  {{loc ${line}}}`);
            }
        }
        app.runtime.priorFrontMatter = text;
    }

    //
    // Use a custom plug-in to handle implicit packages
    //
    // Note: this code is a little messier than would be ideal. At the time of
    // writing this comment, my mental model of how esbuild's onResolve() works exactly is
    // not very good (I should review the actual code).  This likely could be implemented
    // more simply.
    //
    const workingDir = path.dirname(app.config.filename);

    app.watches[path.relative(process.cwd(), app.config.filename)] = (
        await fs.stat(app.config.filename)
    ).mtime;

    const plugin = {
        name: 'sea-js',
        setup: function (build) {
            const resolveRelative = async (args) => {
                // If this is not a relative import, then return so the default resolution
                // process continues.
                //
                // The logic is more opaque than ideal.  We check that the source of the
                // input is a user file or, by proxy of the 'relative' namespace haveing
                // been assigned, is included via a chain of user imports.
                if (
                    args.importer.length > 0 &&
                    !args.importer.match(/^[\.]/) &&
                    args.namespace !== 'relative'
                ) {
                    return;
                }

                // Check if this is a special file...
                const builtin = builtinFiles[args.path];
                if (builtin) {
                    return {
                        path: args.path,
                        namespace: 'builtin',
                    };
                }

                // Otherwise resolve the user file...
                try {
                    async function canRead(s) {
                        try {
                            await fs.access(relpath, constants.R_OK);
                            return true;
                        } catch (e) {
                            return false;
                        }
                    }

                    // Since this resolver will resolver to absolute paths, check where the
                    // path to resolve comes from the file itself or from an resolved import
                    // (i.e. has the 'relative' namespace)
                    const base =
                        args.namespace === 'relative'
                            ? path.join(path.dirname(args.importer), args.path)
                            : path.join(workingDir, args.importer);
                    let relpath = path.resolve(
                        path.relative(process.cwd(), path.join(path.dirname(base), args.path))
                    );

                    let readable = await canRead(relpath);
                    if (!readable) {
                        relpath = `${relpath}.js`;
                        readable = await canRead(relpath);
                    }
                    if (readable) {
                        const watchPath = path.relative(process.cwd(), relpath);
                        app.watches[watchPath] = (await fs.stat(watchPath)).mtime;
                        return {
                            path: relpath,
                            namespace: 'relative',
                        };
                    }
                } catch (e) {
                    app.error(`{{err Error}} ${e}`);
                    process.exit(1);
                }
            };

            build.onResolve({ filter: /^.\/.*/ }, resolveRelative);

            const resolvePackage = async (args) => {
                // Only use this custom resolution if the import comes from the user files
                if (!args.importer.match(/^[\.\/]/)) {
                    return;
                }

                // TODO: use the "dynamic-load:" prefix until the feature is ready
                let parts = args.path.split('/');
                const packageName = parts[0].startsWith('@') ? `${parts[0]}/${parts[1]}` : parts[0];

                app.printV1(`Resolving {{obj ${packageName}}}`);

                const dir = app.tempDirectory;
                let result = await build.resolve(args.path, { resolveDir: dir });
                if (result.errors.length > 0) {
                    if (!sh.test('-e', `${dir}/node_modules/${packageName}`)) {
                        const start = Date.now();

                        // Check if a specific version is being requested or if the latest
                        // should be used.  The version is passed along directly to npm so
                        // follows that format.
                        let packageIdentifier;
                        const version = frontmatter.modules[packageName];
                        if (version) {
                            app.printV1(`Using {{loc ${version}}}`);
                            packageIdentifier = `${packageName}@${version}`;
                        } else {
                            app.printV1('Using latest version');
                            packageIdentifier = packageName;
                        }

                        app.printV1(`Installing {{obj ${packageIdentifier}}}...`);
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
                        app.runtime.cachedModules[packageName] = true;
                        app.print(
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
                } else if (
                    !app.runtime.cachedModules[packageName] &&
                    args.importer.startsWith('./') &&
                    args.importer !== './__bootstrap.js'
                ) {
                    // Display to the user the cached module as such just once
                    app.runtime.cachedModules[packageName] = true;
                    const pkgJSON = JSON.parse(
                        await fs.readFile(
                            path.join(dir, 'node_modules', packageName, 'package.json'),
                            'utf8'
                        )
                    );
                    app.print(
                        `Using cached module {{obj ${packageName}}} {{loc v${pkgJSON.version}}}.`
                    );
                }

                app.printV1(`Path {{obj ${result.path}}}`);
                return { path: result.path, namespace: result.namespace, external: false };
            };

            build.onResolve({ filter: /^[^\.]/ }, resolvePackage);

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

            build.onLoad({ filter: /.*/, namespace: 'relative' }, async (args) => {
                return {
                    contents: await fs.readFile(args.path),
                    loader: 'jsx',
                    resolveDir: process.cwd(),
                };
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

        app.cacheID = generateRandomID();
        app.content = text;
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

        app.cacheID = generateRandomID();
        app.content = text;
    }
}
