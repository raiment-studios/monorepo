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
import { chunk } from 'lodash';

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

    readUint32LE() {
        const v = this._view.getUint32(this._offset, true);
        this._offset += 4;
        return v;
    }
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
            const reader = new DataReader(arrayBuffer);

            // https://github.com/ephtracy/voxel-model/blob/master/MagicaVoxel-file-format-vox.txt

            const vox = {
                header: null,
                models: [],
                chunks: [],
            };

            const header = {
                id: reader.readCharString(4),
                version: reader.readUint32LE(),
            };

            vox.header = header;

            const readChunk = (parent) => {
                const id = reader.readCharString(4);
                const chunkBytes = reader.readUint32LE();
                const childBytes = reader.readUint32LE();
                reader.skip(chunkBytes);

                console.log(id, chunkBytes, childBytes);
                const chunk = { id };
                if (childBytes > 0) {
                    const end = reader.offset + childBytes;
                    chunk.chunks = [];

                    readChunkList(chunk, end);
                }

                parent.chunks.push(chunk);
            };

            const readChunkList = (parent, end) => {
                while (reader.offset < end) {
                    readChunk(parent);
                }
            };

            readChunk(vox);

            console.log(vox);
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
