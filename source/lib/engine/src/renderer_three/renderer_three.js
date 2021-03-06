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

        const renderer = new THREE.WebGLRenderer({
            // By design, turn off antialiasing for a more pixelated look
            antialias: false,
            // Needed for toDataURI('image/png') to work for grabbing screenshots
            preserveDrawingBuffer: true,
        });
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
    // Life-cycle methods
    //-----------------------------------------------------------------------//

    addActor(ctx, actor) {
        if (!actor.mesh && !actor.initMesh) {
            return;
        }

        const { scene } = this;

        function addToScene(mesh) {
            actor.__mesh = mesh;

            if (actor.flags?.castShadow) {
                setCastShadowRecurvise(mesh, true);
            }
            if (actor.flags?.receiveShadow) {
                setReceiveShadowRecurvise(mesh, true);
            }
            scene.add(mesh);
        }

        // Allow mesh to be sync or async
        let ret;
        if (actor.mesh && !actor.initMesh) {
            console.warn('Actor.mesh deprecated. Rename to initMesh().', actor);
            ret = actor.mesh(ctx);
        } else {
            ret = actor.initMesh(ctx);
        }
        if (typeof ret.then === 'function') {
            ret.then((mesh) => addToScene(mesh));
        } else {
            addToScene(ret);
        }
    }

    removeActor(ctx, actor) {
        if (!actor.__mesh) {
            return;
        }
        this.scene.remove(actor.__mesh);
    }

    renderFrame({ engine }) {
        for (let actor of engine.actors) {
            // Automatically update the mesh position
            if (actor.position && actor.__mesh) {
                actor.__mesh.position.copy(actor.position);
            }
        }

        this._renderer.render(this._scene, this._camera);
    }

    //-----------------------------------------------------------------------//
    // THREE specific
    //-----------------------------------------------------------------------//

    raycast(nx, ny) {
        // ???? TODO: should raycaster be a member variable?
        const raycaster = new THREE.Raycaster();
        const scene = this._scene;

        // Scan the scene, then fire event of intersections
        const ndc = new THREE.Vector2(nx, ny);
        raycaster.setFromCamera(ndc, this.camera);

        const intersections = raycaster.intersectObjects(scene.children, true);
        if (intersections.length > 0) {
            return {
                first: intersections[0],
                list: intersections,
            };
        }
        return null;
    }
}

function setCastShadowRecurvise(meshLike, value) {
    meshLike.castShadow = value;
    if (meshLike.children) {
        for (let child of meshLike.children) {
            setCastShadowRecurvise(child, value);
        }
    }
}

function setReceiveShadowRecurvise(meshLike, value) {
    meshLike.receiveShadow = value;
    if (meshLike.children) {
        for (let child of meshLike.children) {
            setReceiveShadowRecurvise(child, value);
        }
    }
}
