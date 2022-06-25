export default function ({ engine, VoxelSprite, componentWorldPathfinder, componentGoal2 }) {
    function generateActor({ engine }) {
        let position = engine.world.generateRandomWalkablePosition();

        const sprite = engine.rng.select([
            'commoner-02',
            'commoner-03',
            'commoner-04',
            'commoner-05',
            'commoner-06',
            'commoner-07',
            'commoner-08',
            'commoner-09',
            'commoner-10',
            'commoner-11',
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
                wait: function* (untilFrameNumber) {
                    const { frameNumber } = engine.context();
                    const exclamation = engine.rng.select([
                        'Hello',
                        'Hello',
                        'Hello',
                        'Greetings',
                        'Hi there',
                    ]);

                    engine.journal.message(`"${exclamation}," says the stranger.`);
                    yield untilFrameNumber - frameNumber;

                    return 'pathfind.target';
                },
            }),

            update: function (ctx) {
                this._updateWaitState(ctx);
            },
            methods: {
                _updateWaitState({ engine, frameNumber }) {
                    const { rng } = engine;
                    if (rng.rangei(0, 30) !== 0) {
                        return;
                    }

                    // Don't stop and wait if the actor did already recently
                    if (this.goal.history('wait').lastSet > frameNumber - 10 * 60) {
                        return;
                    }

                    const player = engine.actors.selectByID('camera');
                    const posP = player.position;
                    const posW = this.position;

                    const Δp = posW.clone().sub(posP);
                    const DIST_MAX = 12;
                    const DIST_MIN = 3;
                    if (
                        Math.abs(Δp.x) > DIST_MAX ||
                        Math.abs(Δp.y) > DIST_MAX ||
                        Math.abs(Δp.x) < DIST_MIN ||
                        Math.abs(Δp.y) < DIST_MIN
                    ) {
                        return;
                    }

                    const f = player.forward().normalize();
                    const v = Δp.clone().normalize();
                    const θ = Math.acos(f.dot(v));
                    const ang = (θ * 180) / Math.PI;
                    if (ang < 60) {
                        this.goal.set('wait', frameNumber + rng.rangei(3, 6) * 60);
                    }
                },
            },
        });

        actor.mixin(componentGoal2, { engine });
        actor.mixin(componentWorldPathfinder, {
            engine,
            onMove: function (wx, wy) {
                if (this.goal.name === 'wait') {
                    return this.goal.release();
                }

                actor.position.x = wx;
                actor.position.y = wy;
            },
        });

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
