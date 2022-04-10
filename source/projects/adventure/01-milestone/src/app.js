import React from 'react';
import { useCommonStyles, makeUseStyles, useLocalStorage, useAsyncEffect } from '@raiment/react-ex';
import { generate, makeRNG, stringifyYAML } from '@raiment/core';
import { last, cloneDeep, get, clone, isArray } from 'lodash';
import { Game } from './game';

const useGlobalStyles = makeUseStyles({
    '@global': {
        html: {
            margin: 0,
            padding: 0,
            height: '100%',
            background: 'white',
        },
        body: {
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            minHeight: '100%',
            maxHeight: '100%',
            minWidth: '100%',
            width: '100%',
            maxWidth: '100%',
            margin: 0,
            padding: 0,
            background: '#000',
            color: '#EEE',
        },
        '#client': {
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
        },
    },
});

async function loadImage(src) {
    return new Promise((resolve, reject) => {
        let img = new Image();
        img.onload = () => resolve(img);
        img.onerror = (err) => {
            console.error(err);
            reject(err);
        };
        img.src = src;
    });
}

const tiles = {
    grass: {
        offset: [5, 0],
        alpha: 0.25,
    },
    tree: {
        offset: [0, 1],
    },

    player: {
        offset: [26, 1],
    },
};

const areas = {
    forest: {
        tiles: [],
        map: [],
    },
};

function Map({ game, round }) {
    const refCanvas = React.useRef(null);

    useAsyncEffect(
        async (token) => {
            const canvas = refCanvas.current;

            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;

            const img = await loadImage('/assets/tiles/colored-transparent_packed.png');
            token.check();

            function drawTile(tile, tx, ty) {
                const sx = tile.offset[0] * 16;
                const sy = tile.offset[1] * 16;
                ctx.globalAlpha = tile.alpha || 1.0;
                ctx.drawImage(img, sx, sy, 16, 16, tx * 32, ty * 32, 32, 32);
                ctx.globalAlpha = 1.0;
            }

            ctx.fillStyle = '#033';
            ctx.fillRect(0, 0, 640, 640);

            for (let ty = 0; ty < 20; ty++) {
                for (let tx = 0; tx < 20; tx++) {
                    drawTile(tiles.grass, tx, ty);
                }
            }

            const rng = makeRNG(game.seed);
            const trees = generate(8, () => [rng.rangei(0, 20), rng.rangei(0, 20)]);
            for (let [tx, ty] of trees) {
                drawTile(tiles.tree, tx, ty);
            }

            drawTile(tiles.player, game.player.position.x, 20 - game.player.position.y);
        },
        [round]
    );

    return (
        <div
            className="flex-row"
            style={{
                flex: '0 0 0',
                height: 640,
            }}
        >
            <div
                style={{
                    flex: '0 0 0',
                }}
            >
                <canvas
                    ref={refCanvas}
                    width={640}
                    height={640}
                    style={{
                        imageRendering: 'pixelated',
                    }}
                />
            </div>
        </div>
    );
}

export function App() {
    const [game] = React.useState(new Game());
    const [round, setRound] = React.useState(game.round);

    useCommonStyles();
    useGlobalStyles();

    const handlers = {
        keydown: (evt) => {
            // Defer to an active element if there is one
            if (!!document.activeElement && document.activeElement !== document.body) {
                return;
            }
            evt.preventDefault();
            evt.stopPropagation();

            ((
                {
                    w: () => game.command('move', 0, 1),
                    s: () => game.command('move', 0, -1),
                    a: () => game.command('move', -1, 0),
                    d: () => game.command('move', 1, 0),
                }[evt.key] || (() => {})
            )());

            setRound(game.round);
        },
    };

    React.useEffect(() => {
        for (let [name, handler] of Object.entries(handlers)) {
            window.addEventListener(name, handler);
        }
        return () => {
            for (let [name, handler] of Object.entries(handlers)) {
                window.removeEventListener(name, handler);
            }
        };
    });

    return (
        <div className="flex-col" style={{ flex: '1 0 0' }}>
            <Navigation />
            <div className="flex-row">
                <div
                    style={{
                        margin: 1,
                        padding: 2,
                        backgroundColor: '#444',
                        borderRadius: 4,
                    }}
                >
                    <Map game={game} round={game.round} />
                </div>

                <div
                    className="flex-col"
                    style={{
                        width: 480,
                    }}
                >
                    <div style={{}}>
                        <Cards />
                    </div>
                    <Conditions game={game} round={game.round} />
                    <div style={{ flex: '1 0 0' }}>free space</div>
                </div>
            </div>
            <Panel />
        </div>
    );
}

