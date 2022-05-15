import React from 'react';
import * as THREE from 'three';
import { Engine } from './engine/engine';

class RendererThree {
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

    addActor(actor) {
        if (!actor.mesh) {
            return;
        }
        this._scene.add(actor.mesh());
    }

    renderFrame() {
        this._renderer.render(this._scene, this._camera);
    }
}

export function EngineFrame({
    engine = new Engine(), //
    actors = [],
}) {
    const refElem = React.useRef(null);

    React.useEffect(() => {
        engine.renderers['three'] = new RendererThree(refElem.current);
        engine.actors.push(...actors);

        engine.start();
        return () => {
            engine.stop();
            engine.dispose();
        };
    }, []);

    return (
        <div
            ref={refElem}
            style={{
                width: '100%',
                height: 600,
                border: 'solid 1px #333',
            }}
        />
    );
}
