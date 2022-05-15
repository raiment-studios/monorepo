import * as THREE from 'three';

export class Grid {
    mesh() {
        const GRID_SIZE = 256;
        const size = GRID_SIZE;
        const divisions = GRID_SIZE / 4;
        const grid = new THREE.GridHelper(size, divisions);
        grid.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2.0);
        return grid;
    }
}
