import * as THREE from 'three';
import * as core from '../../../core';

export class Rain {
    constructor({
        count = 100000, //
        color = 0x3355cc,
    } = {}) {
        this._context = {
            rng: core.makeRNG(6237),
        };
        this._count = count;
        this._color = color;
    }
    update({ mesh }) {
        const { rng } = this._context;
        const v = mesh.geometry.attributes.position.array;

        const speeds = [1, 1.5, 1.1, 1.3, 1.2];
        let speedIndex = 0;
        for (let i = 0; i < v.length; i += 3) {
            let z = v[i + 2];
            if (v[i + 2] < 0) {
                v[i + 0] = rng.range(-256, 256);
                v[i + 1] = rng.range(-256, 256);
                z = rng.range(490, 510);
            } else {
                const s = speeds[speedIndex];
                speedIndex = (speedIndex + 1) % speeds.length;
                z -= 1.5 * s;
            }
            v[i + 2] = z;
        }
        mesh.geometry.attributes.position.needsUpdate = true;
    }

    mesh() {
        const { rng } = this._context;

        const vertices = [];
        const colors = [];
        for (var p = 0; p < this._count; p++) {
            // create a particle with random
            // position values, -250 -> 250
            const x = rng.range(-250, 250);
            const y = rng.range(-250, 250);
            const z = rng.range(0, 500);
            vertices.push(x, y, z);

            const color = rng.select([
                [0.6, 0.6, 0.8],
                [0.6, 0.7, 1],
                [0.7, 0.7, 1],
                [0.8, 0.7, 1],
                [0.8, 0.7, 1],
                [0.5, 0.5, 1],
            ]);

            colors.push(...color);
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 1.5,
            transparent: true,
            opacity: 0.35,
        });
        material.vertexColors = true;

        const points = new THREE.Points(geometry, material);
        return points;
    }
}
