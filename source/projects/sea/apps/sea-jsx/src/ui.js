import chalk from 'chalk';

// Simple colorized text.  Not a very robust implementation.
//
// Limitations:
// - Doesn't support escaping the {{ }} template blocks
// - No checks that embedded variables could contain template blocks
//

export function print(...args) {
    for (let s of args) {
        s = s.replace(/{{(obj|loc|err|brand) (.*?)}}/g, (m, style, string) => {
            switch (style) {
                case 'brand':
                    return chalk.hex('#47a1f5').bold(string);
                case 'obj':
                    return chalk.hex('#f7de5e')(string);
                case 'loc':
                    return chalk.hex('#be99cf')(string);
                case 'err':
                    return chalk.hex('#d4220b')(string);
            }
            return string;
        });
        console.log(chalk.hex('#8a92b8')(s));
    }
}
