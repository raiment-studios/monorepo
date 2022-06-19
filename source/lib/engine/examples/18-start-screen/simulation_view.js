import React from 'react';
import { Flex } from '../../../react-ex/src';
import { EngineView } from './engine_view';

export function SimulationView({ initSequence }) {
    return (
        <div
            style={{
                width: '100%',
                minHeight: '100vh',
                backgroundColor: '#777',
            }}
        >
            <div
                style={{
                    width: '100%',
                    aspectRatio: '16 /9',
                    margin: 0,
                    padding: 0,
                    backgroundColor: '#111',
                    color: 'white',
                }}
            >
                <EngineView initSequence={initSequence} />
            </div>
            <Flex
                dir="row"
                style={{
                    backgroundColor: 'rgba(0,13,23,0.35)',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        width: '100%',
                        margin: '2px 4px',
                        padding: 2,
                        border: 'solid 1px rgba(255,255,255,0.25)',
                        borderRadius: 4,
                        backgroundColor: 'rgba(13,63,93,0.35)',
                    }}
                >
                    {new Array(16).fill(0).map((_zero, index) => (
                        <div
                            key={index}
                            style={{
                                width: 32,
                                height: 32,
                                border: 'solid 1px rgba(255,255,255,0.25)',
                                borderRadius: 4,
                                margin: '2px 4px',
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                cursor: 'pointer',
                                userSelect: 'none',
                                backgroundImage: `url(base/sprites/tree-01.png)`,
                                backgroundSize: 'cover',
                                imageRendering: 'pixelated',
                            }}
                        />
                    ))}
                </div>
            </Flex>
            <Flex
                style={{
                    height: '480px',
                    backgroundColor: '#222',
                    alignItems: 'stretch',
                }}
            >
                <Flex
                    dir="col"
                    className="mono px-2px"
                    style={{
                        flex: '2 0 0',
                        background: '#111',
                        color: '#eee',
                        justifyContent: 'stretch',
                        alignItems: 'stretch',
                        fontSize: 18,
                    }}
                >
                    <Flex dir="row" className="py-4px">
                        <div style={{ flex: '0 0 16px' }}>{'>'}</div>
                        <div>cmd</div>
                    </Flex>
                    <div
                        className="mt-4px mb-8px"
                        style={{
                            height: 1,
                            background: 'rgba(255,255,255,0.35)',
                        }}
                    />
                    <Flex dir="row" align="stretch" g={1}>
                        <div style={{ flex: '0 0 16px' }} />
                        <div>results</div>
                    </Flex>
                </Flex>
                <Flex style={{ flex: '0 0 480px' }}>tools</Flex>
            </Flex>
        </div>
    );
}
