import React from 'react';
import { useCommonStyles, useLocalStorage } from '@raiment/react-ex';
import { makeRNG } from '@raiment/core';
import { last, cloneDeep, clone } from 'lodash';

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
        Character: () => {},
        Conflict: () => {},
        Problem: () => {},
        Value: () => {},
    };

    const handleClickGenerator = (evt, func) => {
        evt.preventDefault();

        const result = func();
        if (!result?.type) {
            return;
        }

        const round = last(story.rounds);
        console.log({ story, round });
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
            <div className="flex-row">
                <div className="flex-row" style={{ width: '50em' }}>
                    <div className="flex-col" style={{ flex: '1 0 0' }}>
                        <div style={{ marginBottom: 8 }}>Story</div>
                    </div>
                    <div className="flex-col" style={{ flex: '1 0 0' }}>
                        <div style={{ marginBottom: 8 }}>Cards</div>
                        {last(story.rounds).cards.map((card, index) => (
                            <Card
                                key={index}
                                card={card}
                                onRemove={(evt) => handleRemove(evt, last(story.rounds), index)}
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
            </div>
        </div>
    );
}

function Card({ card, onRemove }) {
    return (
        <div
            className="flex-row"
            style={{
                margin: '0 0 12px',
                padding: '4px 8px',
                borderRadius: 8,
                border: 'solid 1px #CCC',
                fontSize: '90%',
            }}
        >
            <div className="flex-col" style={{ flex: '1 0 0' }}>
                <div style={{ marginBottom: '0.25rem' }}>
                    <strong>{card.type}</strong>
                </div>
                {card.value && <div>{card.value}</div>}
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
