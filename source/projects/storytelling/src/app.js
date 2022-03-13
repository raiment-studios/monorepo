import React from 'react';
import { useCommonStyles, useLocalStorage } from '@raiment/react-ex';

export function App() {
    useCommonStyles();

    const [story, setStoryImp] = useLocalStorage('story2', {
        rounds: [
            {
                cards: [],
                text: '',
            },
        ],
    });
    return (
        <div style={{ margin: '2rem auto', width: '62em' }}>
            <div className="flex-col">
                <h1>Raiment Studios</h1>
                <h2>Storytelling</h2>
                <p style={{ color: 'red' }}>This is a placeholder.</p>
            </div>
            <div>
                <div className="flex-row">
                    <div className="flex-col" style={{ flex: '1 0 0' }}>
                        <div>Story</div>
                    </div>
                    <div className="flex-col" style={{ flex: '1 0 0' }}>
                        <div>Conflict</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
