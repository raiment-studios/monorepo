import React from 'react';
import { Engine } from './engine/engine';
import { RendererHUD } from './renderer_hud/renderer_hud';
import { RendererThree } from './renderer_three/renderer_three';

export function EngineFrame({
    engine = new Engine(), //
    actors = [],
}) {
    const refElem = React.useRef(null);

    React.useEffect(() => {
        engine._renderers['three'] = new RendererThree(refElem.current);
        engine._renderers['hud'] = new RendererHUD(refElem.current);
        engine._actors.push(...actors);

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
