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
            new OrbitCamera({ radius: 32 }),
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
        },
        [url]
    );

    return (
        <EngineFrame
            style={{
                width: 400,
                aspectRatio: '1 / 1',
                border: 'solid 1px #CCC',
                borderRadius: 32,
            }}
            engine={engine}
        />
    );
}
