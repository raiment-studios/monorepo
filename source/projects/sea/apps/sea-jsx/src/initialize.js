import fs from 'fs/promises';
import path from 'path';
import meow from 'meow';
import { generateRandomID } from './util.js';
import { print } from './ui.js';

/**
 * One-time initialization of the program
 *
 * Returns a context object with:
 * - Configuration
 * - Assets
 *
 * @returns
 */
export async function initialize() {
    const pkg = await loadPackageJSON();

    // Leverage "meow" for the flags parsing
    //
    // Note: some additional flags used internally (not by meow)
    // are included in the flag definition.
    //
    const options = {
        importMeta: import.meta,
        flags: {
            help: {
                type: 'boolean',
                alias: '?',
                default: false,
                isRequired: false,
                isMultiple: false,
                description: 'displays help information',
            },
            version: {
                type: 'boolean',
                // Do *not* use "v" as that can be confused with "verbose"
                // alias: 'v',
                default: false,
                isRequired: false,
                isMultiple: false,
                description: 'displays program version',
            },
        },
        autoHelp: false,
        autoVersion: false,
        allowUnknownFlags: true, // We'll check ourselves
    };

    const cli = meow(options);

    //
    // Check for unrecognized flags
    //
    for (let name of Object.keys(cli.flags)) {
        if (options.flags[name] === undefined) {
            print(`{{err ERROR}}: Unknown flag {{obj --${name}}}`);
            process.exit(1);
        }
    }

    //
    // --help
    //
    const brandBanner = `{{brand ≅≅≅ sea-jsx v${pkg.version} ≅≅≅}}`;
    const usageStrings = [
        'Usage', //
        '$ {{brand sea-jsx}} [...{{obj flags}}] <{{obj filename}}>',
    ];
    if (cli.flags.help) {
        print(
            brandBanner, //
            '',
            ...usageStrings,
            '',
            'Flags'
        );
        for (let [name, value] of Object.entries(options.flags)) {
            print(`  {{obj ${name.padEnd(20, ' ')}}}  ${value.description}`);
        }
        process.exit(0);
    }

    //
    // --version
    //
    if (cli.flags.version) {
        print(`v${pkg.version}`);
        process.exit(0);
    }

    //
    // Check input file
    //
    if (cli.input.length !== 1) {
        print(...usageStrings, '', `{{err ERROR}}: A single filename must be provided`);
        process.exit(1);
    }

    const inputFilename = cli.input[0];
    try {
        await fs.stat(inputFilename);
    } catch (e) {
        console.error(e);
        print(`{{err ERROR}}: could not open file {{obj ${inputFilename}}}`);
        process.exit(1);
    }

    //
    // Preconditions seem good so far.  Set up the context to get the program started.
    //
    const ctx = {
        config: {
            filename: inputFilename,
            port: 8080,
        },
        cacheID: generateRandomID(),
        assets: {},
        content: null,

        print: print,
    };

    print(brandBanner);
    await loadAssets(ctx);

    return ctx;
}

/**
 * Helper to load the package file for version info, etc.
 */
async function loadPackageJSON() {
    const filename = path.join(
        path.dirname(path.relative(process.cwd(), import.meta.url.replace(/^file:\/\//, ''))),
        '../package.json'
    );
    const text = await fs.readFile('package.json', 'utf8');
    return JSON.parse(text);
}

/**
 * Helper to load the bootstrap, scaffolding content into memory once for
 * future use.
 */
async function loadAssets(ctx) {
    const thisFile = path.relative(process.cwd(), import.meta.url.replace(/^file:\/\//, ''));
    ctx.assets['index.html'] = await fs.readFile(
        path.join(path.dirname(thisFile), 'assets/index.html')
    );
    ctx.assets['__bootstrap.js'] = await fs.readFile(
        path.join(path.dirname(thisFile), 'assets/__bootstrap.js')
    );
}
