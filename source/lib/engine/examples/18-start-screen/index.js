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
import { Card } from './card';
import { Dialog } from './dialog';

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
        console.log({ gameCards, results });
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
                        .map(([url, value], index) => (
                            <option key={url} value={url}>
                                {value.title}
                            </option>
                        ))}
                </select>

                <div style={{ margin: '24px 0' }}>
                    <Card card={card} />
                </div>
                <Flex dir="row" style={{ margin: '4px 0' }}>
                    <div>Maelstrom seed:</div>
                    <div style={{ flex: '0 0 2rem' }}></div>
                    <div>{Math.floor(Math.random() * 8192)}</div>
                </Flex>
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