function Conditions({ game }) {
    return (
        <div>
            Time of day
            <br />
            Weather
            <br />
            Position: {game.player.position.x}, {game.player.position.y}
            <br />
            <div>Round: {game.round}</div>
            <div>Seed: {game.seed}</div>
        </div>
    );
}

function Navigation() {
    return (
        <div
            className="flex-row-center"
            style={{
                margin: 0,
                padding: '6px 12px',
                backgroundColor: '#333',
                fontSize: 14,
                fontWeight: 100,
            }}
        >
            <div style={{ fontSize: 18, fontWeight: 900 }}>Graham's Quest</div>
            <div style={{ flex: '0 0 3rem ' }} />
            <div style={{}}>Game</div>
            <div style={{ flex: '0 0 1rem ' }} />
            <div style={{}}>Editor</div>
            <div style={{ flex: '0 0 1rem ' }} />
            <div style={{}}>Options</div>
            <div style={{ flex: '0 0 1rem ' }} />
            <div style={{}}>About</div>
        </div>
    );
}

function Tab({ label, active = false, onClick }) {
    return (
        <div
            style={{
                margin: '0 0.5rem',
                padding: '0.25rem 1rem',
                border: 'solid 1px #555',
                borderRadius: 2,
                userSelect: 'none',
                cursor: 'pointer',
                backgroundColor: active ? '#666' : 'transparent',
            }}
            onClick={onClick}
        >
            {label}
        </div>
    );
}

function CharacterPanel() {
    return null;
}
function InventoryPanel() {
    return null;
}
function SkillsPanel() {
    return null;
}
function MapPanel() {
    return null;
}
function JournalPanel() {
    return null;
}

function generateCard(desc, seed = Math.floor(Math.random() * 8192)) {
    const card = {
        name: 'Unnamed',
        type: 'Any',
    };

    const rng = makeRNG(seed);

    if (desc.name !== undefined) {
        card.name = desc.name;
    }
    if (desc.type !== undefined) {
        card.type = desc.type;
    }
    if (desc.quote !== undefined) {
        if (isArray(desc.quote)) {
            card.quote = rng.select(desc.quote);
        }
    }

    return card;
}

function GenerationCard({ card }) {
    const [seed, setSeed] = useLocalStorage('seed-7347h', Math.floor(Math.random() * 8192));
    const instance = generateCard(card, seed);

    return (
        <div
            style={{
                margin: '2rem auto',
                width: '62rem',
                minHeight: '62rem',
                padding: 8,
                background: '#333',
                border: 'solid 1px #555',
                borderRadius: 8,
            }}
        >
            <div style={{ marginBottom: '1rem' }}>
                <div className="flex-row-center">
                    <div style={{ fontSize: 24, fontWeight: 600 }}>{card.name}</div>
                </div>
                <div style={{ height: 16 }} />
                <div>This is where general description text of the generation itself goes</div>
            </div>
            <div className="flex-col">
                <div>
                    <pre>{stringifyYAML(card)}</pre>
                </div>
                <div className="flex-row">
                    <div style={{ flex: '1 0 0' }}>
                        <pre>{stringifyYAML(instance)}</pre>
                    </div>
                    <div
                        style={{
                            padding: '2rem',
                            minWidth: '300px',
                            backgroundColor: 'rgba(0,0,0,.5)',
                            border: 'solid 1px rgba(255, 255, 255, .1)',
                            borderRadius: 8,
                        }}
                    >
                        <div
                            className="flex-col"
                            style={{
                                flex: '0 0 400px',
                            }}
                        >
                            <div className="flex-row">
                                <div style={{ flex: '1 0 0' }} />
                                <CardFull card={instance} />
                                <div style={{ flex: '1 0 0' }} />
                            </div>
                            <div
                                style={{
                                    margin: '1rem 0',
                                }}
                            >
                                <div>Seed {seed}</div>
                            </div>
                        </div>

                        <div style={{ flex: '0 0 1rem' }} />
                    </div>
                </div>
            </div>
        </div>
    );
}

