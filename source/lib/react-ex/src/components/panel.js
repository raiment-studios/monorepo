import React from 'react';

export function Panel({ children }) {
    return (
        <div
            style={{
                border: 'solid 1px #CCC',
                borderRadius: 8,
                padding: 24,
                margin: '16px 0px',
                boxShadow: '2px 2px 4px 6px rgba(0,0,0,0.015)',
            }}
        >
            {children}
        </div>
    );
}
