export function generate(count, cb) {
    const arr = new Array(count);
    for (let i = 0; i < count; i++) {
        arr[i] = cb(i);
    }
    return arr;
}
