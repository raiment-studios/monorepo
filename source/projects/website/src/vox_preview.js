import React from 'react';
import { useAsyncEffect } from '../../../lib/react-ex';
import {
    EngineFrame,
    useEngine,
    Grid,
    OrbitCamera,
    BasicLighting,
    GroundPlane,
} from '../../../lib/engine/src';
import { VoxelModelSG } from './mesh/voxel_mesh_sg';
import * as THREE from 'three';

// 🚧 TODO: move to core
class DataReader {
    constructor(arrayBuffer) {
        this._view = new DataView(arrayBuffer);
        this._offset = 0;
    }

    get offset() {
        return this._offset;
    }

    skip(n) {
        this._offset += n;
    }
    seek(offset) {
        this._offset = offset;
    }

    readCharString(len) {
        let s = '';
        while (len > 0) {
            const c = this.readUint8();
            s += String.fromCharCode(c);
            len--;
        }
        return s;
    }

    readUint8() {
        const v = this._view.getUint8(this._offset);
        this._offset += 1;
        return v;
    }

    readInt32LE() {
        const v = this._view.getInt32(this._offset, true);
        this._offset += 4;
        return v;
    }

    readUint32LE() {
        const v = this._view.getUint32(this._offset, true);
        this._offset += 4;
        return v;
    }
}

function readVOX(arrayBuffer) {
    const reader = new DataReader(arrayBuffer);

    // https://github.com/ephtracy/voxel-model/blob/master/MagicaVoxel-file-format-vox.txt

    const vox = {
        header: null,
        models: [
            {
                size: null,
                voxels: null,
                palette: null,
            },
        ],
    };

    vox.header = {
        id: reader.readCharString(4),
        version: reader.readUint32LE(),
    };

    const readChunk = () => {
        const id = reader.readCharString(4);
        const chunkBytes = reader.readUint32LE();
        const childBytes = reader.readUint32LE();
        const chunkEnd = reader.offset + chunkBytes;

        if (id === 'MAIN') {
            // zero length chunk
        } else if (id === 'SIZE') {
            const sizeX = reader.readInt32LE();
            const sizeY = reader.readInt32LE();
            const sizeZ = reader.readInt32LE();
            vox.models[0].size = [sizeX, sizeY, sizeZ];
        } else if (id === 'XYZI') {
            const size = reader.readInt32LE();
            const voxels = new Array(4 * size);
            for (let i = 0; i < voxels.length; i += 4) {
                voxels[i + 0] = reader.readUint8();
                voxels[i + 1] = reader.readUint8();
                voxels[i + 2] = reader.readUint8();
                voxels[i + 3] = reader.readUint8();
            }
            vox.models[0].voxels = voxels;
        } else if (id === 'RGBA') {
            const size = 256;
            const palette = new Array(4 * size);
            for (let i = 0; i < palette.length; i += 4) {
                palette[i + 0] = reader.readUint8();
                palette[i + 1] = reader.readUint8();
                palette[i + 2] = reader.readUint8();
                palette[i + 3] = reader.readUint8();
            }
            vox.models[0].palette = palette;
        } else {
            console.log('Unhandled', id);
            reader.skip(chunkBytes);
        }
        if (reader.offset !== chunkEnd) {
            console.log(
                `${id}: did not read the entire chunk. ${
                    chunkEnd - reader.offset
                } bytes unread of ${chunkBytes}.`
            );
        }
        reader.seek(chunkEnd);

        if (childBytes > 0) {
            const end = reader.offset + childBytes;
            while (reader.offset < end) {
                readChunk();
            }
        }
    };
    readChunk();
    return vox;
}

export function VOXPreview({ url }) {
    const engine = useEngine(() => {
        engine.actors.push(
            new Grid(),
            new OrbitCamera({ radius: 32, offsetZ: 5, periodMS: 4500 }),
            new BasicLighting(),
            new GroundPlane()
        );
    });

    useAsyncEffect(
        async (token) => {
            const resp = await fetch(url);
            const blob = await resp.blob();

            const arrayBuffer = await blob.arrayBuffer();
            const voxModel = readVOX(arrayBuffer);
            console.log(voxModel);

            const actor = new VoxelModelSG();

            const colorArray = voxModel.models[0].palette || defaultPalette();

            const voxelArray = voxModel.models[0].voxels;
            for (let i = 0; i < voxelArray.length; i += 4) {
                const x = voxelArray[i + 0];
                const y = voxelArray[i + 1];
                const z = voxelArray[i + 2];
                const colorIndex = 4 * (voxelArray[i + 3] - 1);

                const color = [
                    colorArray[colorIndex + 0] / 255.0,
                    colorArray[colorIndex + 1] / 255.0,
                    colorArray[colorIndex + 2] / 255.0,
                ];
                actor.set(x, y, z, color);
            }

            engine.actors.push({
                update: (ctx) => {
                    actor.update(ctx);
                },
                mesh: (ctx) => {
                    const group = new THREE.Group();
                    const scale = 20 / voxModel.models[0].size[0];

                    group.scale.set(scale, scale, scale);
                    group.position.set(
                        (-scale * voxModel.models[0].size[0]) / 2,
                        (-scale * voxModel.models[0].size[1]) / 2,
                        0
                    );
                    group.add(actor.mesh(ctx));
                    return group;
                },
            });
        },
        [url]
    );

    return (
        <EngineFrame
            style={{
                width: 800,
                aspectRatio: '2 / 1',
                border: 'solid 1px #CCC',
                borderRadius: 32,
            }}
            engine={engine}
        />
    );
}

