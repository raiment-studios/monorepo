import yaml from 'yaml';

/**
 * Scan the entry-point file for front-matter data that will be used in
 * configuration.
 *
 * @param {*} source
 *
 * TODO: make this more efficient. It is currently written for simplicity
 * with no thought to efficiency.
 */
export function parseFrontMatter(source) {
    const lines = source.split('\n');
    const start = lines.findIndex((line) => line.trim().startsWith('/*!@sea:header'));

    // There's no front-matter defined
    if (start === -1) {
        return null;
    }

    const end = lines.slice(start + 1).findIndex((line) => line.trim() === '*/');
    if (end === -1) {
        console.error('Error: found front-matter begin token without end token');
        process.exit(1);
    }

    const content = lines.slice(start + 1, start + end + 1).join('\n');
    const obj = yaml.parse(content);
    return obj;
}
