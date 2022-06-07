export function componentSelfColliderBox3({ actor, methods }, { box }) {
    return {
        name: 'selfColliderBox3',
        events: {
            preupdate: () => methods.update(),
        },
        methods: {
            update() {
                const dimensions = ['x', 'y', 'z'];
                const epsilon = 1e-6;

                for (let dim of dimensions) {
                    if (actor.position[dim] <= box.min[dim]) {
                        actor.position[dim] = box.min[dim] + epsilon;
                        actor.velocity[dim] = Math.abs(actor.velocity[dim]);
                    }
                    if (actor.position[dim] >= box.max[dim]) {
                        actor.position[dim] = box.max[dim] - epsilon;
                        actor.velocity[dim] = -Math.abs(actor.velocity[dim]);
                    }
                }
            },
        },
    };
}
