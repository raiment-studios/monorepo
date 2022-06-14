import * as THREE from 'three';
import * as core from '../../../core';

export class Snow {
    constructor({ count = 10000 } = {}) {
        this._count = count;
        this._children = [];
    }
    init({ engine }) {
        const c1 = Math.floor(this._count / 3);
        const c0 = this._count - c1;

        this._children = [
            new SnowEffect({
                count: c0,
                //color: 0x888888,
                color: 0xcccccc,
            }),
            new SnowEffect({
                count: c1,
                color: 0xdddddd,
            }),
        ];

        engine.actors.push(...this._children);
    }
    dispose({ engine }) {
        engine.actors.remove(...this._children);
    }
}

class SnowEffect {
    constructor({
        count = 100000, //
        color = 0x888888,
    } = {}) {
        this._context = {
            rng: core.makeRNG(6237),
        };
        this._count = count;
        this._color = color;
    }
    update({ engine, mesh }) {
        const { rng } = this._context;
        const v = mesh.geometry.attributes.position.array;

        for (let i = 0; i < v.length; i += 3) {
            const sx = v[i + 0];
            const sy = v[i + 1];
            let z = v[i + 2];
            if (v[i + 2] < 0) {
                v[i + 0] = rng.range(-250, 250);
                v[i + 1] = rng.range(-250, 250);
                z = rng.range(490, 510);
            } else {
                z -= rng.range(0.5, 1.05);
            }
            v[i + 2] = z;
        }
        mesh.geometry.attributes.position.needsUpdate = true;
    }

    initMesh() {
        const { rng } = this._context;

        const vertices = [];
        for (var p = 0; p < this._count; p++) {
            // create a particle with random
            // position values, -250 -> 250
            const x = rng.range(-250, 250);
            const y = rng.range(-250, 250);
            const z = rng.range(0, 500);
            vertices.push(x, y, z);
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

        const material = new THREE.PointsMaterial({ color: this._color });

        const points = new THREE.Points(geometry, material);
        return points;
    }
}
