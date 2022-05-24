import React from 'react';
import { ImageGeometryCache } from '../caches/image_geometry_cache';
import { Engine } from '../engine/engine';
import { RendererHUD } from '../renderer_hud/renderer_hud';
import { RendererThree } from '../renderer_three/renderer_three';
import { RendererTwo } from '../renderer_two/renderer_two';
import { EngineRecorder } from './engine_recorder';

export const EngineFrame = React.memo(function ({
    engine = new Engine(), //
    actors = [],
    recorder = null,
    autoRecord = false,
    recorderDuration = undefined,
    style = {},
}) {
    const refElem = React.useRef(null);

    React.useEffect(() => {
        engine._renderers['three'] = new RendererThree(refElem.current);
        engine._renderers['two'] = new RendererTwo(refElem.current);
        engine._renderers['hud'] = new RendererHUD(refElem.current);
        engine._cache.imageGeometry = new ImageGeometryCache();

        engine._actors.push(...actors);

        engine.start();
        return () => {
            engine.stop();
            engine.dispose();
        };
    }, [refElem.current]);

    return (
        <>
            <div
                ref={refElem}
                style={{
                    width: '100%',
                    aspectRatio: '16 / 9',
                    padding: 0,
                    margin: 0,
                    ...style,
                }}
            />
            {recorder && (
                <EngineRecorder
                    engine={engine}
                    rendererName={recorder}
                    autoStart={autoRecord}
                    duration={recorderDuration}
                />
            )}
        </>
    );
});
