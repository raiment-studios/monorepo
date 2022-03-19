import React from 'react';
import { useCommonStyles, useLocalStorage } from '@raiment/react-ex';
import { makeRNG } from '@raiment/core';
import { last, cloneDeep, set, get, clone } from 'lodash';

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
        Theme: () => {
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

        Character: () => {
            return {
                type: 'character',
                props: {
                    name: generators.Name().value,
                    'primary value': `${generators.Value().value}`,
                    'secondary value': `${generators.Value().value}`,
                    trigger: `${generators.Value().value}`,
                },
                description: `
                    As a fictional character, the character *always* looks at problems
                    in terms of their primary_value. They then give weight to their 
                    secondary_value as well in how they decide to act. Their actions 
                    should always promote those values.
                    
                    Their trigger_value is a blind-spot in their character: a place where
                    they have extreme, irrational reactions when they see others following this
                    value and do not listen to the logic of others.
                    `.trim(),
            };
        },
        Conflict: () => {
            return {
                type: 'conflict',
                props: {
                    problem: `${generators.Problem().value}`,
                    complication: `${generators.Problem().value}`,
                },
            };
        },
        Problem: () => {
            const table = [
                'hunger', //
                'sickness',
                'injury',
                'betrayal',
                'tarnished reputation',
                'hostile environment',
                'in serious debt',
                'friend needs rescue',
                'been robbed',
                'old enemy returned',
                'mistaken identity',
                'family fued',
                'friend in need',
                'lost heirloom',
                'mistaken heroism',
                'imprisonment',
            ];

            return {
                type: 'problem',
                value: rng.select(table),
            };
        },
        Clue: () => {
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
        Secret: () => {
            const table = [
                'is a child of a famous person',
                'is a child of a politician',
                'has great wealth',
                'has no money',
                'is not who they say they are',
                'knows state secrets',
                'is a spy',
                'is an assassin',
                'accidentally killed a family member',
                'is an alcoholic',
                'is disowned from their family',
            ];
            return {
                type: 'secret',
                value: rng.select(table),
            };
        },
        Value: () => {
            const table = [
                'acceptance',
                'achievement',
                'adaptability',
                'adventure',
                'altruism',
                'appreciation',
                'attention to detail',
                'authenticity',
                'balance',
                'belonging',
                'bravery',
                'calm',
                'candor',
                'challenge',
                'collaboration',
                'communication',
                'community',
                'competition',
                'composure',
                'control',
                'country',
                'creativity',
                'diversity',
                'education',
                'efficiency',
                'enthussiasm',
                'environmentalism',
                'ethics',
                'excellence',
                'experimentation',
                'exploration',
                'fairness',
                'faith',
                'family',
                'fitness',
                'freedom',
                'friendship',
                'fun',
                'generosity',
                'hard-working',
                'health',
                'history',
                'honesty',
                'hope',
                'humor',
                'inclusiveness',
                'independence',
                'influence',
                'integrity',
                'justice',
                'leadership',
                'learning',
                'longevity',
                'love',
                'loyalty',
                'minimalism',
                'moderation',
                'modesty',
                'morality',
                'objectivity',
                'ownership',
                'partnership',
                'passion',
                'patience',
                'patriotism',
                'peace',
                'permanance',
                'perseverance',
                'play',
                'power',
                'quality',
                'readiness',
                'relaxation',
                'reliability',
                'reliability',
                'resilience',
                'respect',
                'rest',
                'restraint',
                'safety',
                'self-reliance',
                'service',
                'simplicity',
                'skill',
                'stewardship',
                'structure',
                'support',
                'sustainability',
                'tradition',
                'transparency',
                'trust',
                'truth',
                'versatility',
                'wealth',
                'winning',
            ];
            const value = rng.select(table);
            return {
                type: 'value',
                value,
            };
        },
        Name: () => {
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

        Mood: () => {
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
                value: `mood = ${value}`,
            };
        },
        Season: () => {
            const value = rng.select(['spring', 'summer', 'fall', 'winter']);
            return {
                type: 'season',
                value: `${value}`,
            };
        },
        Profession: () => {
            const value = rng.select([
                'village farmer', //
                'corporate farmer',
                'barrister',
                'sailor',
                'merchant',
                'pilgrim',
                'sellsword',
            ]);
            return {
                type: 'profession',
                value,
            };
        },
        D20: () => {
            return {
                type: 'd20',
                value: `roll = ${rng.rangei(1, 21)}`,
            };
        },
        Choice: () => {
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

    const handleClickGenerator = (evt, func) => {
        evt.preventDefault();

        const result = func();
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
                                                flex: '0 0 12rem',
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

function Editable({
    id, //
    className,
    style,
    onKeyDown,
    data,
    field,
    onSave,
    onBlur,
}) {
    return (
        <div
            id={id}
            className={className}
            style={style}
            suppressContentEditableWarning
            contentEditable
            spellCheck={false}
            onInput={(evt) => {
                // TODO: read innHTML & convert HTML to markdown
                set(data, field, evt.target.innerText);
                onSave && onSave();
            }}
            onBlur={onBlur || onSave}
            onKeyDown={onKeyDown}
        >
            {get(data, field)}
        </div>
    );
}
