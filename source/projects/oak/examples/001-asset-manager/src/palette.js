import React from 'react';
import { Flex, Type, Panel } from '../../../../../lib/react-ex';
import * as core from '../../../../../lib/core';
import chroma from 'chroma-js';

export function Palette({ palette }) {
    const { colors } = palette.content;
    return (
        <Panel>
            <Flex dir="col">
                <Type h3 mb={16}>
                    {palette.content.title}
                </Type>
                <Flex dir="row">
                    {Object.entries(colors).map(([name, color]) => (
                        <Flex key={name} dir="col">
                            <Flex dir="row" w="10rem" mb={12}>
                                <Box size={16} color={color.value} />
                                <div style={{ width: 8 }} />
                                <Type bold>{name}</Type>
                            </Flex>
                            {[100, 200, 300, 400, 500, 600, 700, 800, 900].map((n) => {
                                const base = chroma(color.value);
                                let h = base.get('hsl.h');

                                const maxShiftR = 30;
                                const maxShiftB = 15;
                                const dred = core.clamp(50 - h, -maxShiftR, maxShiftR);
                                const dblue = core.clamp(266 - h, -maxShiftB, maxShiftB);
                                if (n < 500) {
                                    const a = (500 - n) / 500;
                                    h = h * (1 - a) + (h + dred) * a;
                                } else if (n > 500) {
                                    const a = (n - 500) / 500;
                                    h = h * (1 - a) + (h + dblue) * a;
                                }

                                const mcolor = base
                                    .set('hsl.l', (1000 - n) / 1000)
                                    .set('hsl.h', h)
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
            </Flex>
        </Panel>
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
