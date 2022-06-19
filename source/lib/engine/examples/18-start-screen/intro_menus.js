import React from 'react';
import { Flex, makeUseStyles, useLocalStorage, useAsyncEffect } from '../../../react-ex/src';
import * as core from '../../../core/src';
import gameCards from 'glob:$(MONOREPO_ROOT)/source/assets;proto/cards/game/*.yaml';
import { Card } from './card';
import { Dialog, DialogCurtain } from './dialog';
import { backgroundSequence } from './background_sequence';
import { Button } from './button';
import { SimulationView } from './simulation_view';

export function IntroMenus({ onStartGame }) {
    const [menu, setMenu] = React.useState('main');
    return (
        <>
            <DialogCurtain>
                {menu === 'new' ? (
                    <NewMenu onChangeMenu={setMenu} onStartGame={onStartGame} />
                ) : (
                    <MainMenu onChangeMenu={setMenu} />
                )}
            </DialogCurtain>
            <SimulationView initSequence={backgroundSequence} />
        </>
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
function NewMenu({ onChangeMenu, onStartGame }) {
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
                <Button label="Start game" onClick={onStartGame} />
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
                        textAlign: 'center',
                    }}
                >
                    <span style={{}}>Kestrel</span>
                </div>
                <div
                    style={{
                        textAlign: 'center',
                    }}
                >
                    Snow Globe (version 0.1)
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
