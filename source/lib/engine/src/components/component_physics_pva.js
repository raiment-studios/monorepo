import * as THREE from 'three';

export function componentPhysicsPVA(actor) {
    return {
        name: 'physicsPVA',
        properties: {
            position: {
                value: new THREE.Vector3(0, 0, 0),
            },
            velocity: {
                value: new THREE.Vector3(0, 0, 0),
            },
            acceleration: {
                value: new THREE.Vector3(0, 0, 0),
            },
        },
        events: {
            preupdate() {
                this.update(1);
            },
        },

        update(dt) {
            actor.velocity.addScaledVector(actor.acceleration, dt);
            actor.position.addScaledVector(actor.velocity, dt);
        },
    };
}
