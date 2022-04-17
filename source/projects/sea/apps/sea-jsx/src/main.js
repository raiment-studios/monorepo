import { watchLoop } from './watch.js';
import { startServer } from './server.js';
import { build } from './build.js';
import { initialize } from './initialize.js';

/**
 * Main program entry-point.
 */
async function main() {
    const ctx = await initialize();

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
