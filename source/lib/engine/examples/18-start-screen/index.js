import React from 'react';
import { useCommonStyles, useAsyncEffect } from '../../../react-ex';

import 'glob:$(MONOREPO_ROOT)/source/assets;proto/icons/*.png';
import 'glob:$(MONOREPO_ROOT)/source/assets;proto/sprites/*.png';
import 'glob:$(MONOREPO_ROOT)/source/assets;base/sprites/*.png';

import { simpleSequence } from './simple_sequence';
import { SimulationView } from './simulation_view';
import { IntroMenus } from './intro_menus';

export default function () {
    const [mode, setMode] = React.useState(true ? 'game' : 'menu');
    const [opacity, setOpacity] = React.useState(0.0);
    useCommonStyles();

    useAsyncEffect(async (token) => {
        await token.sleep(100);
        setOpacity(1.0);
    });

    return (
        <div
            style={{
                transition: 'opacity 1000ms',
                opacity,
            }}
        >
            {mode === 'menu' ? (
                <IntroMenus onStartGame={() => setMode('game')} />
            ) : (
                <SimulationView initSequence={simpleSequence} />
            )}
        </div>
    );
}
