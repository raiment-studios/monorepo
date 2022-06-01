import * as THREE from 'three';
import chroma from 'chroma-js';

export class BasicLighting {
    constructor(params) {
        this._params = Object.assign(
            {
                enableAmbient: false,
                enableHelper: false, //
                intensity: 1.0,
                skyFade: 0.0,
            },
            params
        );
    }
    initMesh({ engine }) {
        const rendererThree = engine.renderers.three;
        const { scene, camera, renderer } = rendererThree;
        const { intensity, skyFade } = this._params;

        scene.fog = new THREE.Fog(0x3333cc, 10, 500);

        const color = chroma.mix('#3060C0', 'black', skyFade);
        renderer.setClearColor(color.hex());

        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap

        if (this._params.enableAmbient) {
            var light = new THREE.AmbientLight(0x101010, intensity);
            scene.add(light);
        }
        {
            var light = new THREE.HemisphereLight(0x404040, 0xffffcc, 0.25 * intensity);
            scene.add(light);
        }
        {
            var light = new THREE.DirectionalLight(0xffffff, 0.5 * intensity, 100);
            light.position.set(90, 32, 150);
            light.castShadow = true;
            light.shadow.mapSize.width = 2048;
            light.shadow.mapSize.height = 2048;
            light.shadow.camera.near = 10;
            light.shadow.camera.far = 320;
            light.shadow.bias = 0.0001;

            const d = 128 * 2;
            light.shadow.camera.left = -d;
            light.shadow.camera.right = d;
            light.shadow.camera.top = d;
            light.shadow.camera.bottom = -d;

            scene.add(light);

            if (this._params.enableHelper) {
                const helper = new THREE.CameraHelper(light.shadow.camera);
                scene.add(helper);
            }
        }
        if (true) {
            let light = new THREE.PointLight(0x7f7f7f, intensity);
            light.position.set(5, 0, 5);
            camera.add(light);
            scene.add(camera);
        }

        return new THREE.Group();
    }
}
