import React from 'react';
import * as core from '../../../core/src';
import * as THREE from 'three';
import { useEngine, EngineFrame } from '../../src';

export function EngineView({ initSequence }) {
    const engine = useEngine(() => {
        engine.sequence(initSequence);
    });
    return <EngineFrame engine={engine} />;
}
