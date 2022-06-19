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
        const tileArray = heightMap.getLayerArray('tile');

        function generateRandomWalkablePosition() {
            const walkable = (wx, wy) => {
                const si = heightMap.coordW2I(wx, wy);
                if (si === -1) {
                    return false;
                }
                const tileIndex = tileArray[si];
                return true; // tileIndex === TILE.GRASS;
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
            mixins: [],
            worldX,
            worldY,
            scale: 0.5,
        });

        return actor;
    }

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
        play: function* () {
            const heightMap = engine.actors.selectByID('terrain');
            const actor = generateActor({ engine, heightMap });
            engine.actors.push(actor);
        },
    };
}
