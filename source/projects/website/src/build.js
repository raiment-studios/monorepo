import path from 'path';
import glob from 'glob';
import sh from 'shelljs';

async function main() {
    const base = path.join(process.env.MONOREPO_ROOT, 'source/lib/engine/examples');
    const pattern = `${base}/**/`;
    const results = glob
        .sync(pattern)
        .map((p) => p.replace(`${base}/`, '').replace(/\/$/, ''))
        .filter((p) => !!p);

    for (let folder of results) {
        const cmd = `sea-jsx build ${base}/${folder}/index.js --target=dist/engine/examples/${folder}.html`;
        console.log(cmd);
        sh.exec(cmd);
    }
}
main();
