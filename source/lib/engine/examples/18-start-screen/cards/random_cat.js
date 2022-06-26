export default function ({
    engine,
    VoxelSprite,
    TextBubble,
    componentGoal2,
    componentWorldPathfinder,
}) {
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

                meow: function* () {
                    const message = engine.rng.select([
                        'meow',
                        'meow',
                        'meow',
                        'meow',
                        'meow',
                        'meeeeeow',
                    ]);

                    const text = new TextBubble({
                        text: message,
                        followActor: this,
                        offsetZ: 2.5,
                        lifetime: 3 * 60,
                    });
                    engine.actors.push(text);

                    yield 4 * 60;
                    return 'pathfind.target';
                },
            }),

            methods: {
                update(ctx) {
                    this._updateMeowCheck(ctx);
                },

                _updateMeowCheck({ engine, frameNumber }) {
                    const { rng } = engine;
                    if (rng.rangei(0, 30) !== 0) {
                        return;
                    }

                    // Don't meow if done recently
                    if (this.goal.history('meow').lastSet > frameNumber - 10 * 60) {
                        return;
                    }

                    if (rng.rangei(0, 30) === 0) {
                        this.goal.set('meow');
                    }
                },
            },
        });

        actor.mixin(componentGoal2, { engine });
        actor.mixin(componentWorldPathfinder, {
            engine,
            onMove: function (wx, wy) {
                if (this.goal.name === 'meow') {
                    return this.goal.release();
                }

                actor.position.x = wx;
                actor.position.y = wy;
            },
        });

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
            for (let i = 0; i < 64; i++) {
                const actor = generateActor({ engine });
                engine.actors.push(actor);
                yield 10;
            }
        },
    };
}
