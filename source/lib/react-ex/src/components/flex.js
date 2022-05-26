import React from 'react';

export function Flex({
    className, //
    style,
    children,
    align = 'center',
    direction,
    dir,
    onClick,
}) {
    direction = direction || dir || 'row';
    if (direction === 'col') {
        direction = 'column';
    }

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: direction,
                alignItems: align,
                ...style,
            }}
            onClick={onClick}
        >
            {children}
        </div>
    );
}
