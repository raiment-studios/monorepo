import * as THREE from 'three';

export class FirstPersonCamera {
    constructor({
        id = 'camera',
        radius = 192, //
        offsetZ = 0,
    } = {}) {
        this._id = id;
        this._lookAt = new AnimVector3(32, 32, 5);
        this._position = new AnimVector3(0, 0, 12);
        this._flags = {
            pinToGroundHeight: true,
        };
    }

    get id() {
        return this._id;
    }

    lookAt(pt) {
        this._lookAt.target.copy(pt);
    }

    init({ engine }) {
        engine.events.on('W', () => {
            console.log('move forward');
            this._lookAt.target.y += 1;
            this._position.target.y += 1;
        });
        engine.events.on('S', () => {
            console.log('move back');
            this._lookAt.target.y -= 1;
            this._position.target.y -= 1;
        });
        engine.events.on('A', () => {
            console.log('move left');
            this._lookAt.target.x -= 1;
            this._position.target.x -= 1;
        });
        engine.events.on('D', () => {
            console.log('move right');
            this._lookAt.target.x += 1;
            this._position.target.x += 1;
        });
    }

    update({ engine, timeMS }) {
        const ε = 0.25;
        const worldUp = new THREE.Vector3(0, 0, 1);
        const camera = engine.renderers.three.camera;

        this._position.update(ε / 2.0);
        this._lookAt.update(ε / 2.0);

        camera.position.copy(this._position.current);
        camera.up = worldUp;
        camera.lookAt(this._lookAt.current.x, this._lookAt.current.y, this._lookAt.current.z);
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
