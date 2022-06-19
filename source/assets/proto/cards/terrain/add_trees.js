export default function ({ engine, TreeActor, placeActor }) {
    return {
        quote: {
            value: `
Life is more difficult for us humans in the face of the Maelstrom,
but Galathea still survives.
`,

            author: 'Unknown',
        },
        description: [
            {
                type: 'text',
                value: `Generates a cluster of trees.`,
            },
        ],
        play: function* () {
            engine.journal.message('Adding trees...');

            const rng = engine.rng.fork();
            const heightMap = engine.actors.selectByID('terrain');
            for (let k = 0; k < 2; k++) {
                const cx = rng.rangei(0, heightMap.segments);
                const cy = rng.rangei(0, heightMap.segments);
                const count = rng.rangei(3, 8);
                for (let i = 0; i < count; i++) {
                    const actor = new TreeActor();
                    yield placeActor({
                        engine,
                        actor,
                        heightMap,
                        generatePosition: (rng) => {
                            return [cx + rng.rangei(-20, 20), cy + rng.rangei(-20, 20)];
                        },
                    });
                }
            }
        },
    };
}
