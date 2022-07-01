// General paradigm is...
// Start with a noun: person, place, or thing
// Add an adjective
// Based on that adjective, define a history
// Based on that history, define a goal
// Based on that goal, define actions that give that hope/vitality
//
//
// When a card is played, it generates an actor
// Instance cards versus generator cards
// Instance cards are just representations of actors
// Generator cards generate actors

let core = null;

export function init({ imports }) {
    core = imports.core;

    return new Card();
}

class Card {
    play({ seed, engine }) {
        seed ??= engine.rng.rangei(0, 8192);
        const rng = core.makeRNG(seed);

        const generator = rng.select([aggressiveCat, lostCat, exploringCat, lonelyCat]);
        const instance = generator({ seed: rng.rangei(0, 8192) });
    }
}

function aggressiveCat() {}

function lostCat() {}
function exploringCat() {}

function lonelyCat({ seed }) {
    // Encyclopedia...
    // Want to allow partial generation...
    // Create a partial instance with given characteristics
    // Then when an instance is later needed fully, if it overlaps
    // use that.

    const rng = core.makeRNG(seed);

    const generateChild = () =>
        rng.select([
            {
                identifier: 'boy',
                pronoun: 'he',
            },
            {
                identifier: 'girl',
                pronoun: 'she',
            },
            {
                identifier: 'child',
                prnoun: 'they',
            },
        ]);

    const table = {
        child: generateChild(),
    };

    let history = process(
        `
As a kitten, the cat was raised by a young {{child.identifier}}
who loved the cat very much. {{child.pronoun|capitalize}} cared for it every
day, played with it, and made it very happy.
    `,
        { table }
    ).trim();

    let goal = `
Find the {{child.identifier}}.
        `.trim();

    let eventTable = {
        pet: () => {
            hope += 1;
        },
        feed: () => {
            hope += 1;
        },
    };
    let behaviors = {
        follow: {
            description: 'Follows an actor that they trust.',
        },
        wander: {
            description: 'The cat sees a bright, shiny thing and goes to explore.',
        },
        nap: {
            description: 'Sleep. Sleepy sleep.',
        },
        meow: {
            description: 'Call for attention, whether to be petted, fed, or annoy is unclear.',
        },
        hunt: {
            description: 'If something that looks like food wanders too close...',
        },
    };

    return {
        seed,
        name: 'Wandering Cat',
        image: 'placeholder',
        history,
        goal,
        actions: null,
    };
}
