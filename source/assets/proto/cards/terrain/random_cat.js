export default function ({ THREE, engine, VOXActor, placeActor }) {
    return {
        title: 'Wandering Cat',
        image: 'base/sprites/cat-00.png',
        tags: 'toolbar'.split(',').map((s) => s.trim()),
        quote: {
            value: `The village seemed like a friendly enough place. Even the stray cats
            seemed well-fed and content enough.`,
            author: 'Marek Margraw',
        },
        description: [
            {
                type: 'text',
                value: `
Places a wandering cat into the world.
                `,
            },
        ],
        play: function* () {},
    };
}
