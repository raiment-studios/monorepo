import * as THREE from 'three';

export function componentPhysicsPVA({ actor, methods }) {
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
            preupdate: function () {
                methods.update(1);
            },
        },
        methods: {
            update(dt) {
                actor.velocity.addScaledVector(actor.acceleration, dt);
                actor.position.addScaledVector(actor.velocity, dt);
            },
        },
    };
}
