import React from 'react';

export function CenterOverlay({ top = 256, children }) {
    return (
        <div
            style={{
                position: 'absolute',
                zIndex: 1000,
                top: `${top}px`,
                left: '50%',
                transform: 'translateX(-50%)',
            }}
            onClick={(evt) => evt.stopPropagation()}
        >
            {children}
        </div>
    );
}

export function Dialog({ top = 256, children }) {
    return (
        <div
            style={{
                position: 'absolute',
                zIndex: 1000,
                top: `${top}px`,
                left: '50%',
                width: '480px',
                transform: 'translateX(-50%)',
            }}
        >
            <div
                style={{
                    padding: '4px 8px 24px 8px',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.9)',
                }}
            >
                {children}
            </div>
        </div>
    );
}

export function DialogCurtain({ onClick, children }) {
    return (
        <div
            style={{
                position: 'fixed',
                zIndex: 999,
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                backdropFilter: 'brightness(50%) blur(16px)',
            }}
            onClick={onClick}
        >
            {children}
        </div>
    );
}
