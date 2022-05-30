import React from 'react';
import { ImageGeometryCache } from '../caches/image_geometry_cache';
import { Engine } from '../engine/engine';
import { RendererHUD } from '../renderer_hud/renderer_hud';
import { RendererReact } from '../renderer_react/renderer_react';
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
    const refElemRect = React.useRef(null);

    const handleKeyDown = makeHandleKeyDown(engine);
    const handleClickImp = makeHandleClickImp(engine, refElemRect);

    React.useEffect(() => {
        const clientRect = refElem.current.getBoundingClientRect();
        refElemRect.current = clientRect;

        engine._hostElement = refElem.current;
        engine._renderers['three'] = new RendererThree(refElem.current);
        engine._renderers['two'] = new RendererTwo(refElem.current);
        engine._renderers['react'] = new RendererReact(refElem.current, engine);
        engine._renderers['hud'] = new RendererHUD(refElem.current);
        engine._cache.imageGeometry = new ImageGeometryCache();

        window.addEventListener('keydown', handleKeyDown);

        engine._actors.push(...actors);

        engine.start();
        return () => {
            window.removeEventListener('keydown', handleKeyDown);

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
                onClick={handleClickImp}
                onContextMenu={handleClickImp}
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

function makeHandleKeyDown(engine) {
    return function (evt) {
        // Defer to an active element if there is one
        if (!!document.activeElement && document.activeElement !== document.body) {
            return;
        }
        evt.preventDefault();
        evt.stopPropagation();

        let eventName;
        if (evt.which === 16) {
            // The default logic would produce "SHIFT+SHIFT"
            eventName = 'SHIFT';
        } else if (evt.which === 17) {
            eventName = 'CTRL';
        } else if (evt.which === 18) {
            eventName = 'ALT';
        } else {
            eventName = `${evt.altKey ? 'ALT+' : ''}${evt.ctrlKey ? 'CTRL+' : ''}${
                evt.shiftKey ? 'SHIFT+' : ''
            }${evt.key.toUpperCase()}`;
        }
        engine.events.fire(eventName);
        engine.journal.message(`keydown = ${eventName}`);
    };
}

function makeHandleClickImp(engine, refElemRect) {
    return function (evt) {
        evt.preventDefault();
        evt.stopPropagation();

        // Transform the DOM input into normalized device coordinates and
        // pixel coordinates within the canvas.
        const clientRect = refElemRect.current;
        const x = Math.floor(evt.clientX - clientRect.left);
        const y = Math.floor(evt.clientY - clientRect.top);
        const params = {
            button: evt.button,
            px: x,
            py: y,
            nx: (x / clientRect.width) * 2 - 1,
            ny: -(y / clientRect.height) * 2 + 1,
            clientX: evt.clientX,
            clientY: evt.clientY,
            clientRect: clientRect,
        };

        engine.events.fire('click', params);

        const result = engine.renderers.three.raycast(params.nx, params.ny, 2);
        if (result) {
            engine.events.fire('intersection', result);
        }
    };
}