function DeckPanel() {
    const [cards, setCards] = React.useState(null);
    const [filter, setFilter] = useLocalStorage('filter-hweh3', null);
    const [focusCard, setFocusCard] = useLocalStorage('focus-card-j48sd', null);

    useAsyncEffect(async (token) => {
        const resp = await fetch('/assets/cards/base.json');
        const json = await resp.json();

        token.check();
        console.log(json.cards);
        setCards(json.cards);
    });

    return (
        <div className="flex-row" style={{}}>
            <div
                style={{
                    flex: '0 0 12rem',
                    backgroundColor: '#333',
                    border: 'solid 1px #111',
                    borderRadius: 4,
                    padding: '6px 12px 6px 8px',
                }}
            >
                <div>All</div>
                <div>Rules</div>
                <div>Characters</div>
                <div>Items</div>
                <div>Regions</div>
                <div>Areas</div>
                <div>Locations</div>
                <div>Flora</div>
                <div>Fauna</div>
                <div>History</div>
                <div>Politics</div>
            </div>
            <div style={{ flex: '0 0 0.5rem' }} />
            <div
                style={{
                    flex: '0 0 62rem',
                    backgroundColor: '#333',
                    border: 'solid 1px #111',
                    borderRadius: 4,
                    padding: '6px 12px 6px 8px',
                }}
            >
                <p>The Deck describes the set of generation cards used in the game</p>
                <p>
                    This should include a search, filter, and random selection. It shows the cards.
                    Potentially allows them to be edited.
                </p>
                <p>Should all filter by pack as well</p>

                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                    }}
                >
                    {(cards || []).map((card) => (
                        <div
                            key={card.name}
                            style={{
                                margin: 8,
                            }}
                        >
                            <div
                                key={card.name}
                                className="flex-col"
                                style={{
                                    boxSizing: 'content-box',
                                    fontSize: 10,
                                    width: 120,
                                    height: 160,
                                    background: 'rgba(255,255,255,0.05)',
                                    border: 'solid 1px #666',
                                    borderRadius: 6,
                                    padding: 1,
                                    cursor: 'pointer',
                                    userSelect: 'none',
                                }}
                                onClick={() => setFocusCard(card)}
                            >
                                <div
                                    style={{
                                        margin: 1,
                                    }}
                                >
                                    <div
                                        style={{
                                            padding: 2,
                                            background: '#555',
                                            borderRadius: 4,
                                        }}
                                    >
                                        {card.name}
                                    </div>
                                    <div
                                        style={{
                                            padding: '1px 2px',
                                            fontSize: 7,
                                        }}
                                    >
                                        {card.type || ' '}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            {focusCard && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        bottom: 0,
                        right: 0,
                        height: '100vh',
                        overflow: 'hidden',
                        background: 'rgba(0,0,0,.65)',
                        backdropFilter: 'blur(6px)',
                    }}
                    onClick={() => setFocusCard(null)}
                >
                    <div
                        style={{
                            position: 'relative',
                            width: '62rem',
                            minWidth: '62rem',
                            maxWidth: '62rem',
                            margin: '0 auto',
                        }}
                        onClick={(evt) => {
                            evt.stopPropagation();
                        }}
                    >
                        <GenerationCard card={focusCard} />
                    </div>
                </div>
            )}
        </div>
    );
}

