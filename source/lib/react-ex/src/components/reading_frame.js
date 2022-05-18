import React from 'react';
import { useCommonStyles } from '../hooks/use_common_styles';

export function ReadingFrame({ children }) {
    useCommonStyles();

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
