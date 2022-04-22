import { watchLoop } from './watch.js';
import { startServer } from './server.js';
import { build } from './build/build.js';
import { initialize } from './initialize.js';
import sh from 'shelljs';

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
        console.log(sh.ls(ctx.tempDirectory).stdout);
    }

    ctx.print(
        `Running {{obj ${ctx.config.filename}}} on port {{loc ${ctx.config.port}}}`,
        `Press {{loc CTRL-C}} to exit`,
        ''
    );

    await build(ctx);
    await startServer(ctx);
    await watchLoop(ctx);
}
main();