function Panel() {
    const [activePanel, setActivePanel] = useLocalStorage('active-panel-2we74q', 'interact');

    const tabs = [
        'Interact',
        'Character',
        'Inventory',
        'Skills',
        'Map',
        'Journal',
        'Encyclopedia',
        'Deck',
    ];

    const ActivePanelComponent =
        {
            interact: Interact,
            character: CharacterPanel,
            inventory: InventoryPanel,
            skills: SkillsPanel,
            map: MapPanel,
            journal: JournalPanel,
            encyclopedia: Encyclopedia,
            deck: DeckPanel,
        }[activePanel] || (() => null);

    return (
        <div className="flex-col" style={{ flex: '1 0 0' }}>
            <div
                className="flex-row-center"
                style={{
                    margin: 0,
                    padding: '6px 12px',
                    backgroundColor: '#333',
                    fontSize: 14,
                    fontWeight: 100,
                }}
            >
                {tabs.map((tab, index) => (
                    <Tab
                        key={tab}
                        label={tab}
                        active={tab.toLowerCase() == activePanel}
                        onClick={() => setActivePanel(tab.toLowerCase())}
                    />
                ))}
            </div>
            <div
                className="flex-col"
                style={{
                    flex: '1 0 0',
                    backgroundColor: '#555',
                    padding: '1rem',
                }}
            >
                <ActivePanelComponent />
            </div>
        </div>
    );
}

