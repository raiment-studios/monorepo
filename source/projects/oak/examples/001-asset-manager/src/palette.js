import React from 'react';
import { Flex, Type, Panel } from '../../../../../lib/react-ex';
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
