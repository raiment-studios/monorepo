import * as THREE from 'three';

export class FirstPersonCamera {
    constructor({ id = 'camera' } = {}) {
        this._id = id;
        this._lookAt = new AnimVector3(32, 32, 5);
        this._position = new AnimVector3(0, 0, 12);
        this._angle = new AnimScalar(Math.PI / 2.0);
    }

    get id() {
        return this._id;
    }

    lookAt(pt) {
        this._lookAt.target.copy(pt);
    }

    _forward() {
        const x = Math.cos(this._angle.current);
        const y = Math.sin(this._angle.current);
        return [x, y];
    }

    init({ engine }) {
        const STEP = 1;
    }

    update({ engine, timeMS, keyState }) {
        const STEP = 0.15;
        const ε = 0.25;
        const worldUp = new THREE.Vector3(0, 0, 1);
        const camera = engine.renderers.three.camera;

        if (keyState['Q']) {
            this._angle.target += Math.PI / 100;
        }
        if (keyState['E']) {
            this._angle.target -= Math.PI / 100;
        }

        const [fx, fy] = this._forward();
        let dx = 0.0;
        let dy = 0.0;
        if (keyState['W']) {
            dx += STEP * fx;
            dy += STEP * fy;
        }
        if (keyState['S']) {
            dx -= STEP * fx;
            dy -= STEP * fy;
        }
        if (keyState['A']) {
            dx -= STEP * fy;
            dy += STEP * fx;
        }
        if (keyState['D']) {
            dx += STEP * fy;
            dy -= STEP * fx;
        }
        this._position.target.x += dx;
        this._position.target.y += dy;

        this._angle.update(ε / 4.0);
        this._position.update(ε * 2.0);

        const pos = this._position.current.clone();
        const z = engine.world.groundHeight(pos.x, pos.y);
        if (z > -Infinity) {
            pos.z = z;
        }
        pos.z += 4;

        const lookX = pos.x + 10 * fx;
        const lookY = pos.y + 10 * fy;
        const lookZ = pos.z - 1;

        camera.fov = 80;
        camera.position.copy(pos);
        camera.up = worldUp;
        camera.lookAt(lookX, lookY, lookZ);
    }
}

class AnimScalar {
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