function Interact() {
    return (
        <div className="flex-row">
            <div className="flex-col" style={{ flex: '0 0 42rem' }}>
                <div
                    style={{
                        fontFamily: 'monospace',
                        height: '16rem',
                        borderRadius: 8,
                        padding: 16,
                        color: 'white',
                        backgroundColor: 'black',
                    }}
                >
                    <div>
                        Welcome to <strong>Graham's World</strong>, a game prototype set in the
                        world of Kestrel.
                    </div>
                </div>
                <input
                    type="text"
                    placeholder="Enter a command: [verb] [object] [indirect object]"
                    style={{
                        fontFamily: 'monospace',
                        borderRadius: 8,
                        marginTop: 2,
                        padding: 8,
                        color: 'white',
                        backgroundColor: 'black',
                        outline: 'none',
                        border: 'none',
                    }}
                />
            </div>
            <div style={{ flex: '0 0 12px' }} />
            <div className="flex-col">
                <div
                    style={{
                        background: '#666',
                        borderRadius: 8,
                        padding: 16,
                    }}
                >
                    Card piles
                    <div className="flex-row">
                        <div
                            style={{
                                width: 64,
                                height: 80,
                                margin: 8,
                                border: 'solid 1px #CCC',
                                borderRadius: 4,
                            }}
                        />
                        <div
                            style={{
                                width: 64,
                                height: 80,
                                margin: 8,
                                border: 'solid 1px #CCC',
                                borderRadius: 4,
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

function Encyclopedia() {
    return (
        <div className="flex-row" style={{}}>
            <div
                style={{
                    flex: '0 0 12rem',
                    backgroundColor: '#333',
                    border: 'solid 1px #111',
                    borderRadius: 4,
                    padding: '6px 12px 6px 8px',
                }}
            >
                <div>Characters</div>
                <div>Items</div>
                <div>Regions</div>
                <div>Areas</div>
                <div>Locations</div>
                <div>Flora</div>
                <div>Fauna</div>
                <div>History</div>
                <div>Politics</div>
            </div>
            <div style={{ flex: '0 0 0.5rem' }} />
            <div
                style={{
                    flex: '0 0 62rem',
                    backgroundColor: '#333',
                    border: 'solid 1px #111',
                    borderRadius: 4,
                    padding: '6px 12px 6px 8px',
                }}
            >
                <p>
                    The Encyclopedia describes the current, created world - the output of the draw
                    cards and progression of the world. It is dynamic and differs every playthrough
                </p>
                <p>The Deck by comparison describes the set of generation cards used in the game</p>
            </div>
        </div>
    );
}

function CardFull({ card }) {
    const image = '/assets/images/galthea-forest.png';
    const imageBrightness = 0.17;

    let quote = card.quote;
    if (quote) {
        if (quote.match(/--/)) {
            const p = quote.split(/--/);
            quote = `“${p[0].trim()}” — ${p[1].trim()}`;
        }
    }

    return (
        <div
            className="flex-col serif"
            style={{
                flex: '1 0 0',
                border: 'solid 1px #444',
                borderRadius: 8,
                boxSizing: 'border-box',
                width: 320,
                minWidth: 320,
                maxWidth: 320,
                height: 400,
                minHeight: 480,
                maxHeight: 480,

                backgroundColor: '#333',
                backgroundImage: [
                    `linear-gradient(rgba(50, 0, 0, 0.15), rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0.95))`,
                    `url("${image}")`,
                ].join(', '),
                backgroundSize: 'cover',
            }}
        >
            <div
                className="flex-row"
                style={{
                    margin: '2px 2px 1px 2px',
                    padding: '0 4px 1px 4px',
                    alignItems: 'start',
                    backgroundColor: 'rgba(0, 0,0,.55)',
                    fontSize: 14,
                    borderRadius: 2,
                    backdropFilter: 'blur(8px)',
                }}
            >
                <div className="flex-col">
                    <div style={{ fontWeight: 600 }}>Galthea Forest</div>
                    <div
                        style={{
                            opacity: 0.8,
                            fontSize: 11,
                            fontWeight: 100,
                            fontStyle: 'italic',
                        }}
                    >
                        Area
                    </div>
                </div>
                <div style={{ flex: '1 0 0' }} />
                <div style={{ opacity: 0.8, fontSize: 11, fontWeight: 100 }}>⚅ 1000</div>
            </div>
            <div className="flex-row-center" style={{ justifyContent: 'center', marginTop: 2 }}>
                <div
                    className="flex-col"
                    style={{
                        boxSizing: 'content-box',
                        border: 'solid 2px rgba(80,80,80,0.95)',
                        width: 300,
                        minWidth: 300,
                        maxWidth: 300,
                        height: 200,
                        minHeight: 200,
                        maxHeight: 200,
                        backgroundColor: '#555',
                        backgroundSize: 'cover',
                        backgroundImage: `url(${image})`,
                        imageRendering: 'pixelated',
                        justifyContent: 'stretch',
                        alignItems: 'stretch',
                    }}
                ></div>
            </div>
            <div className="flex-col" style={{ flex: '1 0 0', alignSelf: 'stretch' }}>
                <div
                    className="flex-row"
                    style={{
                        margin: '2px 2px 1px 2px',
                        padding: '0 4px 1px 4px',
                        alignItems: 'start',
                        backgroundColor: 'rgba(0, 0,0,.45)',
                        fontSize: 11,
                        fontWeight: 100,
                        borderRadius: 2,
                        border: 'solid 1px rgba(127, 127, 127, 0.85)',
                    }}
                >
                    <div></div>
                    <div style={{ flex: '1 0 0' }} />
                    <div
                        style={{
                            opacity: 0.5,
                            fontStyle: 'italic',
                            fontWeight: 100,
                            fontSize: 9,
                        }}
                    >
                        core
                    </div>
                </div>
                <div
                    className="flex-col"
                    style={{
                        flex: '1 0 0',
                        margin: '2px 2px 1px 2px',
                        padding: '4px 4px 1px 4px',
                        lineHeight: '0.80rem',
                        alignItems: 'start',
                        backgroundColor: 'rgba(0, 0,0,.45)',
                        color: '#DDD',
                        fontSize: 12,
                        fontWeight: 100,
                        borderRadius: 2,
                        border: 'solid 1px rgba(127, 127, 127, 0.85)',
                    }}
                >
                    {quote && (
                        <div style={{ marginBottom: '0.75rem', fontStyle: 'italic' }}>{quote}</div>
                    )}
                    <div>
                        A typical stretch of forest in Galthea: warm, pleasant, and haunted with the
                        ever-present danger of the Maelstrom.
                    </div>
                </div>
                <div
                    className="flex-row"
                    style={{
                        margin: '2px 2px 1px 2px',
                        padding: '0 4px 1px 4px',
                        alignItems: 'start',
                        backgroundColor: 'rgba(0, 0,0,.45)',
                        fontSize: 8,
                        fontWeight: 100,
                        borderRadius: 2,
                    }}
                >
                    <div style={{ opacity: 0.7 }}>Ridley Winters 2022</div>
                    <div style={{ flex: '1 0 0 ' }} />
                    <div style={{ opacity: 0.7 }}>galthea-forest / 6eY3</div>
                </div>
            </div>
        </div>
    );
}

function Cards() {
    return (
        <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', padding: '1rem' }}></div>
        </div>
    );
}
