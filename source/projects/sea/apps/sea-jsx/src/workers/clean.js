import sh from 'shelljs';

export async function clean(app) {
    app.print(`Cleaning directory {{obj ${app.tempDirectory}}}.`);
    sh.rm('-rf', `${app.tempDirectory}/node_modules`);
    sh.rm('-f', `${app.tempDirectory}/package.json`);
    sh.rm('-f', `${app.tempDirectory}/package-lock.json`);
}
