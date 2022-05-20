export function formatNumber(n) {
    if (Math.floor(n) === n) {
        if (n >= 1e8) {
            return n.toExponential(2).replace(/0+e/, 'e').replace('.e', 'e');
        }
        return n.toLocaleString();
    }
    if (Math.floor(n / Math.PI) === n / Math.PI) {
        return `${Math.floor(n / Math.PI)}π`;
    }

    let s = `${n}`;
    if (s.length > 4 && n > 1) {
        const i = s.indexOf('.');
        if (i > 0) {
            const len = Math.max(i + 2, 5);
            s = s.substring(0, len);
        }
    }
    return s;
}
