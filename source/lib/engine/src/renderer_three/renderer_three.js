import * as THREE from 'three';

export class RendererThree {
    //-----------------------------------------------------------------------//
    // Construction
    //-----------------------------------------------------------------------//

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

    //-----------------------------------------------------------------------//
    // Properties
    //-----------------------------------------------------------------------//

    get canvas() {
        return this._renderer.domElement;
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

    //-----------------------------------------------------------------------//
    // Methods
    //-----------------------------------------------------------------------//

    addActor(ctx, actor) {
        if (!actor.mesh) {
            return;
        }

        // Allow mesh to be sync or async
        const { scene } = this;
        const ret = actor.mesh(ctx);
        if (typeof ret.then === 'function') {
            ret.then((mesh) => {
                scene.add(mesh);
            });
        } else {
            scene.add(ret);
        }
    }

    renderFrame() {
        this._renderer.render(this._scene, this._camera);
    }
}
