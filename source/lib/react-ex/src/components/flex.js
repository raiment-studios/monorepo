import React from 'react';

export function Flex({
    className, //
    style,
    children,
    align = 'center',
    direction = 'row',
    dir,
}) {
    direction = direction || dir;

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: direction,
                alignItems: align,
                ...style,
            }}
        >
            {children}
        </div>
    );
}
