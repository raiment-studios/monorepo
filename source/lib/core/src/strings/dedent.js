/**
 * Removes any common left indentation from a string.
 */
export function dedent(s) {
    let lines = s.split('\n');
    let indent = s.length;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        let m = line.match(/^\s*/);
        let t = m[0];

        // Ignore blank lines
        if (t.length === line.length) {
            continue;
        }
        indent = Math.min(t.length, indent);
    }
    return lines
        .map((line) => line.substr(indent))
        .join('\n')
        .replace(/\s+$/, '');
}
