import * as THREE from 'three';
import { loadImage } from '../image/load_image';
import { getImagePixelData } from '../image/get_image_pixel_data';

export class ImageGeometryCache {
    constructor() {
        this._cache = {};
    }

    async get(url, scale, density, offset) {
        const key = [url, scale, density, offset].join('|');
        let geometry = this._cache[key];
        if (!geometry) {
            const img = await loadImage(url);
            const image = getImagePixelData(img);
            geometry = makeGeometry(image);

            // Hard-coded to this scale for uniformity across assets.
            const maxDim = Math.max(img.width, img.height);
            const s = (scale * (8 * 1.0)) / maxDim;
            geometry.translate(-image.width / 2, -0.5, 0);
            geometry.scale(s, density * s, s);
            geometry.translate(offset.x, offset.y, offset.z);
            this._cache[key] = geometry;
        }
        return geometry;
    }
}

function makeGeometry(image) {
    const positions = [];
    const colors = [];
    const index = [];

    function quad(p0, p1, p2, p3, color, shade = 1.0) {
        const vi = positions.length / 3;
        positions.push(...p0);
        positions.push(...p1);
        positions.push(...p2);
        positions.push(...p3);

        color = [color[0] * shade, color[1] * shade, color[2] * shade];
        colors.push(...color);
        colors.push(...color);
        colors.push(...color);
        colors.push(...color);

        index.push(vi + 0, vi + 1, vi + 2);
        index.push(vi + 2, vi + 3, vi + 0);
    }

    function transparent(ix, iy) {
        const i = 4 * (iy * image.width + ix);
        if (image.pixels[i + 3] < 1) {
            return true;
        }
        if (image.pixels[i + 0] === 0 && image.pixels[i + 1] === 0 && image.pixels[i + 2] === 0) {
            return true;
        }
        return false;
    }

    for (let iy = 0; iy < image.height; iy++) {
        for (let ix = 0; ix < image.width; ix++) {
            const i = 4 * (iy * image.width + ix);
            const x = ix;
            const y = 0;
            const z = image.height - iy - 1;

            if (i < 0 || i >= image.pixels.length) {
                throw new Error('Internal error: index out of range');
            }

            if (transparent(ix, iy)) {
                continue;
            }

            const color = [
                image.pixels[i + 0] / 255,
                image.pixels[i + 1] / 255,
                image.pixels[i + 2] / 255,
            ];

            if (transparent(ix, iy - 1)) {
                quad(
                    [x + 0, y + 0, z + 1], //
                    [x + 1, y + 0, z + 1], //
                    [x + 1, y + 1, z + 1], //
                    [x + 0, y + 1, z + 1], //
                    color
                );
            }
            if (transparent(ix - 1, iy)) {
                quad(
                    [x + 0, y + 0, z + 0], //
                    [x + 0, y + 0, z + 1], //
                    [x + 0, y + 1, z + 1], //
                    [x + 0, y + 1, z + 0], //
                    color,
                    0.5
                );
            }
            if (transparent(ix + 1, iy)) {
                quad(
                    [x + 1, y + 0, z + 0], //
                    [x + 1, y + 1, z + 0], //
                    [x + 1, y + 1, z + 1], //
                    [x + 1, y + 0, z + 1], //
                    color,
                    0.5
                );
            }

            quad(
                [x + 0, y + 0, z + 0], //
                [x + 1, y + 0, z + 0], //
                [x + 1, y + 0, z + 1], //
                [x + 0, y + 0, z + 1], //
                color,
                1.0
            );

            quad(
                [x + 0, y + 1, z + 0], //
                [x + 0, y + 1, z + 1], //
                [x + 1, y + 1, z + 1], //
                [x + 1, y + 1, z + 0], //
                color,
                1.0
            );
        }
    }

    let geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setIndex(Array.from(index));
    geometry.computeBoundingBox();
    return geometry;
}
