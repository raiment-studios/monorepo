/**
 * Given a voxel grid data structure, create a THREE based mesh.
 *
 * Each voxel will be 1x1x1 in model space.  The mesh's origin is a 0x0x0
 * with the mesh growing in the positive x, y, z directions.
 *
 * Voxel interface
 *
 *  size: x, y,z
 *  get(x,y,z)
 *      voxel:
 *          color
 *          texture : int index into texture atlas
 *
 *
 */
export function makeVoxelGeometry(voxels, options) {
    options = Object.assign(
        {
            voxelScale: 1.0,
            textureAtlasSize: 1,
        },
        options
    );

    const arrays = {
        elements: 0,
        index: [],
        position: new ChunkedFloat32Array(),
        normal: new ChunkedFloat32Array(),
        uv: new ChunkedFloat32Array(),
        color: new ChunkedFloat32Array(),
    };

    // Convience function for transferring a quad into the GeometryBuffer
    // arrays
    const quad2 = ({ label, corners, id, positions, normal, color, uv }) => {
        const [p0, p1, p2, p3] = positions.map((i) => corners[i]);
        const [uv0, uv1, uv2, uv3] = uv;

        // Quad points
        arrays.position.push(...p0);
        arrays.normal.push(...normal);
        arrays.uv.push(...uv0);

        arrays.position.push(...p1);
        arrays.normal.push(...normal);
        arrays.uv.push(...uv1);

        arrays.position.push(...p2);
        arrays.normal.push(...normal);
        arrays.uv.push(...uv2);

        arrays.position.push(...p3);
        arrays.normal.push(...normal);
        arrays.uv.push(...uv3);

        // Simple shading
        color = [...color];
        const colorScale = {
            top: 1.0,
            bottom: 0.1,
            left: 0.5,
            right: 0.75,
            front: 0.6,
            back: 0.6,
        }[label];
        color[0] *= colorScale;
        color[1] *= colorScale;
        color[2] *= colorScale;

        arrays.color.push(...color);
        arrays.color.push(...color);
        arrays.color.push(...color);
        arrays.color.push(...color);

        const s = arrays.elements;
        arrays.index.push(s);
        arrays.index.push(s + 1);
        arrays.index.push(s + 2);
        arrays.index.push(s);
        arrays.index.push(s + 2);
        arrays.index.push(s + 3);
        arrays.elements += 4;
    };

    // Test if there's a neighboring face so that faces that will never be
    // visible can be skipped.
    const hasNeighbor = (vx, vy, vz) => {
        if (
            vx < 0 ||
            vy < 0 ||
            vz < 0 ||
            vx >= voxels.size.x ||
            vy >= voxels.size.y ||
            vz >= voxels.size.z
        ) {
            return false;
        }
        const voxel = voxels.get(vx, vy, vz);
        if (!voxel) {
            return false;
        }
        return true;
    };

    //
    // For each voxel
    //
    let voxelID = 0;
    for (let vz = 0; vz < voxels.size.z; vz++) {
        for (let vy = 0; vy < voxels.size.y; vy++) {
            for (let vx = 0; vx < voxels.size.x; vx++, voxelID++) {
                const voxel = voxels.get(vx, vy, vz);
                if (!voxel) {
                    continue;
                }
                let { color, texture } = voxel;

                const vs = (1.0 - options.voxelScale) / 2.0;
                const f0 = 0 + vs;
                const f1 = 1 - vs;
                const corners = [
                    [f0 + vx, f0 + vy, f1 + vz],
                    [f1 + vx, f0 + vy, f1 + vz],
                    [f0 + vx, f1 + vy, f1 + vz],
                    [f1 + vx, f1 + vy, f1 + vz],
                    [f0 + vx, f0 + vy, f0 + vz],
                    [f1 + vx, f0 + vy, f0 + vz],
                    [f0 + vx, f1 + vy, f0 + vz],
                    [f1 + vx, f1 + vy, f0 + vz], // 7
                ];

                // U,V look-up in the texture atlas
                //
                // TODO: textureAtlasSize is wrong. It should be a tileSize and tileCount, which
                // may not be the same
                //
                const atlasSize = voxels.textureAtlasSize || 1;
                const nudge = 0 / atlasSize;
                const u0 = Math.floor(texture % atlasSize) / atlasSize + nudge;
                const u1 = u0 + 1 / atlasSize - nudge;
                const v0 = 1.0 - Math.floor(texture / atlasSize) - nudge;
                const v1 = v0 - 1 / atlasSize + nudge;

                if (!hasNeighbor(vx, vy, vz + 1)) {
                    quad2({
                        label: 'top',
                        id: voxelID,
                        corners,
                        positions: [0, 1, 3, 2],
                        normal: [0, 0, 1],
                        color,
                        uv: [
                            [u0, v0],
                            [u1, v0],
                            [u1, v1],
                            [u0, v1],
                        ],
                    });
                }

                if (!hasNeighbor(vx, vy, vz - 1)) {
                    quad2({
                        label: 'bottom',
                        id: voxelID,
                        corners,
                        positions: [4, 6, 7, 5],
                        normal: [0, 0, -1],
                        color,
                        uv: [
                            [u0, v0],
                            [u0, v1],
                            [u1, v1],
                            [u1, v0],
                        ],
                    });
                }
                if (!hasNeighbor(vx + 1, vy, vz)) {
                    quad2({
                        label: 'right',
                        id: voxelID,
                        corners,
                        positions: [3, 1, 5, 7],
                        normal: [1, 0, 0],
                        color,
                        uv: [
                            [u1, v0],
                            [u0, v0],
                            [u0, v1],
                            [u1, v1],
                        ],
                    });
                }

                if (!hasNeighbor(vx - 1, vy, vz)) {
                    quad2({
                        label: 'left',
                        id: voxelID,
                        corners,
                        positions: [6, 4, 0, 2],
                        normal: [-1, 0, 0],
                        color,
                        uv: [
                            [u0, v1],
                            [u1, v1],
                            [u1, v0],
                            [u0, v0],
                        ],
                    });
                }

                if (!hasNeighbor(vx, vy + 1, vz)) {
                    quad2({
                        label: 'front',
                        id: voxelID,
                        corners,
                        positions: [2, 3, 7, 6],
                        normal: [0, 1, 0],
                        color,
                        uv: [
                            [u1, v0],
                            [u0, v0],
                            [u0, v1],
                            [u1, v1],
                        ],
                    });
                }

                if (!hasNeighbor(vx, vy - 1, vz)) {
                    quad2({
                        label: 'back',
                        id: voxelID,
                        corners,
                        positions: [0, 4, 5, 1],
                        normal: [0, -1, 0],
                        color,
                        uv: [
                            [u0, v0],
                            [u0, v1],
                            [u1, v1],
                            [u1, v0],
                        ],
                    });
                }
            }
        }
        //await new Promise((resolve) => setTimeout(resolve, 0));
    }

    let geometry = {
        position: arrays.position.data(),
        normal: arrays.normal.data(),
        uv: arrays.uv.data(),
        color: arrays.color.data(),
        index: new Int32Array(arrays.index),
    };
    return geometry;
}

/**
 * TODO: how much does this actually help performance versus a regular array?
 * With some empirical testing, it is not notably faster.
 */
export class ChunkedFloat32Array {
    constructor() {
        this.chunks = [];
        this.index = 0;
    }
    push(...f) {
        for (let v of f) {
            const CHUNKSIZE = 32 * 1024;
            const ci = Math.floor(this.index / CHUNKSIZE);
            const co = this.index % CHUNKSIZE;

            let chunk = this.chunks[ci];
            if (!chunk) {
                chunk = new Float32Array(CHUNKSIZE);
                this.chunks[ci] = chunk;
            }
            chunk[co] = v;
            this.index++;
        }
    }
    data() {
        const arr = new Float32Array(this.index);
        let i = 0;
        for (let chunk of this.chunks) {
            for (let j = 0; j < chunk.length; j++) {
                arr[i++] = chunk[j];
            }
        }
        return arr;
    }
}
