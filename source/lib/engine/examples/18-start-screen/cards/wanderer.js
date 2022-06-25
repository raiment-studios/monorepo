export default function ({ engine, VoxelSprite, componentWorldPathfinder }) {
    function generateActor({ engine }) {
        let position = engine.world.generateRandomWalkablePosition();

        const sprite = engine.rng.select([
            'commoner-02',
            'commoner-03',
            'commoner-04',
            'commoner-05',
            'commoner-06',
            'commoner-07',
            'farmer-00',
        ]);
        const actor = new VoxelSprite({
            url: `base/sprites/${sprite}.png`,
            flags: {
                billboard: true,
                pinToGroundHeight: true,
            },
            position,
            scale: 0.75,

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
        id: 'GZJW9nb2JgMo',
        title: 'Wanderer',
        image: 'base/sprites/commoner-03.png',
        tags: 'toolbar'.split(',').map((s) => s.trim()),
        type: 'Creature',
        quote: {
            value: `I wondered what he was doing. In retrospect, I should have asked.`,
            author: 'Carea Grenbrok',
        },
        description: [
            {
                type: 'text',
                value: `
Places a wanderer in the world
                `,
            },
            {
                type: 'text',
                value: `
                `,
            },
        ],
        play: function* () {
            engine.journal.message(`A wanderer appears...`);
            const actor = generateActor({ engine });
            engine.actors.push(actor);
        },
    };
}
