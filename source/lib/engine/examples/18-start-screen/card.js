import React from 'react';
import { Flex, makeUseStyles, useLocalStorage, useAsyncEffect } from '../../../react-ex';

const useCardStyles = makeUseStyles({
    card: {
        '& a': {
            color: 'inherit',
            textDecoration: 'none',
        },
    },
});

export function Card({ card }) {
    const classes = useCardStyles();
    const [quoteOpacity, setQuoteOpacity] = React.useState(0.6);

    useAsyncEffect(async (token) => {
        await token.sleep(250);
        setQuoteOpacity(0.9);
    }, []);

    return (
        <div
            className={`serif ${classes.card}`}
            style={{
                width: 400,
                height: 600,
                padding: 0,
                borderRadius: 6,
                background: 'black',
                color: 'white',
                fontWeight: 100,
                display: 'flex',
                flexDirection: 'column',
                flexGrow: 1,
                backgroundColor: 'black',
                boxShadow: '4px 4px 5px 0px rgba(0,0,0,0.29)',

                backgroundImage: `url(${card.image})`,
                backgroundSize: 'cover',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    flexGrow: 1,
                    padding: 4,
                    borderRadius: 6,
                    backgroundColor: 'rgba(13,63,93,0.6)',
                    backdropFilter: 'brightness(40%) blur(16px)',
                }}
            >
                <div
                    className="flex-row-center"
                    style={{
                        border: 'solid 1px rgba(255,255,255,0.35)',
                        borderRadius: 4,
                        padding: '1px 4px',
                        margin: 2,
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        fontSize: 14,
                    }}
                >
                    <div
                        style={{
                            fontWeight: 800,
                        }}
                    >
                        {card.title}
                    </div>
                    <div style={{ flex: '1 0 0' }} />
                    <div
                        style={{
                            fontWeight: 100,
                            fontSize: '80%',
                            opacity: 0.75,
                        }}
                    >
                        {card.subtitle}
                    </div>
                </div>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            border: 'solid 1px rgba(255,255,255,0.35)',
                            borderRadius: 4,
                            margin: 2,
                            backgroundColor: 'rgba(128,128,255,0.025)',
                            fontSize: 12,
                            width: 160,
                            height: 160,

                            flex: '0 0 160px',
                        }}
                    >
                        <div
                            style={{
                                borderRadius: 4,
                                backgroundImage: `url(${card.image})`,
                                backgroundSize: 'cover',
                                imageRendering: 'pixelated',
                                width: 160,
                                height: 160,
                            }}
                        />
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            border: 'solid 1px rgba(255,255,255,0.35)',
                            borderRadius: 4,
                            padding: '1px 4px',
                            margin: 2,
                            backgroundColor: 'rgba(255,255,255,0.025)',
                            fontSize: 14,
                            flexGrow: 1,
                            justifyContent: 'center',
                            opacity: quoteOpacity,
                            transition: 'opacity 3s',

                            cursor: 'pointer',
                            userSelect: 'none',
                        }}
                        onClick={() => alert('TODO: link to encyclopedia')}
                    >
                        <div style={{ margin: '8px 4px 8px', fontStyle: 'italic' }}>
                            <div style={{}}>
                                "It's a beautiful world we live in, right? Except for that deadly
                                maelstrom, of course."
                            </div>
                            <div
                                style={{
                                    textAlign: 'right',
                                }}
                            >
                                — Lain Grenwood
                            </div>
                        </div>
                    </div>
                </div>
                <div
                    className="flex-row-center"
                    style={{
                        border: 'solid 1px rgba(255,255,255,0.35)',
                        borderRadius: 4,
                        padding: '1px 4px',
                        margin: 2,
                        backgroundColor: 'rgba(128,128,128,0.5)',
                        fontSize: 14,
                    }}
                >
                    <div
                        style={{
                            fontWeight: 500,
                        }}
                    >
                        Game Card
                    </div>
                    <div style={{ flex: '1 0 0' }} />
                    <div
                        style={{
                            fontWeight: 100,
                            fontSize: '80%',
                            opacity: 0.75,
                        }}
                    ></div>
                </div>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'stretch',
                        border: 'solid 1px rgba(255,255,255,0.35)',
                        borderRadius: 4,
                        padding: 2,
                        backgroundColor: 'rgba(255,255,255,0.25)',
                        fontSize: 14,
                        flexGrow: 1,
                    }}
                >
                    <div
                        style={{
                            border: 'solid 1px rgba(255,255,255,0.35)',
                            borderRadius: 4,
                            padding: 4,
                            backgroundColor: 'rgba(0,0,0,0.35)',
                            fontSize: 14,
                            flexGrow: 1,
                        }}
                    >
                        <div style={{ marginTop: 12 }}>
                            Begins a game using the standard deck with no mods enabled.
                        </div>
                    </div>
                </div>
                <div
                    style={{
                        border: 'solid 1px rgba(255,255,255,0.35)',
                        borderRadius: 4,
                        padding: '1px 4px',
                        margin: 2,
                        backgroundColor: 'rgba(0,0,0,0.15)',
                        color: '#BBB',
                        fontStyle: 'italic',
                        fontSize: 12,
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                    }}
                >
                    <div
                        style={{
                            fontStyle: 'normal',
                            fontFamily: 'monospace',
                            fontSize: 10,
                        }}
                    >
                        <a
                            style={{
                                cursor: 'pointer',
                                userSelect: 'none',
                            }}
                            onClick={(evt) => {
                                evt.preventDefault();
                                alert('TODO: link to card database');
                            }}
                        >
                            {card.id}
                        </a>
                    </div>
                    <div style={{ flexGrow: 1 }}></div>
                    <div style={{}}>
                        <a href="https://github.com/raiment-studios/monorepo" target="_blank">
                            Raiment Studios 2022
                        </a>
                        <span style={{ display: 'inline-block', width: '8px' }} />
                        <a
                            href="https://creativecommons.org/publicdomain/zero/1.0/"
                            target="_blank"
                        >
                            CC0
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
