import fs from 'fs/promises';
import path from 'path';
import { watchLoop } from './workers/watch.js';
import { startServer } from './workers/server.js';
import { build } from './workers/build.js';
import { ensureTempDirectory } from './init/ensure_temp_directory.js';
import { generateRandomID, print, error } from './util/index.js';

/**
 * This class is in the midst of refactoring.
 *
 * The SeaJSX file is intended to be a high-level facade object for interacting
 * with SeaJSX as a library.  The intention is to initialize the object once
 * via construction, then multiple high-level commands can be executed on it.
 * The object itself should be high-level, storing only minimal application
 * state that's applicable to all commands and caches that improve performance
 * across commands.
 *
 * Currently, it also contains "shared utility" functions that unifies the
 * implementation of the commands. It may make sense split logically into
 * the command interface, the configuration, the cache, and the toolkit.
 */
export class SeaJSX {
    constructor(config) {
        this._config = {
            version: '-',
            verbosity: 0,
            ...config,
        };
        this._tempDirectory = '';
        this._assetCache = {};

        this.stats = {
            buildCount: 0,
        };
        // TODO: move this?
        this.runtime = {
            cachedModules: {},
        };

        this._ready = this._init();
    }

    // -- Commands --------------------------------------------------------- //

    async dev(options) {
        await this._ready;

        this.print(`Building {{obj ${options.filename}}}`);
        const { output, buildID, watches } = await build(this, { filename: options.filename });

        this.print(`Running on port {{loc ${options.port}}}`, `Press {{loc CTRL-C}} to exit`, '');
        await startServer(this, { port: options.port, content: output, cacheID: buildID });
        await watchLoop(this, { watches });
    }

    async build(options) {
        await this._ready;

        this.print(`Building {{obj ${options.filename}}}`);
        const { output, buildID, watches } = await build(this, { filename: options.filename });

        const text = (await this.asset('production/index.html'))
            .toString()
            .replace('{{client-source}}', output);

        // TODO: if target is a GitHub pages site, deploy there
        const size = Math.floor(text.length / 1024);
        this.print(`Writing {{loc ${size}k}} characters to {{obj ${options.target}}}`);
        await fs.writeFile(options.target, text);
    }
    async publish(options) {
        await this._ready;
    }

    // -- Logging, etc. --------------------------------------------------- //
    print(...args) {
        print(...args);
    }

    printV1(...args) {
        if (this.verbosity < 1) {
            return;
        }
        print(...args);
    }

    error(...args) {
        error(...args);
    }

    generateRandomID(...args) {
        generateRandomID(...args);
    }

    async asset(filename) {
        let asset = this._assetCache[filename];
        if (!asset) {
            const thisFile = path.relative(
                process.cwd(),
                import.meta.url.replace(/^file:\/\//, '')
            );
            asset = await fs.readFile(path.join(path.dirname(thisFile), `assets/${filename}`));
        }
        return asset;
    }

    // -- Configuration --------------------------------------------------- //
    get version() {
        return this._config.version;
    }

    get verbosity() {
        const v = this._config.verbosity;
        return v;
    }

    get tempDirectory() {
        return this._tempDirectory;
    }

    // -- Internal -------------------------------------------------------- //
    async _init() {
        this._tempDirectory = await ensureTempDirectory(this);
    }
}
