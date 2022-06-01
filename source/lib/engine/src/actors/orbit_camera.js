import * as THREE from 'three';

export class OrbitCamera {
    constructor({
        radius = 192, //
        periodMS = 10000,
        offsetZ = 0,
    } = {}) {
        this._radius = radius;
        this._periodMS = periodMS;
        this._offsetZ = offsetZ;
        this._lookAtZ = undefined;
    }

    get id() {
        return 'camera';
    }

    get radius() {
        return this._radius;
    }
    set radius(v) {
        if (!(v >= 0)) {
            throw new Error('Invalid parameter');
        }
        this._radius = v;
    }

    set lookAtZ(v) {
        this._lookAtZ = v;
    }

    update({ engine, timeMS }) {
        const worldUp = new THREE.Vector3(0, 0, 1);
        const radius = this._radius;

        const camera = engine.renderers.three.camera;

        const ang = (timeMS * Math.PI) / this._periodMS;
        const ang2 = (timeMS * Math.PI) / (this._periodMS * 1.802);

        const cx = radius * Math.cos(ang);
        const cy = radius * Math.sin(ang);
        const cz = this._offsetZ + radius * (0.5 + 0.25 * (0.5 + 0.5 * Math.sin(ang2)));

        const lz = this._lookAtZ ?? radius / 10.0;

        camera.position.set(cx, cy, cz);
        camera.up = worldUp;
        camera.lookAt(0, 0, lz);
    }
}
