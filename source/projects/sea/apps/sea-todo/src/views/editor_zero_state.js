import React from 'react';

export function EditorZeroState({ previousFileHandle, onReload }) {
    return (
        <div
            className="flex-col"
            style={{
                alignItems: 'center',
            }}
        >
            <div style={{ margin: '16px 0 18px' }}>
                <button onClick={onReload}>Reopen {previousFileHandle.name}</button>
            </div>
            <div style={{ margin: '6px 0' }}>
                <button onClick={onReload}>New File</button>
            </div>
            <div style={{ margin: '6px 0' }}>
                <button onClick={onReload}>Open Existing File</button>
            </div>
        </div>
    );
}
