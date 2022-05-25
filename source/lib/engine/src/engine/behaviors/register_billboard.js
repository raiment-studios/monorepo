import * as THREE from 'three';

export function registerBillboard(engine) {
    const state = {
        angle: 0.0,
        zAxis: new THREE.Vector3(0, 0, 1),
    };

    engine.events.on('engine.preupdate', ({ engine }) => {
        // https://stackoverflow.com/questions/14813902/three-js-get-the-direction-in-which-the-camera-is-looking
        const viewVector = new THREE.Vector3(0, 0, -1);
        viewVector.applyQuaternion(engine.renderers.three.camera.quaternion);
        state.angle = Math.atan2(-viewVector.y, -viewVector.x);
    });

    engine.events.on('actor.postupdate', ({ engine, actor }) => {
        if (!actor.flags?.billboard) {
            return;
        }

        const mesh = actor.__mesh;
        mesh?.setRotationFromAxisAngle(state.zAxis, state.angle + Math.PI / 2);
    });
}
