export default function ({ THREE, engine, VOXActor }) {
    return {
        title: 'Add House',
        image: 'base/sprites/farmer-00.png',
        tags: 'toolbar'.split(',').map((s) => s.trim()),
        play: function* () {
            const rng = engine.rng.fork();
            engine.journal.message('Adding a house to the world...');
            const heightMap = engine.actors.selectByID('terrain');
            for (let i = 0; i < 1; i++) {
                const actor = new VOXActor({
                    url: rng.select([
                        'ext-metrominis/voxmodels/obj_house3a.vox', //
                        'ext-metrominis/voxmodels/obj_house5c.vox', //
                        'ext-metrominis/voxmodels/obj_house5c.vox', //
                        'ext-metrominis/voxmodels/obj_house5c.vox', //
                    ]),
                    scale: 2,
                    flags: {
                        pinToGroundHeight: true,
                        castShadow: true,
                    },
                    position: new THREE.Vector3(rng.rangei(-76, 76), rng.range(-76, 76), 0.0),
                    rotation: (Math.PI / 2) * rng.rangei(0, 4),
                });
                yield engine.actors.place({ engine, actor, heightMap });
            }
        },
    };
}
