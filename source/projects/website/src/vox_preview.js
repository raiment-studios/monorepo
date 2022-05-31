import React from 'react';
import { useAsyncEffect } from '../../../lib/react-ex';
import {
    EngineFrame,
    useEngine,
    Grid,
    OrbitCamera,
    BasicLighting,
    GroundPlane,
} from '../../../lib/engine/src';

export function VOXPreview({ url }) {
    const engine = useEngine(() => {
        engine.actors.push(
            new Grid(),
            new OrbitCamera({ radius: 32 }),
            new BasicLighting(),
            new GroundPlane()
        );
    });

    useAsyncEffect(
        async (token) => {
            const resp = await fetch(url);
            const blob = await resp.blob();

            const arrayBuffer = await blob.arrayBuffer();
            const dataView = new DataView(arrayBuffer);

            const s0 = dataView.getInt32(0, true);
            console.log({ arrayBuffer, s0 });
        },
        [url]
    );

    return (
        <EngineFrame
            style={{
                width: 400,
                aspectRatio: '1 / 1',
                border: 'solid 1px #CCC',
                borderRadius: 32,
            }}
            engine={engine}
        />
    );
}
