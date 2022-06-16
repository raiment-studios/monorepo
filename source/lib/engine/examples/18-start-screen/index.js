import React from 'react';
import { Flex, useCommonStyles, makeUseStyles, useLocalStorage } from '../../../react-ex';
import { EngineView } from './canvas';

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
            {menu === 'new' ? <NewMenu /> : <MainMenu onChangeMenu={setMenu} />}
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

function NewMenu() {
    const [game, setGame] = useLocalStorage('new-menu-option', 'standard');

    const classes = useMenuStyles();

    const cardData = {
        standard: {
            title: 'Kestrel: Snow Globe - Standard Game',
            id: 'KYRKghcpkM',
        },
        simple: {
            title: 'Simple Game',
            id: 'cdupkaEzH0',
        },
        bare: {
            title: 'Barebones',
            id: 'NKZgUq0I1O',
        },
        experimental: {
            title: 'Experimental',
            id: 'gr9MEAYNif',
        },
    };
    const card = cardData[game];

    return (
        <Dialog top={64}>
            <div style={{ margin: '0 32px', fontWeight: 600 }}>
                <div>Choose starting set:</div>

                <select
                    className={classes.select}
                    value={game}
                    onChange={(evt) => setGame(evt.target.value)}
                >
                    <option value="standard">Standard</option>
                    <option value="simple">Simple</option>
                    <option value="bare">Bare</option>
                    <option value="experimental">Experimental</option>
                </select>

                <div style={{ margin: '24px 0' }}>
                    <div
                        className={`serif ${classes.card}`}
                        style={{
                            width: 400,
                            height: 600,
                            padding: 2,
                            borderRadius: 6,
                            background: 'black',
                            color: 'white',
                            fontWeight: 100,
                            display: 'flex',
                            flexDirection: 'column',
                            flexGrow: 1,
                            backgroundColor: 'black',
                            boxShadow: '2px 2px 10px 0px rgba(0,0,0,0.39)',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                flexGrow: 1,
                                backgroundColor: 'rgba(13,63,93,0.6)',
                            }}
                        >
                            <div
                                style={{
                                    border: 'solid 1px rgba(255,255,255,0.35)',
                                    borderRadius: 4,
                                    padding: '1px 4px',
                                    margin: 2,
                                    backgroundColor: 'rgba(0,0,0,0.05)',
                                    fontSize: 12,
                                }}
                            >
                                {card.title}
                            </div>
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'row',
                                }}
                            >
                                <div
                                    style={{
                                        border: 'solid 1px rgba(255,255,255,0.35)',
                                        borderRadius: 4,
                                        padding: '1px 4px',
                                        margin: 2,
                                        backgroundColor: 'rgba(128,128,255,0.025)',
                                        fontSize: 12,
                                        width: 160,
                                        height: 160,
                                    }}
                                >
                                    IMAGE
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
                                    Extra
                                </div>
                            </div>
                            <div
                                style={{
                                    border: 'solid 1px rgba(255,255,255,0.35)',
                                    borderRadius: 4,
                                    padding: '1px 4px',
                                    margin: 2,
                                    backgroundColor: 'rgba(255,255,255,0.15)',
                                    fontSize: 12,
                                    flexGrow: 1,
                                }}
                            >
                                Text
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
