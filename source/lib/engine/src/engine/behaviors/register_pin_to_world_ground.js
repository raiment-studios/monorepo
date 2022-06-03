export function registerPinToGroundHeight(engine) {
    engine.events.on('actor.postinit', ({ actor }) => {
        if (!actor.flags?.pinToGroundHeight) {
            return;
        }
        if (!actor.position) {
            const err = `Actor must define the position property to use the pinToGroundHeight flag`;
            console.error(err, { actor });
            throw new Error(err);
        }
    });

    engine.events.on('actor.postupdate', ({ engine, actor }) => {
        if (!actor.flags?.pinToGroundHeight) {
            return;
        }

        const pos = actor.position;
        const z = engine.world.groundHeight(pos.x, pos.y);

        // Ignore if the ground height is not defined at this world coordinate
        if (z > -Infinity && z !== pos.z) {
            console.log(z - pos.z);
            actor.position.set(pos.x, pos.y, z);
        }
    });
}
