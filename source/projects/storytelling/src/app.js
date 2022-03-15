import React from 'react';
import { useCommonStyles, useLocalStorage } from '@raiment/react-ex';
import { last, cloneDeep } from 'lodash';

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

    const generators = {
        Choice: () => {},
        D20: () => {
            return {
                type: 'd20',
                value: `roll = ${Math.floor(1 + Math.random() * 20)}`,
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

    return (
        <div style={{ margin: '2rem auto', width: '62em' }}>
            <div className="flex-col">
                <h1>Raiment Studios</h1>
                <h2>Storytelling</h2>
                <p style={{ color: 'red' }}>This is a placeholder.</p>
            </div>
            <div className="flex-row">
                <div className="flex-row" style={{ width: '50em' }}>
                    <div className="flex-col" style={{ flex: '1 0 0' }}>
                        <div style={{ marginBottom: 8 }}>Story</div>
                    </div>
                    <div className="flex-col" style={{ flex: '1 0 0' }}>
                        <div style={{ marginBottom: 8 }}>Cards</div>
                        {last(story.rounds).cards.map((card, index) => (
                            <Card key={index} card={card} />
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

function Card({ card }) {
    return (
        <div
            style={{
                margin: '0 0 12px',
                padding: '4px 8px',
                borderRadius: 8,
                border: 'solid 1px #CCC',
                fontSize: '90%',
            }}
        >
            <div>
                <strong>{card.type}</strong>
                {card.value && <div>{card.value}</div>}
            </div>
        </div>
    );
}
