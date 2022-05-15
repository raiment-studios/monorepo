import * as THREE from 'three';

export class OrbitCamera {
    constructor({ radius = 192 } = {}) {
        this._radius = radius;
    }

    update({ engine, timeMS }) {
        const worldUp = new THREE.Vector3(0, 0, 1);
        const radius = this._radius;

        const camera = engine.renderers.three.camera;

        const ang = (timeMS * Math.PI) / 10000;
        const ang2 = (timeMS * Math.PI) / 18020;

        const cx = radius * Math.cos(ang);
        const cy = radius * Math.sin(ang);
        const cz = radius * (0.5 + 0.25 * (0.5 + 0.5 * Math.sin(ang2)));

        camera.position.set(cx, cy, cz);
        camera.up = worldUp;
        camera.lookAt(0, 0, radius / 10.0);
    }

    // TODO: I suspect this is already defined more robustly somewhere in THREE.js
    _computeBoundsRecursive(node) {
        const mesh = node instanceof THREE.Mesh ? node : null;
        if (mesh) {
            mesh.geometry.computeBoundingBox();
            const bbox = mesh.geometry.boundingBox.clone();
            bbox.translate(mesh.position);
            return bbox;
        }
        if (node instanceof THREE.Group || node instanceof THREE.Scene) {
            const bounds = new THREE.Box3();
            for (let child of node.children) {
                bounds.union(this._computeBoundsRecursive(THREE, child));
            }
            return bounds;
        }
        return new THREE.Box3();
    }
}
