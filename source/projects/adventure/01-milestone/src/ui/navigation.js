import React from 'react';

export function Navigation() {
    return (
        <div
            className="flex-row-center"
            style={{
                margin: 0,
                padding: '6px 12px',
                backgroundColor: '#333',
                fontSize: 14,
                fontWeight: 100,
            }}
        >
            <div style={{ fontSize: 18, fontWeight: 900 }}>Graham's Quest</div>
            <div style={{ flex: '0 0 3rem ' }} />
            <div style={{}}>Game</div>
            <div style={{ flex: '0 0 1rem ' }} />
            <div style={{}}>Editor</div>
            <div style={{ flex: '0 0 1rem ' }} />
            <div style={{}}>Options</div>
            <div style={{ flex: '0 0 1rem ' }} />
            <div style={{}}>About</div>
        </div>
    );
}
