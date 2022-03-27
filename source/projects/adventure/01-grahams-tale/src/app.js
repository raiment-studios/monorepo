import React from 'react';
import { useCommonStyles, makeUseStyles, useLocalStorage } from '@raiment/react-ex';
import { makeRNG } from '@raiment/core';
import { last, cloneDeep, get, clone } from 'lodash';
import { Editable } from './components/editable';

const useGlobalStyles = makeUseStyles({
    '@global': {
        html: {
            margin: 0,
            padding: 0,
            height: '100%',
            background: 'white',
        },
        body: {
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            minHeight: '100%',
            maxHeight: '100%',
            minWidth: '100%',
            width: '100%',
            maxWidth: '100%',
            margin: 0,
            padding: 0,
            background: '#000',
            color: '#EEE',
        },
    },
});

export function App() {
    useCommonStyles();
    useGlobalStyles();

    return (
        <div className="flex-col">
            <h1>Graham's Tale</h1>
        </div>
    );
}
