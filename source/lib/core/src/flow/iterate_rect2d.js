export function iterateRect2D(x0, y0, x1, y1, cb) {
    for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
            cb(x, y);
        }
    }
}
