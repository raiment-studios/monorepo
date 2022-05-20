import sh from 'shelljs';
import fs from 'fs/promises';
import { watchLoop } from './workers/watch.js';
import { startServer } from './workers/server.js';
import { build } from './workers/build.js';
import { initialize } from './init/initialize.js';
import { publish } from './workers/publish.js';
import { clean } from './workers/clean.js';
import { parseCommandLine } from './init/parse_command_line.js';
import { loadPackageJSON } from './init/load_package_json.js';
import { print } from './util/index.js';
import { SeaJSX } from './sea_jsx.js';

/**
 * Main program entry-point for command-line execution.
 */
async function main() {
    const pkg = await loadPackageJSON();
    const config = await parseCommandLine(pkg);

    print(`{{brand ≅≅≅  sea-jsx v${pkg.version}  ≅≅≅}}`);
    const sea = new SeaJSX(config.global);

    // CLI parsing should ensure the method always exists
    const cmd = sea[config.command.name];
    if (!cmd) {
        console.error(`No such command: ${cmd}`);
        process.exit(1);
    }
    await cmd.call(sea, config.command.options);

    process.exit(0);

    const ctx = await initialize();

    ctx.print(`Building {{obj ${ctx.config.filename}}}`);
    await build(ctx);

    if (ctx.config.build) {
        // Note: different assets are loaded for the --build flag
        const text = ctx.assets['index.html'].toString().replace('{{client-source}}', ctx.content);

        sh.mkdir('-p', 'dist');
        await fs.writeFile('dist/index.html', text);
    }

    if (ctx.config.publish) {
        await publish(ctx, {
            accessToken: ctx.config.token ?? process.env.SEA_GITHUB_TOKEN,
        });
    }

    if (!ctx.config.bundle) {
        ctx.print(`Running on port {{loc ${ctx.config.port}}}`, `Press {{loc CTRL-C}} to exit`, '');
        await startServer(ctx);
        await watchLoop(ctx);
    }
}
main();
