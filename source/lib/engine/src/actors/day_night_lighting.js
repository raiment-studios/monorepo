import * as THREE from 'three';
import chroma from 'chroma-js';

export class DayNightLighting {
    constructor(params) {
        this._params = {
            intensity: 1.0,
            skyFade: 0.0,
            speed: 1,
            nightSpeed: null,
            ...params,
        };

        if (this._params.nightSpeed === null) {
            this._params.nightSpeed = this._params.speed * 1.5;
        }

        this._lightSun = null;
        this._light2 = null;
        this._sun = null;

        this._timeOfDay = 9;
    }

    update({ engine }) {
        const { speed, nightSpeed } = this._params;

        const { renderer } = engine.renderers.three;

        const angle = ((this._timeOfDay - 6) * Math.PI) / 12;
        const dist = 512;
        const x = dist * Math.cos(angle);
        const z = dist * Math.sin(angle);
        const y = dist / 5 + Math.sin(angle * 2);

        const amount = (z <= 0.0 ? nightSpeed : speed) * 0.001;

        this._timeOfDay += amount;
        if (this._timeOfDay >= 24) {
            this._timeOfDay -= 24;
        }

        if (this._lightSun) {
            this._lightSun.intensity = Math.max(0, (0.75 * z) / dist);
            this._lightSun.castShadow = this._lightSun.intensity > 0.05;
            this._lightSun.position.set(x, y, z);
            this._sun.position.set(x, y, z);
            this._light2.intensity = Math.max(0, (0.25 * z) / dist);

            const skyColors = [
                [0, '#111'],
                [4, '#111'],
                [5, '#8a8170'],
                [7.5, '#abd6f7'],
                [10, '#6086f0'],
                [12, '#3060C0'],
                [16, '#3060C0'],
                [19, '#0e0942'],
                [21, '#333'],
                [24, '#111'],
            ];

            // first nearest two and distance to blend
            let c0;
            let c1;
            let color;
            for (let i = 0; i < skyColors.length; i++) {
                const [time, value] = skyColors[i];
                if (this._timeOfDay < time) {
                    const j = (i + skyColors.length - 1) % skyColors.length;
                    c0 = skyColors[j][1];
                    c1 = skyColors[i][1];

                    const d0 = Math.abs(this._timeOfDay - skyColors[j][0]);
                    const d1 = Math.abs(skyColors[i][0] - this._timeOfDay);
                    const a = d0 / (d0 + d1);
                    color = chroma.mix(c0, c1, a);
                    break;
                }
            }

            //const skyFade = Math.max(0, 1 - (6 - Math.abs(this._timeOfDay - 12)) / 6);
            //const color = chroma.mix('#3060C0', 'black', skyFade);
            renderer.setClearColor(color.hex());
        }
    }

    initMesh({ engine }) {
        const { scene, renderer, camera } = engine.renderers.three;
        const { intensity, skyFade } = this._params;

        scene.fog = new THREE.Fog(0x3333cc, 10, 500);

        const color = chroma.mix('#3060C0', 'black', skyFade);
        renderer.setClearColor(color.hex());

        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap

        {
            const sphereGeometry = new THREE.SphereGeometry(16, 32, 32);
            const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xfff25e });
            const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
            sphere.position.set(0, 0, 28);
            scene.add(sphere);
            this._sun = sphere;
        }
        {
            const light = new THREE.AmbientLight(0x202020, intensity);
            scene.add(light);
        }
        {
            const light = new THREE.HemisphereLight(0x404040, 0xffffcc, 0.25 * intensity);
            scene.add(light);
            this._light2 = light;
        }
        {
            const light = new THREE.DirectionalLight(0xffffff, 0.5 * intensity, 100);
            light.position.set(20, 16, 22);
            light.castShadow = true;
            light.shadow.camera.near = 1;
            light.shadow.camera.far = 400;
            light.shadow.bias = 0.0001;

            const d = 150;
            light.shadow.camera.left = -d;
            light.shadow.camera.right = d;
            light.shadow.camera.top = d;
            light.shadow.camera.bottom = -d;

            light.shadow.mapSize.width = 2 * 1024;
            light.shadow.mapSize.height = 2 * 1024;

            scene.add(light);

            //const helper = new THREE.CameraHelper(light.shadow.camera);
            //scene.add(helper);

            this._lightSun = light;
        }
        if (true) {
            let light = new THREE.PointLight(0x7f7f7f, intensity * 0.25);
            light.position.set(5, 0, 5);
            camera.add(light);
            scene.add(camera);
        }

        return new THREE.Group();
    }
}
