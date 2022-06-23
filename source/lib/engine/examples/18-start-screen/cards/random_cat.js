export default function ({
    THREE,
    engine,
    VOXActor,
    VoxelSprite,
    componentGoal,
    componentPathfinder,
    componentPhysicsPVA,
    PathfinderGraph,
}) {
    function generateActor({ engine, heightMap }) {
        const rng = engine.rng;

        function generateRandomWalkablePosition() {
            const walkable = (wx, wy) => {
                const si = heightMap.coordW2I(wx, wy);
                if (si === -1) {
                    return false;
                }
                return heightMap.layers.tile.lookupIndex(si).walkable ?? true;
            };

            let worldX, worldY;
            do {
                worldX = rng.sign() * rng.rangei(0, heightMap.segments / 2);
                worldY = rng.sign() * rng.rangei(0, heightMap.segments / 2);
            } while (!walkable(worldX, worldY));

            return [worldX, worldY];
        }

        let [worldX, worldY] = generateRandomWalkablePosition();

        const actor = new VoxelSprite({
            url: 'base/sprites/cat-00.png',
            flags: {
                billboard: true,
                pinToGroundHeight: true,
            },
            worldX,
            worldY,
            scale: 0.25,

            stateMachine: () => ({
                _start: function* () {
                    return 'pathfind.target';
                },
            }),
        });

        const heightArray = heightMap.getLayerArray('height');

        actor.mixin(componentPathfinder, {
            pathfinder: new PathfinderGraph({
                width: heightMap.segments,
                height: heightMap.segments,
                walkable: (sx, sy) => heightMap.layers.tile.lookup(sx, sy).walkable ?? true,
                baseCost: (a) => heightMap.layers.tile.lookup(a.x, a.y)?.walkCost ?? 0.0,
                edgeCost: (a, b) => {
                    const hb = heightArray[b.y * heightMap.segments + b.x];
                    const ha = heightArray[a.y * heightMap.segments + a.x];
                    return Math.max(0, 10 * (hb - ha));
                },
            }),
            moveDelay: 6,
            positionFunc: ({ actor }) => {
                return heightMap.coordW2S(actor.position.x, actor.position.y);
            },
            onMove: (sx, sy) => {
                const [wx, wy] = heightMap.coordS2W(sx, sy);
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
            const heightMap = engine.actors.selectByID('terrain');
            const actor = generateActor({ engine, heightMap });
            engine.actors.push(actor);
        },
    };
}
