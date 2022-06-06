import React from 'react';
import * as THREE from 'three';
import * as ReactEx from '../../../react-ex/src';
import * as core from '../../../core/src';
import { EngineFrame, OrbitCamera, StateMachine, BasicLighting } from '../..';
import { Grid } from '../../src/actors/grid';

export default function () {
    const actors = [
        new Grid(),
        new OrbitCamera(), //
        new BasicLighting(),
        new GroundPlane(),
    ];

    for (let i = 0; i < 120; i++) {
        actors.push(new Sphere());
    }

    return (
        <ReactEx.ReadingFrame>
            <EngineFrame actors={actors} />
        </ReactEx.ReadingFrame>
    );
}

class GroundPlane {
    mesh() {
        const planeGeometry = new THREE.PlaneGeometry(256, 256, 32, 32);
        const planeMaterial = new THREE.MeshStandardMaterial({ color: 0xfcfcdc });
        const plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.position.set(0, 0, -0.05);
        plane.receiveShadow = true;
        return plane;
    }
}

class Sphere {
    constructor() {
        this.position = new THREE.Vector3(0, 0, 32);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.acceleration = new THREE.Vector3(0, 0, 0);
        this._mesh = null;

        this._rng = core.makeRNG();
    }

    stateMachine() {
        const rng = this._rng;
        return {
            _bind: this,
            _start: function* () {
                const mv = 16;
                this.velocity.set(rng.range(-mv, mv), rng.range(-mv, mv), rng.range(-mv, mv));
                return 'accelerateRandom';
            },
            accelerateRandom: function* () {
                const mv = 32;
                this.acceleration.set(rng.range(-mv, mv), rng.range(-mv, mv), rng.range(-mv, mv));

                const color = this._mesh.material.color;
                const dc = 0.025;
                this._mesh.material.color = new THREE.Color(
                    color.r + rng.range(-dc, dc),
                    color.g + rng.range(-dc, dc),
                    color.b + rng.range(-dc, dc)
                );
                return ['wait', rng.rangei(20, 60)];
            },
            accelerateOrigin: function* () {
                this.acceleration.set(0, 0, 0).addScaledVector(this.position, -1);
                return ['wait', rng.rangei(10, 20)];
            },
            wait: function* (count) {
                yield count;
                return rng.range(0, 10) < 7 ? 'accelerateRandom' : 'accelerateOrigin';
            },
        };
    }

    update() {
        const dt = 1 / 60;

        this.velocity.addScaledVector(this.acceleration, dt);
        this.position.addScaledVector(this.velocity, dt);

        this.velocity.multiplyScalar(0.999);

        for (let key of ['x', 'y', 'z']) {
            if (Math.abs(this.position[key]) > 128 - 12) {
                this.velocity[key] *= -1;
            }
        }
        if (this.position.z < 12) {
            this.velocity.z *= -1;
        }

        this._mesh.position.copy(this.position);
    }

    static _geometry = null;
    geometry() {
        if (!Sphere._geometry) {
            Sphere._geometry = new THREE.SphereGeometry(12, 64, 64);
        }
        return Sphere._geometry;
    }

    mesh() {
        const geometry = this.geometry();
        const material = new THREE.MeshPhongMaterial({
            color: new THREE.Color(
                this._rng.range(0.7, 1.0),
                this._rng.range(0.15, 0.35),
                this._rng.range(0.1, 0.95)
            ),
        });
        const sphere = new THREE.Mesh(geometry, material);
        sphere.castShadow = true;
        sphere.receiveShadow = true;
        this._mesh = sphere;
        return sphere;
    }
}
