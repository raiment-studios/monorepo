import React from 'react';

export function Flex({
    className, //
    style,
    children,
    align = 'center',
}) {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: align,
                ...style,
            }}
        >
            {children}
        </div>
    );
}
