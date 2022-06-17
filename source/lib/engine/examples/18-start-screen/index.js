import React from 'react';
import {
    Flex,
    useCommonStyles,
    makeUseStyles,
    useLocalStorage,
    useAsyncEffect,
} from '../../../react-ex';
import { EngineView } from './canvas';
import * as core from '../../../core';

import 'glob:$(MONOREPO_ROOT)/source/assets;proto/icons/*.png';
import 'glob:$(MONOREPO_ROOT)/source/assets;proto/sprites/*.png';
import 'glob:$(MONOREPO_ROOT)/source/assets;base/sprites/*.png';
import gameCards from 'glob:$(MONOREPO_ROOT)/source/assets;proto/cards/game/*.yaml';

export default function () {
    const [menu, setMenu] = useLocalStorage('menu', 'main');
    useCommonStyles();

    return (
        <div
            style={{
                width: '100%',
                minHeight: '100vh',
                backgroundColor: '#777',
            }}
        >
            {menu === 'new' ? (
                <NewMenu onChangeMenu={setMenu} />
            ) : (
                <MainMenu onChangeMenu={setMenu} />
            )}
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

const useButtonStyles = makeUseStyles({
    button: {
        margin: '6px 0',
        padding: '6px 8px 6px 12px',
        border: 'solid 1px rgba(0,0,0,.1)',
        borderRadius: 8,
        fontWeight: 600,
        cursor: 'pointer',
        userSelect: 'none',
        backgroundColor: 'rgba(0, 0, 0, 0.02)',

        '&:hover': {
            color: '#26B',
            backgroundColor: 'rgba(0, 0, 255, 0.02)',
        },
    },
});

function Button({ label, onClick = () => alert('Not yet implemented') }) {
    const classes = useButtonStyles();
    return (
        <div className={classes.button} onClick={onClick}>
            {label}
        </div>
    );
}

function Dialog({ top = 256, children }) {
    return (
        <div
            style={{
                position: 'absolute',
                zIndex: 1000,
                top: `${top}px`,
                left: '50%',
                width: '480px',
                transform: 'translateX(-50%)',
            }}
        >
            <div
                style={{
                    padding: '4px 8px 24px 8px',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.9)',
                }}
            >
                {children}
            </div>
        </div>
    );
}

const useMenuStyles = makeUseStyles({
    select: {
        display: 'block',
        width: '100%',
        margin: '6px 0',
        padding: '6px 8px 6px 12px',
        border: 'solid 1px rgba(0,0,0,.1)',
        borderRadius: 8,
        fontFamily: 'inherit',
        fontSize: 'inherit',
        fontWeight: 'inherit',
        cursor: 'pointer',
        userSelect: 'none',
        backgroundColor: 'transparent',

        '&:hover': {
            color: '#26B',
            backgroundColor: 'rgba(0, 0, 255, 0.02)',
        },
    },
    card: {
        '& a': {
            color: 'inherit',
            textDecoration: 'none',
        },
    },
});

function NewMenu({ onChangeMenu }) {
    const [game, setGame] = useLocalStorage('new-menu-option', 'standard');
    const [cardSet, setCardSet] = React.useState(null);

    const classes = useMenuStyles();

    useAsyncEffect(async (token) => {
        const results = Object.fromEntries(
            await Promise.all(
                gameCards.map(async (url) => {
                    const resp = await fetch(url);
                    const text = await resp.text();
                    const obj = core.parseYAML(text);
                    return [url, obj];
                })
            )
        );
        token.check();

        setCardSet(results);
    }, []);

    if (!cardSet) {
        return null;
    }

    const card = cardSet[game] || Object.values(cardSet)[0];

    return (
        <Dialog top={64}>
            <div style={{ margin: '0 32px', fontWeight: 600 }}>
                <Flex dir="row" style={{ marginBottom: 24 }}>
                    <div
                        style={{
                            fontWeight: 600,
                            fontSize: '120%',
                        }}
                    >
                        Begin New Game
                    </div>
                    <div style={{ flex: '1 0 0' }} />
                    <div>
                        <Button label="< Back" onClick={() => onChangeMenu('main')} />
                    </div>
                </Flex>
                <div>Choose starting set:</div>

                <select
                    className={classes.select}
                    value={game}
                    onChange={(evt) => setGame(evt.target.value)}
                >
                    {Object.entries(cardSet)
                        .sort(([_k0, v0], [_k1, v1]) => v0.order - v1.order)
                        .map(([url, value]) => (
                            <option key={url} value={url}>
                                {value.title}
                            </option>
                        ))}
                </select>

                <div style={{ margin: '24px 0' }}>
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
                                        border: 'solid 1px rgba(255,255,255,0.35)',
                                        borderRadius: 4,
                                        padding: '1px 4px',
                                        margin: 2,
                                        backgroundColor: 'rgba(255,255,255,0.025)',
                                        fontSize: 12,
                                        flexGrow: 1,
                                    }}
                                >
                                    <div style={{ margin: '8px 4px 8px', fontStyle: 'italic' }}>
                                        <div style={{}}>
                                            "It's a beautiful world we live in, right? Except for
                                            that deadly maelstrom, of course."
                                        </div>
                                        <div style={{ textAlign: 'right' }}>— Lain Grenwood</div>
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
                                    padding: '1px 4px',
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
                                        padding: '1px 4px',
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
                                    <a
                                        href="https://github.com/raiment-studios/monorepo"
                                        target="_blank"
                                    >
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
                </div>
                <Button label="Start game" />
            </div>
        </Dialog>
    );
}

function MainMenu({ onChangeMenu }) {
    return (
        <Dialog>
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
                <Button label="New" onClick={() => onChangeMenu('new')} />
                <Button
                    label="Continue"
                    onClick={() => alert('Save/Continue not yet implemented')}
                />
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
        </Dialog>
    );
}
