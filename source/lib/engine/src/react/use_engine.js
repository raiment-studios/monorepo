import { useState, useEffect } from 'react';
import { Engine } from '../engine/engine';

export function useEngine(initCb) {
    const [engine] = useState(new Engine());

    useEffect(() => {
        initCb({ engine });

        return () => {
            engine.stop();
            engine.dispose();
        };
    }, [engine]);

    return engine;
}
