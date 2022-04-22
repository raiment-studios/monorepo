import { describe, expect, test } from '@jest/globals';
import { parseFrontMatter } from './parse_front_matter';

describe('parseFrontMatter', () => {
    test('lack of front matter returns null', () => {
        const obj = parseFrontMatter('');
        expect(obj).toBe(null);
    });

    const testCases = {
        'empty string': '',
        'no comments': `
function hello() {
    return 'world';
}
        `,
        'no comment header': `
/*!
    hello: world
*/
function hello() {
    return 'world';
}
        `,
        indented: `
/*!@sea:header
    hello: world
*/
function hello() {
    return 'world';
}
        `,
        'arbitrary YAML is parsed': `
/*!@sea:header
hello: world
list:
    - 1
    - 2
    - 3
    - nested1: value1
      nested2: value2
*/
        `,
    };

    for (let [name, text] of Object.entries(testCases)) {
        test(name, () => {
            const result = parseFrontMatter(text);
            expect(result).toMatchSnapshot();
        });
    }
});
