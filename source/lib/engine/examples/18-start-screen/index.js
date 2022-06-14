import React from 'react';
import { Flex, useCommonStyles } from '../../../react-ex';
import { EngineView } from './canvas';

export default function () {
    useCommonStyles();
    return (
        <div
            style={{
                width: '100%',
                minHeight: '100vh',
                backgroundColor: '#777',
            }}
        >
            <Dialog />
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
                <EngineView />
            </div>
            <Flex
                dir="row"
                style={{
                    height: '48px',
                    backgroundColor: '#333',
                }}
            >
                toolbar
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

function Dialog() {
    const handleClick = () => {
        alert('click');
    };

    const Button = ({ label }) => {
        return (
            <div
                style={{
                    cursor: 'pointer',
                    userSelect: 'none',
                    padding: '6px 4px',
                    fontWeight: 600,
                }}
                onClick={handleClick}
            >
                {label}
            </div>
        );
    };

    return (
        <div
            style={{
                position: 'absolute',
                zIndex: 1000,
                top: '256px',
                left: '50%',
                width: '480px',
                transform: 'translateX(-50%)',
            }}
        >
            <div
                style={{
                    padding: '4px 8px 24px 8px',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.8)',
                }}
            >
                <div
                    className="serif"
                    style={{
                        marginBottom: '24px',
                    }}
                >
                    <div
                        style={{
                            fontSize: 42,
                            weight: 700,
                            textAlign: 'center',
                        }}
                    >
                        Raiment: Snow Globe
                    </div>
                </div>
                <div style={{ margin: '0 32px' }}>
                    <Button label="New" />
                    <Button label="Continue" />
                    <Button label="Options" />
                    <Button label="Encyclopedia" />
                    <Button label="Support" />
                    <Button label="Credits" />
                </div>
                <div
                    className="serif"
                    style={{
                        marginTop: '24px',
                    }}
                >
                    <div
                        style={{
                            fontSize: 12,
                            fontStyle: 'italic',
                            textAlign: 'center',
                        }}
                    >
                        milestone v0.2 - early prototype
                    </div>
                </div>
            </div>
        </div>
    );
}
