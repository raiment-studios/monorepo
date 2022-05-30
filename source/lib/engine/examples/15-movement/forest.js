import * as core from '@raiment/core';
import chroma from 'chroma-js';
import * as THREE from 'three';
import { VoxelModelSG } from './voxel_mesh_sg';

export class Forest {
    constructor(params) {
        this._params = Object.assign(
            {
                seed: 31174,
                count: 32,
            },
            params
        );
    }
    init({ engine }) {
        const { count, seed } = this._params;
        //const { terrain } = engine.world;

        const rng = core.makeRNG(seed);
        const W = 128; //Math.floor(terrain.size / 2);
        for (let i = 0; i < count; i++) {
            let position;
            for (let attempt = 0; attempt < 100; attempt++) {
                position = [rng.rangei(-W, W), rng.rangei(-W, W)];

                //      const type = terrain.getValue(position[0], position[1], 'type');
                //if (type === 0) {
                //break;
                //}
            }
            engine.actors.push(new TreeActor({ position }));
        }
    }
}

class TreeActor {
    constructor(params) {
        this._params = Object.assign(
            {
                position: [0, 0, 0],
            },
            params
        );
        this._group = null;

        this._position = new THREE.Vector3(
            this._params.position[0],
            this._params.position[1],
            this._params.position[2]
        );

        this.flags = {
            meshNeedsUpdate: true,
            castShadow: true,
            pinToGroundHeight: true,
        };
    }

    get position() {
        return this._position;
    }

    get groundCollisionShape() {
        return {
            type: 'rect',
            width: 3,
        };
    }

    async mesh({ engine }) {
        const rng = core.makeRNG(2998474);
        const { position } = this._params;
        this._group = new THREE.Group();
        this._group.position.set(
            position[0] + rng.range(-1e-2, 1e-2),
            position[1] + rng.range(-1e-2, 1e-2),
            0
        );
        const mesh = await this._buildMesh({ engine, rng });
        this._group.add(mesh);

        return this._group;
    }
    async _buildMesh({ engine, rng }) {
        const model = new VoxelModelSG();

        const func = await treeShader.generate({
            height: rng.rangei(8, 20),
            radius: rng.rangei(3, 6),
        });

        const ctx = buildContext(model);
        for (let it of func(ctx)) {
            // Step :)
        }
        model.update({ engine });

        return model.mesh({ engine });
    }
}

function buildContext(voxels) {
    const ctx = {};

    const rng = core.makeRNG();
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
        voxels.set(x + offset.x, y + offset.y, z + offset.z, color);
    };

    ctx.voxel = function (x, y, z) {
        const c = shadePixel();
        voxels.set(x + offset.x, y + offset.y, z + offset.z, c);
    };

    ctx.heightAt = function (x, y) {
        return voxels.heightAt(x, y, 0);
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
                    voxels.set(x + offset.x, y + offset.y, z + offset.z, [cr, cg, cb]);
                }
            }
        }
    };
    return ctx;
}

const treeShader = {
    generate: async function (values) {
        const height = values.height;
        const radius = values.radius;

        return function* ({ point, sphere }) {
            const rng = core.makeRNG();
            const base = [
                rng.rangei(98, 162) / 255,
                rng.rangei(120, 192) / 255,
                rng.rangei(0, 32) / 255,
            ];

            const ctrunk = chroma('brown').brighten(4.5).gl();

            for (let z = 0; z < height - radius; z++) {
                const c = [...ctrunk];
                const s = rng.select([0.9, 0.95, 1.0, 1.0]);
                c[0] *= s;
                c[1] *= s;
                c[2] *= s;
                point(0, 0, z, c);
            }

            for (let i = 0; i < 1; i++) {
                const cx = 0;
                const cy = 0;
                const cz = height;

                const color = [...base];
                color[0] *= rng.range(0.5, 1.0);
                color[1] *= rng.range(0.85, 1.0);
                color[2] *= rng.range(0.5, 1.0);

                sphere(cx, cy, cz, radius, color);
                yield;
            }
        };
    },
};