let _cachedPalette = null;
function defaultPalette() {
    if (!_cachedPalette) {
        const base = [
            0x00000000, 0xffffffff, 0xffccffff, 0xff99ffff, 0xff66ffff, 0xff33ffff, 0xff00ffff,
            0xffffccff, 0xffccccff, 0xff99ccff, 0xff66ccff, 0xff33ccff, 0xff00ccff, 0xffff99ff,
            0xffcc99ff, 0xff9999ff, 0xff6699ff, 0xff3399ff, 0xff0099ff, 0xffff66ff, 0xffcc66ff,
            0xff9966ff, 0xff6666ff, 0xff3366ff, 0xff0066ff, 0xffff33ff, 0xffcc33ff, 0xff9933ff,
            0xff6633ff, 0xff3333ff, 0xff0033ff, 0xffff00ff, 0xffcc00ff, 0xff9900ff, 0xff6600ff,
            0xff3300ff, 0xff0000ff, 0xffffffcc, 0xffccffcc, 0xff99ffcc, 0xff66ffcc, 0xff33ffcc,
            0xff00ffcc, 0xffffcccc, 0xffcccccc, 0xff99cccc, 0xff66cccc, 0xff33cccc, 0xff00cccc,
            0xffff99cc, 0xffcc99cc, 0xff9999cc, 0xff6699cc, 0xff3399cc, 0xff0099cc, 0xffff66cc,
            0xffcc66cc, 0xff9966cc, 0xff6666cc, 0xff3366cc, 0xff0066cc, 0xffff33cc, 0xffcc33cc,
            0xff9933cc, 0xff6633cc, 0xff3333cc, 0xff0033cc, 0xffff00cc, 0xffcc00cc, 0xff9900cc,
            0xff6600cc, 0xff3300cc, 0xff0000cc, 0xffffff99, 0xffccff99, 0xff99ff99, 0xff66ff99,
            0xff33ff99, 0xff00ff99, 0xffffcc99, 0xffcccc99, 0xff99cc99, 0xff66cc99, 0xff33cc99,
            0xff00cc99, 0xffff9999, 0xffcc9999, 0xff999999, 0xff669999, 0xff339999, 0xff009999,
            0xffff6699, 0xffcc6699, 0xff996699, 0xff666699, 0xff336699, 0xff006699, 0xffff3399,
            0xffcc3399, 0xff993399, 0xff663399, 0xff333399, 0xff003399, 0xffff0099, 0xffcc0099,
            0xff990099, 0xff660099, 0xff330099, 0xff000099, 0xffffff66, 0xffccff66, 0xff99ff66,
            0xff66ff66, 0xff33ff66, 0xff00ff66, 0xffffcc66, 0xffcccc66, 0xff99cc66, 0xff66cc66,
            0xff33cc66, 0xff00cc66, 0xffff9966, 0xffcc9966, 0xff999966, 0xff669966, 0xff339966,
            0xff009966, 0xffff6666, 0xffcc6666, 0xff996666, 0xff666666, 0xff336666, 0xff006666,
            0xffff3366, 0xffcc3366, 0xff993366, 0xff663366, 0xff333366, 0xff003366, 0xffff0066,
            0xffcc0066, 0xff990066, 0xff660066, 0xff330066, 0xff000066, 0xffffff33, 0xffccff33,
            0xff99ff33, 0xff66ff33, 0xff33ff33, 0xff00ff33, 0xffffcc33, 0xffcccc33, 0xff99cc33,
            0xff66cc33, 0xff33cc33, 0xff00cc33, 0xffff9933, 0xffcc9933, 0xff999933, 0xff669933,
            0xff339933, 0xff009933, 0xffff6633, 0xffcc6633, 0xff996633, 0xff666633, 0xff336633,
            0xff006633, 0xffff3333, 0xffcc3333, 0xff993333, 0xff663333, 0xff333333, 0xff003333,
            0xffff0033, 0xffcc0033, 0xff990033, 0xff660033, 0xff330033, 0xff000033, 0xffffff00,
            0xffccff00, 0xff99ff00, 0xff66ff00, 0xff33ff00, 0xff00ff00, 0xffffcc00, 0xffcccc00,
            0xff99cc00, 0xff66cc00, 0xff33cc00, 0xff00cc00, 0xffff9900, 0xffcc9900, 0xff999900,
            0xff669900, 0xff339900, 0xff009900, 0xffff6600, 0xffcc6600, 0xff996600, 0xff666600,
            0xff336600, 0xff006600, 0xffff3300, 0xffcc3300, 0xff993300, 0xff663300, 0xff333300,
            0xff003300, 0xffff0000, 0xffcc0000, 0xff990000, 0xff660000, 0xff330000, 0xff0000ee,
            0xff0000dd, 0xff0000bb, 0xff0000aa, 0xff000088, 0xff000077, 0xff000055, 0xff000044,
            0xff000022, 0xff000011, 0xff00ee00, 0xff00dd00, 0xff00bb00, 0xff00aa00, 0xff008800,
            0xff007700, 0xff005500, 0xff004400, 0xff002200, 0xff001100, 0xffee0000, 0xffdd0000,
            0xffbb0000, 0xffaa0000, 0xff880000, 0xff770000, 0xff550000, 0xff440000, 0xff220000,
            0xff110000, 0xffeeeeee, 0xffdddddd, 0xffbbbbbb, 0xffaaaaaa, 0xff888888, 0xff777777,
            0xff555555, 0xff444444, 0xff222222, 0xff111111,
        ];

        const results = [];
        for (let i32 of base) {
            const r = (i32 >> 24) & 0xff;
            const b = (i32 >> 16) & 0xff;
            const g = (i32 >> 8) & 0xff;
            const a = (i32 >> 0) & 0xff;
            results.push(r, g, b, a);
        }
        _cachedPalette = results;
    }
    return _cachedPalette;
}
