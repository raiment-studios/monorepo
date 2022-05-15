import React from 'react';

export function ReadingFrame({ children }) {
    return (
        <div
            style={{
                width: '62rem',
                margin: '1rem auto 2rem',
            }}
        >
            {children}
        </div>
    );
}
