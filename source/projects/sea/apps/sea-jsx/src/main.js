import { watchLoop } from './watch/watch.js';
import { startServer } from './server/server.js';
import { build } from './build/build.js';
import { initialize } from './init/initialize.js';
import sh from 'shelljs';
import fs from 'fs/promises';

/**
 * Main program entry-point.
 */
async function main() {
    const ctx = await initialize();

    if (ctx.config.clean) {
        ctx.print(`Cleaning directory {{obj ${ctx.tempDirectory}}}.`);
        sh.rm('-rf', `${ctx.tempDirectory}/node_modules`);
        sh.rm('-f', `${ctx.tempDirectory}/package.json`);
        sh.rm('-f', `${ctx.tempDirectory}/package-lock.json`);
    }

    ctx.print(`Building {{obj ${ctx.config.filename}}}`);
    await build(ctx);

    if (ctx.config.build) {
        // Note: different assets are loaded for the --build flag
        const text = ctx.assets['index.html'].toString().replace('{{client-source}}', ctx.content);

        sh.mkdir('-p', 'dist');
        await fs.writeFile('dist/index.html', text);
    } else {
        ctx.print(`Running on port {{loc ${ctx.config.port}}}`, `Press {{loc CTRL-C}} to exit`, '');
        await startServer(ctx);
        await watchLoop(ctx);
    }
}
main();
