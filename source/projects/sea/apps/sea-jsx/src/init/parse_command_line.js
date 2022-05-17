import yargs from 'yargs/yargs';

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

    const argv = yargs(process.argv.slice(2))
        .version(pkg.version)
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
                    }),
            () => {
                console.log('build TODO');
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
        .command('clean', 'remove any temporary cached files')
        .option('verbosity', {
            alias: 'v',
            type: 'number',
            default: 0,
            description: 'Run with verbose logging',
        })
        .help()
        .strict().argv;

    config.global.verbosity = argv.verbosity;

    return config;
}
