import glob from 'glob';
import sh from 'shelljs';

async function main() {
    console.log('Hello world');
    const examples = glob
        .sync('**/')
        .filter((s) => !s.startsWith('node_modules'))
        .map((s) => s.replace(/\/$/, ''));

    for (let example of examples) {
        const cmd = [
            `sea-jsx`,
            `${example}/index.js`,
            `--publish`,
            `--target=raiment-studios.github.io/engine/examples/${example}.html`,
            `--token=${process.env.RAIMENT_GITHUB_PERSONAL_ACCESS_TOKEN}`,
        ].join(' ');

        sh.exec(cmd);

        // Delay the API calls so they are not rejected
        await new Promise((resolve) => setTimeout(resolve, 250));
    }
}
main();
