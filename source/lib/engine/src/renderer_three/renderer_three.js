import * as THREE from 'three';

export class RendererThree {
    constructor(elem) {
        const rect = elem.getBoundingClientRect();
        const { width, height } = rect;

        this._hostElement = elem;
        this._renderer = null;
        this._scene = new THREE.Scene();
        this._camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);

        // By design, turn off antialiasing for a more pixelated look
        const renderer = new THREE.WebGLRenderer({ antialias: false });
        renderer.setClearColor('#3060C0');
        renderer.setSize(width, height);

        this._hostElement.appendChild(renderer.domElement);
        this._renderer = renderer;
    }

    dispose() {
        this._hostElement.removeChild(this._renderer.domElement);
    }

    get camera() {
        return this._camera;
    }
    get scene() {
        return this._scene;
    }
    get renderer() {
        return this._renderer;
    }

    addActor(ctx, actor) {
        if (!actor.mesh) {
            return;
        }
        this._scene.add(actor.mesh(ctx));
    }

    renderFrame() {
        this._renderer.render(this._scene, this._camera);
    }
}
