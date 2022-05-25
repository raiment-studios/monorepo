import * as core from '@raiment/core';

export function makeVoxelContext(model) {
    const ctx = {};

    const rng = core.rng();
    ctx.rng = rng;

    ctx.color = [1.0, 1.0, 1.0, 1.0];

    let offset = { x: 0, y: 0, z: 0 };
    let shadePixel = () => ctx.color;

    ctx.setPixelShader = function (type, value) {
        const c = value;
        const arr = [1.0, 0.95, 0.9, 0.85];
        shadePixel = () => {
            const shade = rng.select(arr);
            return [c[0] * shade, c[1] * shade, c[2] * shade];
        };
    };
    ctx.setOffset = function (x, y, z) {
        offset.x = x;
        offset.y = y;
        offset.z = z;
    };

    ctx.point = function (x, y, z, color) {
        model.set(x + offset.x, y + offset.y, z + offset.z, color);
    };

    ctx.voxel = function (x, y, z) {
        const c = shadePixel();
        model.set(x + offset.x, y + offset.y, z + offset.z, c);
    };

    ctx.heightAt = function (x, y) {
        return model.heightAt(x, y, 0);
    };

    ctx.sphere = (cx, cy, cz, r, base) => {
        for (let dz = -r; dz <= r; dz++) {
            for (let dy = -r; dy <= r; dy++) {
                for (let dx = -r; dx <= r; dx++) {
                    const d2 = dx * dx + dy * dy + dz * dz;
                    if (d2 > r * r) {
                        continue;
                    }

                    const x = Math.floor(cx + dx);
                    const y = Math.floor(cy + dy);
                    const z = Math.floor(cz + dz);

                    const shade = rng.select([1.0, 0.95, 0.9, 0.85]);
                    const cr = base[0] * shade;
                    const cg = base[1] * shade;
                    const cb = base[2] * shade;
                    model.set(x + offset.x, y + offset.y, z + offset.z, [cr, cg, cb]);
                }
            }
        }
    };
    return ctx;
}
