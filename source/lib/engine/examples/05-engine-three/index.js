import React from 'react';
import * as THREE from 'three';
import * as ReactEx from '../../../react-ex';
import * as core from '../../../core';
import { EngineFrame, OrbitCamera, StateMachine } from '../..';
import { Grid } from '../../src/actors/grid';

export default function () {
    const actors = [
        new Grid(),
        new OrbitCamera(), //
    ];

    for (let i = 0; i < 100; i++) {
        actors.push(new Sphere());
    }

    return (
        <ReactEx.ReadingFrame>
            <EngineFrame actors={actors} />
        </ReactEx.ReadingFrame>
    );
}

class Sphere {
    constructor() {
        this.position = new THREE.Vector3(0, 0, 8);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.acceleration = new THREE.Vector3(0, 0, 0);
        this._mesh = null;

        this._rng = core.makeRNG();
        const rng = this._rng;
        this.stateMachine = new StateMachine({
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
        });
    }

    update() {
        this.stateMachine.update();

        const dt = 1 / 60;

        this.velocity.addScaledVector(this.acceleration, dt);
        this.position.addScaledVector(this.velocity, dt);

        this._mesh.position.copy(this.position);
    }

    static _geometry = null;
    geometry() {
        if (!Sphere._geometry) {
            Sphere._geometry = new THREE.SphereGeometry(8, 32, 32);
        }
        return Sphere._geometry;
    }

    mesh() {
        const geometry = this.geometry();
        const material = new THREE.MeshBasicMaterial({
            color: new THREE.Color(
                this._rng.range(0.7, 1.0),
                this._rng.range(0.15, 0.35),
                this._rng.range(0.1, 0.95)
            ),
        });
        const sphere = new THREE.Mesh(geometry, material);
        this._mesh = sphere;
        return sphere;
    }
}
