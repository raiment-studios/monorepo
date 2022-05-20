import fs from 'fs/promises';
import yargs from 'yargs/yargs';
import { colorize } from '../util/ui.js';

export async function parseCommandLine(pkg) {
    const config = {
        global: {
            version: pkg.version,
            verbosity: 0,
        },
        command: {
            name: undefined,
            options: {},
        },
    };

    // By design...
    // Trade design symmetry for pragmatic usability and assume the "dev"
    // command if the first argument is a JavaScript filename.
    //
    let cliArgs = process.argv.slice(2);
    if (cliArgs.length === 1 && cliArgs[0].match(/\.js$/)) {
        const filename = cliArgs[0];
        try {
            const stat = await fs.stat(filename);
            if (stat.isFile()) {
                cliArgs = ['dev', filename];
            }
        } catch (ignored) {}
    }

    const argv = yargs(cliArgs)
        .version(pkg.version)
        .demandCommand(1)
        .usage(colorize(`{{brand ≅≅≅  sea-jsx v${pkg.version}  ≅≅≅}}`))
        .positional('filename', {
            describe: 'will default to the dev command',
            type: 'string',
        })
        .example([
            ['$0 index.js', `equivalent to sea-jsx dev index.js`],
            ['$0 build --clean index.js', 'build without using any cached modules'],
        ])
        .command(
            'dev <filename>',
            'run the script with automatic reloading',
            (yargs) =>
                yargs
                    .option('clean', {
                        describe: 'remove any cached files before the operation',
                        default: false,
                    })
                    .option('port', {
                        describe: 'the local port to run on',
                        default: 8080,
                    }),
            (yargs) => {
                config.command.name = 'dev';
                config.command.options = {
                    filename: yargs.filename,
                    clean: yargs.clean,
                    port: yargs.port,
                };
            }
        )
        .command(
            'build <filename>',
            'compile the file to a bundle',
            (yargs) =>
                yargs
                    .option('clean', {
                        describe: 'remove any cached files before the operation',
                    })
                    .option('target', {
                        describe: 'target ',
                        default: 'dist/index.html',
                    }),
            (yargs) => {
                config.command.name = 'build';
                config.command.options = {
                    filename: yargs.filename,
                    clean: yargs.clean,
                    target: yargs.target,
                };
            }
        )
        .command(
            'publish <filename>',
            'build and deploy the target file',
            (yargs) =>
                yargs
                    .option('clean', {
                        describe: 'remove any cached files before the operation',
                    })
                    .option('target', {
                        describe: 'target ',
                    })
                    .option('token', {
                        describe: 'access token for given target',
                    }),
            () => {
                console.log('publish TODO');
            }
        )
        .command(
            'clean',
            'remove any temporary cached files',
            (yargs) => yargs,
            () => {
                config.command.name = 'clean';
                config.command.options = {};
            }
        )
        .option('verbosity', {
            alias: 'v',
            type: 'number',
            default: 0,
            description: 'Run with verbose logging',
        })
        .epilogue('')
        .help()
        .strict().argv;

    config.global.verbosity = argv.verbosity;

    return config;
}
