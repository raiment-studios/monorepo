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
});

function NewMenu() {
    const [game, setGame] = React.useState(null);

    const classes = useMenuStyles();

    return (
        <Dialog top={64}>
            <div style={{ margin: '0 32px', fontWeight: 600 }}>
                <div>Choose starting set:</div>

                <select
                    className={classes.select}
                    value={game}
                    onChange={(evt) => setGame(evt.target.value)}
                >
                    <option>Standard</option>
                    <option>Simple</option>
                    <option>Bare</option>
                    <option>Kitchen Sink</option>
                </select>

                <div
                    style={{
                        width: 400,
                        height: 600,
                        background: 'red',
                    }}
                >
                    Some description of the starting card goes here...
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
