export function iterateCircle2D(cx, cy, radius, cb) {
    const R2 = radius * radius;
    for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
            const d2 = dx * dx + dy * dy;
            if (d2 >= R2) {
                continue;
            }
            cb(cx + dx, cy + dy);
        }
    }
}
