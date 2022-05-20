import * as THREE from 'three';

export class GroundPlane {
    mesh() {
        const planeGeometry = new THREE.PlaneGeometry(256, 256, 32, 32);
        const planeMaterial = new THREE.MeshStandardMaterial({ color: 0xfcfcdc });
        const plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.position.set(0, 0, -0.05);
        plane.receiveShadow = true;
        return plane;
    }
}
