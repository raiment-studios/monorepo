export function iterateBorder2D(cx, cy, width, cb) {
    for (let dy = -width; dy <= width; dy++) {
        for (let dx = -width; dx <= width; dx++) {
            cb(cx + dx, cy + dy);
        }
    }
}
