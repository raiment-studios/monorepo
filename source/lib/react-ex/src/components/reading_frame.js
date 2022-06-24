import React from 'react';
import { useCommonStyles } from '../hooks/use_common_styles';

export function ReadingFrame({
    className,
    width = '62rem', //
    children,
    ...rest
}) {
    console.assert(Object.keys(rest).length === 0, 'Unexpected properties', rest);

    useCommonStyles();

    return (
        <div
            className={className}
            style={{
                width,
                margin: '1rem auto 2rem',
            }}
        >
            {children}
        </div>
    );
}
