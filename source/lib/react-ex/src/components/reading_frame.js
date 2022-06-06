import React from 'react';
import { useCommonStyles } from '../hooks/use_common_styles';

export function ReadingFrame({
    width = '62rem', //
    children,
}) {
    useCommonStyles();

    return (
        <div
            style={{
                width,
                margin: '1rem auto 2rem',
            }}
        >
            {children}
        </div>
    );
}
