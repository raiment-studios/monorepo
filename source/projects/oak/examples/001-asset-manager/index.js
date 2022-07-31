/*!sea:header
    modules:
        simplex-noise: 3
*/

import React from 'react';
import * as core from '../../../../lib/core';
import * as ReactEx from '../../../../lib/react-ex';
import { Flex, makeUseStyles } from '../../../../lib/react-ex';
import chroma from 'chroma-js';

export default function () {
    return (
        <ReactEx.ReadingFrame>
            <h1>Hello World!</h1>
            <Palette />
        </ReactEx.ReadingFrame>
    );
}

const useStyles = makeUseStyles({
    bold: {
        color: '#333',
        fontWeight: 800,
    },
    small: {
        fontSize: 13,
        color: '#555',
    },
});

function Type({ bold, small, v, children }) {
    const classes = useStyles();

    v = bold ? 'bold' : small ? 'small' : v;

    return <span className={classes[v]}>{children}</span>;
}

function Palette() {
    const colors = {
        red: {
            value: '#fc1303',
        },
        orange: {
            value: '#fc9d03',
        },
        blue: {
            value: '#024fcc',
        },
        green: {
            value: '#0acc3e',
        },
        gray: {
            value: '#7a7a82',
        },
    };

    return (
        <Flex dir="col">
            <Flex dir="row">
                {Object.entries(colors).map(([name, color]) => (
                    <Flex key={name} dir="col">
                        <Flex dir="row" w="10rem">
                            <Box size={16} color={color.value} />
                            <div style={{ width: 8 }} />
                            <Type bold>{name}</Type>
                        </Flex>
                        {[100, 200, 300, 400, 500, 600, 700, 800, 900].map((n) => {
                            const mcolor = chroma(color.value)
                                .set('hsl.l', (1000 - n) / 1000)
                                .hex();
                            return (
                                <Flex key={n} dir="row" my={2}>
                                    <Box color={mcolor} />
                                    <div style={{ width: 8 }} />
                                    <Flex dir="col" align="start">
                                        <Type bold>{n}</Type>
                                        <Type small>{mcolor}</Type>
                                    </Flex>
                                </Flex>
                            );
                        })}
                    </Flex>
                ))}
            </Flex>
            <pre>{core.stringifyYAML(colors)}</pre>
        </Flex>
    );
}

function Box({ size = 32, color }) {
    return (
        <div
            style={{
                width: size,
                height: size,
                borderRadius: 4,
                backgroundColor: color,
            }}
        />
    );
}
