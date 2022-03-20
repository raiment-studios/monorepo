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
    return get(json, field);
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

    const generators = {
        Theme: async () => {
            const table = [
                'adventure',
                'romance',
                'mystery',
                'exploration',
                'escape',
                'discovery',
                'fortune-hunting',
                'love',
                'survival',
            ];
            const value = rng.select(table);
            return {
                type: 'theme',
                value,
            };
        },

        Character: async () => {
            return {
                type: 'character',
                props: {
                    name: (await generators.Name()).value,
                    motivation: (await generators.Motivation()).value,
                    'primary value': `${(await generators.Value()).value}`,
                    'secondary value': `${(await generators.Value()).value}`,
                    trigger: `${(await generators.Value()).value}`,
                    mood: `${(await generators.Mood()).value}`,
                },
                description: `
                    As a fictional character, the character *always* looks at problems
                    in terms of their primary_value. They then give weight to their 
                    secondary_value as well in how they decide to act. Their actions 
                    should always promote those values.
                    
                    Their trigger_value is a blind-spot in their character: a place where
                    they have extreme, irrational reactions when they see others following this
                    value and do not listen to the logic of others.

                    In generating the backstory, answer the question *why* for each
                    of these values.
                    `.trim(),
            };
        },
        Arc: async () => {
            return {
                type: 'arc',
                value: 'todo',
                props: {
                    scenes: rng.rangei(2, 5),
                },
                description: `
                same motivation and character,
                set of escalating problems,
                resolution
                `.trim(),
            };
        },
        Location: async () => {
            const table = [
                'docks',
                'garden',
                'park',
                'winery',
                'hut',
                'barracks',
                'gatehouse',
                'inn',
                'bed and breakfast',
                'lighthouse',
                'riverfront',
                'library',
                "merchant's quarter",
                'bazaar',
                'town center',
                "blacksmith's",
                'castle',
            ];
            return {
                type: 'location',
                value: rng.select(table),
            };
        },
        Motivation: async () => {
            const table = [
                'find their creator',
                'forgiveness for an evil',
                'closure for a murder',
                'closure for a group tragedy',
            ];
            return {
                type: 'secret',
                value: rng.select(table),
            };
        },
        Conflict: async () => {
            return {
                type: 'conflict',
                props: {
                    problem: `${(await generators.Problem()).value}`,
                    complication: `${(await generators.Problem()).value}`,
                },
            };
        },
        Problem: async () => {
            const table = await fetchCached('/assets/problems.json', 'values');
            return {
                type: 'problem',
                value: rng.select(table),
            };
        },
        Clue: async () => {
            const table = [
                'a letter',
                'an inheritance',
                'a loud-mouthed local',
                'an old statue',
                'similar looks',
            ];
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
            const table = await fetchCached('/assets/values.json', 'values');
            const value = rng.select(table);
            return {
                type: 'value',
                value,
            };
        },
        Name: async () => {
            const table = [
                'Kestrel',
                'Graham',
                'Cedric',
                'Morgan',
                'Tristan',
                'Alice',
                'Ingrid',
                'Ramjin',
            ];
            return {
                type: 'name',
                value: rng.select(table),
            };
        },

        Mood: async () => {
            const table = [
                'cheery', //
                'sad',
                'content',
                'distracted',
                'focused',
                'confused',
                'irritated',
                'despondent',
                'inspired',
                'hopeful',
                'hopeless',
                'optimistic',
                'pessimistic',
                'friendly',
                'distant',
            ];
            const value = rng.select(table);
            return {
                type: 'mood',
                value,
            };
        },
        Season: async () => {
            const value = rng.select(['spring', 'summer', 'fall', 'winter']);
            return {
                type: 'season',
                value: `${value}`,
            };
        },
        Profession: async () => {
            const value = rng.select([
                'village farmer', //
                'corporate farmer',
                'barrister',
                'sailor',
                'merchant',
                'pilgrim',
                'sellsword',
                'librarian',
                'bodyguard',
            ]);
            return {
                type: 'profession',
                value,
            };
        },
        D20: async () => {
            return {
                type: 'd20',
                value: `roll = ${rng.rangei(1, 21)}`,
            };
        },
        Choice: async () => {
            const table = [
                { weight: 10, value: 'No, but...' },
                { weight: 40, value: 'No' },
                { weight: 40, value: 'Yes' },
                { weight: 10, value: 'Yes, but...' },
            ];
            return {
                type: 'choice',
                value: `${rng.selectWeighted(table, (item) => item.weight).value}`,
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
                            {card.props?.name || card.value}
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
                        {card.props &&
                            Object.entries(card.props)
                                .filter(([key]) => key !== 'name')
                                .map(([key, value]) => (
                                    <div key={key} className="flex-row">
                                        <div style={{ flex: '1 0 0' }}>{value}</div>
                                        <div
                                            style={{
                                                flex: '0 0 8rem',
                                                fontStyle: 'italic', //
                                                fontSize: '85%',
                                            }}
                                        >
                                            {key}
                                        </div>
                                    </div>
                                ))}
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
