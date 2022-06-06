import * as THREE from 'three';

export class OrbitCamera {
    constructor({
        id = 'camera',
        radius = 192, //
        periodMS = 10000,
        offsetZ = 0,
    } = {}) {
        this._id = id;
        this._periodMS = periodMS;
        this._radius = new AnimScale(radius);
        this._lookAt = new AnimVector3(0, 0, 0);
        this._angle = 0.0;
        this._offsetZ = new AnimScale(offsetZ);

        this._autoHeight = true;
        this._autoRotate = true;
    }

    get id() {
        return this._id;
    }

    get radius() {
        return this._radius.current;
    }
    set radius(v) {
        if (!(v >= 0)) {
            throw new Error('Invalid parameter');
        }
        this._radius.target = v;
    }
    set offsetZ(value) {
        this._offsetZ.target = value;
    }

    lookAt(pt) {
        this._autoHeight = false;
        this._lookAt.target.copy(pt);
    }

    update({ engine, timeMS }) {
        const ε = 0.25;
        const worldUp = new THREE.Vector3(0, 0, 1);
        const camera = engine.renderers.three.camera;

        const offsetZ = this._offsetZ.update(ε).current;
        const radius = this._radius.update(ε).current;

        this._lookAt.update(ε / 2.0);
        let lookX = this._lookAt.current.x;
        let lookY = this._lookAt.current.y;
        let lookZ = this._lookAt.current.z;

        if (this._autoHeight) {
            lookZ += radius / 10.0;
        }

        if (this._autoRotate) {
            this._angle = (timeMS * Math.PI) / this._periodMS;
        }

        const ang = this._angle;
        const ang2 = ang / 1.802;

        const cx = lookX + radius * Math.cos(ang);
        const cy = lookY + radius * Math.sin(ang);
        const cz = lookZ + offsetZ + radius * (0.5 + 0.25 * (0.5 + 0.5 * Math.sin(ang2)));

        camera.position.set(cx, cy, cz);
        camera.up = worldUp;
        camera.lookAt(lookX, lookY, lookZ);
    }
}

class AnimScale {
    constructor(value = 0) {
        this.current = value;
        this.target = value;
    }

    update(ε = 0.25) {
        const delta = this.target - this.current;
        const step = Math.max(ε, Math.abs(delta) / 200);

        if (Math.abs(delta) < ε) {
            this.current = this.target;
        } else if (delta > 0) {
            this.current += step;
        } else if (delta < 0) {
            this.current -= step;
        }
        return this;
    }
}

class AnimVector3 {
    constructor(x = 0, y = 0, z = 0) {
        this.current = new THREE.Vector3(x, y, z);
        this.target = this.current.clone();
    }

    update(ε = 0.25) {
        const delta = this.target.clone().sub(this.current);
        const step = Math.max(ε, delta.length() / 200);

        for (let c of ['x', 'y', 'z']) {
            const delta = this.target[c] - this.current[c];
            if (Math.abs(delta) < ε) {
                this.current[c] = this.target[c];
            } else if (delta > 0) {
                this.current[c] += step;
            } else if (delta < 0) {
                this.current[c] -= step;
            }
        }
        return this;
    }
}
