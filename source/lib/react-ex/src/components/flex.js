import React from 'react';
import PropTypes from 'prop-types';

export function Flex({
    className, //
    style,
    children,
    onClick,

    align = 'center',
    direction,
    dir,

    ...rest
}) {
    assertNoUnknownProps(Flex, rest);

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

Flex.propTypes = {
    className: PropTypes.string,
    style: PropTypes.object,
    onClick: PropTypes.func,

    align: PropTypes.string,
    direction: PropTypes.string,
    dir: PropTypes.string,
};

function assertNoUnknownProps(Component, rest) {
    const entries = Object.entries(rest);
    if (entries.length === 0) {
        return;
    }
    for (let [name, value] of entries) {
        console.error(`Unknown property '${name}' with value`, value);
    }
    throw new Error(
        `Unknown properties on Component ${Component.name}: ${Object.keys(rest)
            .map((s) => `'${s}'`)
            .join(', ')}.  See console for details.`
    );
}
