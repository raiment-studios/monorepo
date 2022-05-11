import sh from 'shelljs';

export async function clean(ctx) {
    ctx.print(`Cleaning directory {{obj ${ctx.tempDirectory}}}.`);
    sh.rm('-rf', `${ctx.tempDirectory}/node_modules`);
    sh.rm('-f', `${ctx.tempDirectory}/package.json`);
    sh.rm('-f', `${ctx.tempDirectory}/package-lock.json`);
}
