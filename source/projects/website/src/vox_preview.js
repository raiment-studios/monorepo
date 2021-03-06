import React from 'react';
import { Flex } from '../../../lib/react-ex';
import * as THREE from 'three';
import {
    EngineFrame,
    useEngine,
    Grid,
    OrbitCamera,
    BasicLighting,
    VOXActor,
} from '../../../lib/engine/src';
import * as fs from './__runtime/fs';

export function VOXPreview({ url }) {
    const [screenshotDataURI, setScreenshotDataURI] = React.useState(null);

    const engine = useEngine(() => {
        const camera = new OrbitCamera({ radius: 32, offsetZ: 5, periodMS: 4500 });
        const actor = new VOXActor({ url });
        engine.actors.push(new Grid(), new BasicLighting(), camera, actor);

        engine.sequence(function* () {
            // Workaround until the engine architecture is more mature
            while (!actor.__mesh) {
                yield 2;
            }
            // end workaround

            const mesh = actor.__mesh;
            const bbox = new THREE.Box3();
            bbox.setFromObject(mesh);

            const dx = Math.max(Math.abs(bbox.min.x), Math.abs(bbox.max.x));
            const dy = Math.max(Math.abs(bbox.min.y), Math.abs(bbox.max.y));
            const dz = Math.max(0, bbox.max.z);
            camera.radius = Math.sqrt(dx * dx + dy * dy + dz * dz);
            camera.lookAt(0, 0, (dz * 1) / 3);
        });
    });

    return (
        <Flex dir="col">
            <EngineFrame
                style={{
                    width: 800,
                    aspectRatio: '1 / 1',
                }}
                engine={engine}
            />
            <Flex style={{ width: '100%' }}>
                <div
                    style={{
                        margin: 2,
                        padding: 6,
                        border: 'solid 1px #CCC',
                        borderRadius: 6,
                        cursor: 'pointer',
                        userSelect: 'none',
                        whiteSpace: 'nowrap',
                    }}
                    onClick={() => {
                        const canvas = engine.renderers.three.canvas;
                        const dataURI = canvas.toDataURL('image/png');
                        setScreenshotDataURI(dataURI);

                        fs.writeFile(`$(MONOREPO_ROOT)/source/${url}.screenshot.png`, dataURI, {
                            substitute_env: true,
                            encoding: 'data-uri',
                        });
                    }}
                >
                    capture screenshot
                </div>
                {screenshotDataURI && (
                    <>
                        <div style={{ flex: '0 0 1rem' }} />
                        <div>
                            <a
                                href={screenshotDataURI}
                                download={`${url.split('/').pop()}.screenshot.png`}
                            >
                                download
                            </a>
                        </div>
                    </>
                )}
            </Flex>
        </Flex>
    );
}
