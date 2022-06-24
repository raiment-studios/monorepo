export default function ({ engine, VoxelSprite, componentWorldPathfinder }) {
    function generateActor({ engine }) {
        let position = engine.world.generateRandomWalkablePosition();

        const actor = new VoxelSprite({
            url: 'base/sprites/cat-00.png',
            flags: {
                billboard: true,
                pinToGroundHeight: true,
            },
            position,
            scale: 0.25,

            stateMachine: () => ({
                _start: function* () {
                    return 'pathfind.target';
                },
            }),
        });

        actor.mixin(componentWorldPathfinder, { engine });

        return actor;
    }

    return {
        id: 'wjySKQpWRpht',
        title: 'Wandering Cat',
        image: 'base/sprites/cat-00.png',
        tags: 'toolbar'.split(',').map((s) => s.trim()),
        type: 'Creature',
        quote: {
            value: `The village seemed like a friendly enough place. Even the cats
            wandering the streets seemed well-fed and content enough.`,
            author: 'Marek Margraw',
        },
        description: [
            {
                type: 'text',
                value: `
Places a wandering cat into the world.
                `,
            },
            {
                type: 'text',
                value: `
Wandering cats often will ignore anyone who tries to interact with
them. However in Galthea, nothing should be taken for granted.
                `,
            },
        ],
        play: function* () {
            engine.journal.message(`A wandering cat appears...`);
            const actor = generateActor({ engine });
            engine.actors.push(actor);
        },
    };
}
