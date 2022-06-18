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
                <Flex style={{ flex: '2 0 0', background: '#111', color: '#eee' }}>cmd</Flex>
                <Flex style={{ flex: '0 0 480px' }}>tools</Flex>
            </Flex>
        </div>
    );
}
