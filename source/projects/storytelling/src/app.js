import React from 'react';
import { useCommonStyles } from '@raiment/react-ex';

export function App() {
    useCommonStyles();
    return (
        <div className="flex-col">
            <h1>Raiment Studios</h1>
            <h2>Storytelling</h2>
            <p>This is a placeholder.</p>
        </div>
    );
}
