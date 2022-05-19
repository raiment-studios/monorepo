import { EventEmitter } from '@raiment/core';
import _ from 'lodash';
import * as THREE from 'three';

export class TextureAtlas {
    constructor({ textureSize = 256, tileSize = 16 } = {}) {
        EventEmitter.composeInto(this);

        this._names = [];
        this._nameToIndex = {};
        this._textureList = [];

        this._canvas = document.createElement('canvas');
        this._canvas.width = textureSize;
        this._canvas.height = textureSize;
        this._tileSize = tileSize;
        this._tilesPerRow = Math.floor(textureSize / tileSize);

        this._promises = {};
        this._dirty = false;
        this._texture = null;

        console.assert(_.isNumber(this._tileSize) && this._tileSize > 0);
        console.assert(_.isNumber(this._tilesPerRow) && this._tilesPerRow > 0);
    }

    /**
     * Returns a promise that resolves when the images are all loaded and draw to the
     * underlying canvas.
     */
    ready() {
        return Promise.all(Object.values(this._promises));
    }

    addImage(name, url) {
        const index = this._names.length;
        this._names.push(name);
        this._nameToIndex[name] = index;

        this._textureList.push({
            name,
            url,
            index,
            size: this._tileSize,
        });

        // Spawn an asynchronous function to do the loading
        (async () => {
            this._promises[index] = new Promise((resolve) => {
                const image = new Image();
                image.onload = () => {
                    resolve(image);
                };
                image.onerror = (err) => {
                    console.error('TextureAtlas: Error loading image', err, { name, index, url });
                };
                image.src = url;
            });

            const img = await this._promises[index];

            const x = (index % this._tilesPerRow) * this._tileSize;
            const y = Math.floor(index / this._tilesPerRow) * this._tileSize;
            const ctx = this._canvas.getContext('2d');
            ctx.drawImage(img, x, y);

            if (this._texture) {
                this._texture.needsUpdate = true;
            }
        })();
    }

    /**
     * Returns a plain JavaScript object with just the atlas' mapping information.
     * This is useful for passing generating UVs in other threads that do not have
     * or want access to the underlying image data.
     */
    mapping() {
        const m = {
            texture_size: this._textureSize,
            tile_size: this._tileSize,
            name_to_index: { ...this._nameToIndex },
        };
        return m;
    }

    dataURI() {
        const dataURI = this._canvas.toDataURL();
        return dataURI;
    }

    texture() {
        if (!this._texture) {
            this._texture = new THREE.CanvasTexture(this._canvas);
            this._texture.minFilter = THREE.NearestFilter;
            this._texture.magFilter = THREE.NearestFilter;
        }
        return this._texture;
    }

    get textureList() {
        return this._textureList;
    }
}
