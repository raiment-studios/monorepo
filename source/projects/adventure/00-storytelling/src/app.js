import React from 'react';
import { useCommonStyles, useLocalStorage } from '@raiment/react-ex';
import { makeRNG } from '@raiment/core';
import { last, cloneDeep, get, clone } from 'lodash';
import { Editable } from './components/editable';

const cache = {};
async function fetchCached(url, field) {
    let json = cache[url];
    if (!json) {
        console.log(`Loading ${url}...`);
        const resp = await fetch(url);
        json = await resp.json();
        cache[url] = json;
    }
    if (field === undefined) {
        return cloneDeep(json);
    }
    return cloneDeep(get(json, field));
}

export function App() {
    useCommonStyles();

    const [story, setStory] = useLocalStorage('story3', {
        rounds: [
            {
                cards: [],
                text: '',
            },
        ],
    });

    const rng = makeRNG();

    async function generate(type) {
        const tables = await fetchCached('/assets/tome.json');
        const desc = rng.select(tables[type]);
        const fields = await processDesc(desc);
        return {
            ...fields,
            type,
        };
    }

    async function processDesc(desc) {
        if (typeof desc === 'string') {
            return desc;
        }

        const vars = {};
        const props = {};
        if (desc.variables) {
            for (let [key, value] of Object.entries(desc.variables)) {
                let isProp = key.endsWith('@');
                if (isProp) {
                    key = key.replace(/@$/, '');
                }
                const table = await fetchCached('/assets/tome.json', value);
                const desc = rng.select(table);
                vars[key] = await processDesc(desc);
                if (isProp) {
                    props[key] = vars[key];
                }
            }
        }

        desc.props = desc.props || {};
        for (let [key, value] of Object.entries(desc.props)) {
            desc.props[key] = value.replace(/\$\{(.+?)\}/g, (m, varName) => {
                const value = get(vars, varName);
                return value || m;
            });
        }

        let description = undefined;
        if (desc.template) {
            description = desc.template.replace(/\$\{(.+?)\}/g, (m, varName) => {
                const value = get(vars, varName);
                return value || m;
            });
        }

        const resolved = cloneDeep(desc);
        Object.assign(desc.props, props);
        Object.assign(resolved, { description });
        return resolved;
    }

    const generators = {
        Theme: async () => {
            const table = await fetchCached('/assets/tome.json', 'theme');
            const value = rng.select(table);
            return {
                type: 'theme',
                value,
            };
        },

        Character: async () => {
            const table = await fetchCached('/assets/tome.json', 'character');
            const character = rng.select(table);

            const fields = await processDesc(character);

            return {
                type: 'character',
                rules: character.rules,
                ...fields,
            };
        },
        'Arc Sketch': async () => {
            const tables = await fetchCached('/assets/tome.json');
            const props = {};

            const name = rng.select(tables.npc_name);
            const response = rng.select(['escape', 'overcome']);
            const problem = rng.select(tables.problem);
            props.goal = `${name} wants to ${response} ${problem}.`;

            props.theme = rng.select(tables.theme);
            props.opportunity = rng.select(tables.event);
            const conflict = await generate('conflict');
            props.conflict = conflict;
            props.strategy = 'todo';
            props.plan = 'todo';

            return {
                type: 'arc',
                props,
            };
        },
        Arc: async () => {
            const table = await fetchCached('/assets/tome.json', 'arc');
            const arc = rng.select(table);

            const fields = await processDesc(arc);
            console.log(fields);
            return {
                type: 'arc',
                ...fields,
            };
        },
        Location: async () => {
            const table = await fetchCached('/assets/tome.json', 'location');
            return {
                type: 'location',
                value: rng.select(table),
            };
        },
        Motivation: async () => {
            const table = await fetchCached('/assets/tome.json', 'motivation');
            return {
                type: 'motivation',
                value: rng.select(table),
            };
        },
        Conflict: async () => {
            return await generate('conflict');
        },
        Problem: async () => {
            const table = await fetchCached('/assets/tome.json', 'problem');
            return {
                type: 'problem',
                value: rng.select(table),
            };
        },
        Clue: async () => {
            const table = await fetchCached('/assets/tome.json', 'clue');
            return {
                type: 'secret',
                value: rng.select(table),
            };
        },
        Secret: async () => {
            const table = await fetchCached('/assets/tome.json', 'secrets');
            return {
                type: 'secret',
                value: rng.select(table),
            };
        },
        Value: async () => {
            const table = await fetchCached('/assets/tome.json', 'value');
            const value = rng.select(table);
            return {
                type: 'value',
                value,
            };
        },
        Name: async () => {
            const table = await fetchCached('/assets/tome.json', 'character_name');
            return {
                type: 'name',
                value: rng.select(table),
            };
        },

        Mood: async () => {
            const table = await fetchCached('/assets/tome.json', 'mood');
            const value = rng.select(table);
            return {
                type: 'mood',
                value,
            };
        },
        Season: async () => {
            const table = await fetchCached('/assets/tome.json', 'season');
            return {
                type: 'season',
                value: rng.select(table),
            };
        },
        Profession: async () => {
            const table = await fetchCached('/assets/tome.json', 'profession');
            return {
                type: 'profession',
                value: rng.select(table),
            };
        },
        D20: async () => {
            return {
                type: 'd20',
                value: `roll = ${rng.rangei(1, 21)}`,
            };
        },
        Choice: async () => {
            const table = await fetchCached('/assets/tome.json', 'choice');
            const { value } = rng.select(table, (item) => item.weight);
            return {
                type: 'choice',
                value,
            };
        },
    };

    const handleClickGenerator = async (evt, func) => {
        evt.preventDefault();

        let result = func();
        if (result.then) {
            result = await result;
        }
        if (!result?.type) {
            return;
        }

        const round = last(story.rounds);
        round.cards.push(result);

        setStory(cloneDeep(story));
    };

    const handleRemove = (evt, round, cardIndex) => {
        round.cards.splice(cardIndex, 1);
        setStory(cloneDeep(story));
    };

    return (
        <div style={{ margin: '2rem auto', width: '62em' }}>
            <div className="flex-col">
                <h1>Raiment Studios: Storytelling</h1>
            </div>
            {story.rounds.map((round, roundIndex) => (
                <div key={`round-${roundIndex}`} className="flex-col">
                    <div className="flex-row">
                        <div className="flex-row" style={{ width: '50em' }}>
                            <div className="flex-col" style={{ flex: '1 0 0' }}>
                                <div style={{ marginBottom: 8 }}>Story</div>
                                <Editable
                                    style={{
                                        borderLeft: 'solid 4px #eee',
                                        padding: '0.5rem 1rem 1rem 0.25rem',
                                    }}
                                    data={round}
                                    field="text"
                                    onBlur={() => {
                                        setStory(cloneDeep(story));
                                    }}
                                />
                            </div>
                            <div style={{ flex: '0 0 8px' }} />
                            <div className="flex-col" style={{ flex: '1 0 0' }}>
                                <div style={{ marginBottom: 8 }}>Cards</div>
                                {round.cards.map((card, index) => (
                                    <Card
                                        key={index}
                                        card={card}
                                        onRemove={(evt) => handleRemove(evt, round, index)}
                                    />
                                ))}
                            </div>
                        </div>
                        <div style={{ flex: '0 0 2em' }} />
                        <div className="flex-col">
                            <div>
                                <strong>Generators</strong>
                            </div>
                            {Object.entries(generators).map(([name, func]) => (
                                <div key={name}>
                                    <a href="#" onClick={(evt) => handleClickGenerator(evt, func)}>
                                        {name}
                                    </a>
                                </div>
                            ))}
                        </div>
                        <div style={{ flex: '0 0 0.5em' }} />
                        <div className="flex-col">
                            <div>
                                <strong>Round {roundIndex + 1}</strong>
                            </div>
                            <div style={{ fontSize: '80%', whiteSpace: 'nowrap' }}>
                                <a
                                    href="#"
                                    onClick={(evt) => {
                                        evt.preventDefault();
                                        story.rounds.splice(roundIndex + 1, 0, {
                                            cards: [],
                                            text: '',
                                        });
                                        setStory(cloneDeep(story));
                                    }}
                                >
                                    Add
                                </a>
                            </div>
                            <div style={{ fontSize: '80%', whiteSpace: 'nowrap' }}>
                                <a
                                    href="#"
                                    onClick={(evt) => {
                                        evt.preventDefault();
                                        story.rounds.splice(roundIndex, 1);
                                        setStory(cloneDeep(story));
                                    }}
                                >
                                    Remove
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function Card({ card, onRemove }) {
    return (
        <div className="flex-row">
            <div
                className="flex-row"
                style={{
                    flex: '1 0 0',
                    margin: '0 0 12px',
                    padding: 2,
                    borderRadius: 8,
                    border: 'solid 1px #CCC',
                    fontSize: '90%',
                    backgroundColor: '#333',
                }}
            >
                <div className="flex-col" style={{ flex: '1 0 0' }}>
                    <div
                        className="flex-row"
                        style={{
                            marginBottom: '0.25rem', //
                            background: '#111',
                            borderRadius: 4,
                            padding: '1px 4px',
                            color: '#BBB',
                        }}
                    >
                        <div style={{ flex: '1 0 0', fontWeight: 'bold' }}>
                            {card.props?.name || card.name || card.value}
                        </div>
                        <div style={{ fontSize: '85%' }}>{card.type}</div>
                    </div>
                    <div
                        style={{
                            backgroundColor: '#EEE',
                            padding: 4,
                            borderRadius: 4,
                        }}
                    >
                        {card.value && <div>{card.value}</div>}
                        {card.props && (
                            <CardProps
                                style={{
                                    fontSize: '85%', //
                                }}
                                props={card.props}
                            />
                        )}
                        {card.description && (
                            <div
                                style={{
                                    margin: '0.5rem 0',
                                    fontSize: '80%',
                                    fontStyle: 'italic',
                                    opacity: 0.8,
                                }}
                            >
                                {card.description
                                    .split('\n')
                                    .map((line) => line.trim())
                                    .join('\n')
                                    .split('\n\n')
                                    .map((p, i) => (
                                        <div key={i} style={{ marginBottom: '0.35rem' }}>
                                            {p}
                                        </div>
                                    ))}
                            </div>
                        )}
                        {card.rules && (
                            <div
                                style={{
                                    margin: '0.5rem 0',
                                    fontSize: '80%',
                                    fontStyle: 'italic',
                                    opacity: 0.8,
                                }}
                            >
                                {card.rules
                                    .split('\n')
                                    .map((line) => line.trim())
                                    .join('\n')
                                    .split('\n\n')
                                    .map((p, i) => (
                                        <div key={i} style={{ marginBottom: '0.35rem' }}>
                                            {p}
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div
                style={{
                    fontSize: '70%',
                    textAlign: 'center',
                    padding: 4,
                    cursor: 'pointer',
                    userSelect: 'none',
                }}
                onClick={onRemove}
            >
                ✖
            </div>
        </div>
    );
}

function CardProps({ style, props }) {
    return (
        <div style={style}>
            {Object.entries(props).map(([key, value]) => (
                <PropRow key={key} name={key} value={value} />
            ))}
        </div>
    );
}

function PropRow({ name, value }) {
    if (typeof value !== 'string') {
        return (
            <div className="flex-col">
                <div
                    style={{
                        flex: '0 0 8rem',
                        fontStyle: 'italic', //
                    }}
                >
                    {name}
                </div>
                <div style={{ marginLeft: '1rem', flex: '1 0 0' }}>
                    <CardProps props={value.props} />
                </div>
            </div>
        );
    }

    return (
        <div className="flex-row">
            <div
                style={{
                    flex: '0 0 8rem',
                    fontStyle: 'italic', //
                }}
            >
                {name}
            </div>
            <div style={{ flex: '1 0 0' }}>
                <a
                    target="_blank"
                    href={`https://www.etymonline.com/search?q=${encodeURIComponent(value)}`}
                    style={{
                        textDecoration: 'none',
                        color: 'inherit',
                    }}
                >
                    {value}
                </a>
            </div>
        </div>
    );
}
