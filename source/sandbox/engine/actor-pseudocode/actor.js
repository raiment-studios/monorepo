class Actor {
    // --------------------------------------------------------------------- //
    // @group Classification & organizatio
    // --------------------------------------------------------------------- //

    constructor({
        imp,

        id,
        uuid,
        tags, // merged not set, with syntax to remove
        flags, // merged not set

        // Modifies updateNeeded() to check
        // (frameNum + randomOffset) % updateParity === 0
        updateParity = 0,
        register,
    }) {
        this._imp = imp;
        this._mesh = null;
    }

    dispose() {}

    // --------------------------------------------------------------------- //
    // @group Classification & organization
    // --------------------------------------------------------------------- //

    get id() {}
    get uuid() {}
    get tags() {}
    get flags() {}

    // The implementation object is a "primary" component
    get imp() {
        return this._imp;
    }

    get events() {}
    get children() {}

    // --------------------------------------------------------------------- //
    // @group Current state
    // --------------------------------------------------------------------- //

    get position() {}
    get velocity() {}
    get acceleration() {}

    get collisionShape() {}

    get mesh() {
        return this._mesh;
    }

    // --------------------------------------------------------------------- //
    // @group Engine lifecycle methods
    // --------------------------------------------------------------------- //

    placement() {}

    init() {}
    updateNeeded() {}
    update() {}
    stateMachine() {}

    // --------------------------------------------------------------------- //
    // @group Extended behaviors
    // --------------------------------------------------------------------- //

    get opt() {}
}

function init() {
    // makeActor...
    // (1) Creates a default "empty" actor
    // (2) Links any functionality from the "imp" object in
    // (3) Overrides imp or adds additional options
    const actor = engine.makeActor({
        imp: new VoxelSprite(),
        id: 'my-sprite',
        flags: {
            pinToGroundHeightFlag: true,
        },
        register: [],
    });

    // Simple behaviors are usually added via a engine plug-in combined with
    // actor flags
    engine.register(new PinToGroundHeightFlag());

    // Complex behaviors are added directly to actors with behavior specifics
    // accessed under the 'opt' field
    actor.register(new PathFinding(heightmap));
    actor.opt.pathfinding.goal = ['move', 6, 7];

    engine.actors.add(actor);
}

function makeUpdater({ heightMap }) {
    const S = heightMap.segments;

    return {
        version: 1,
        components: [
            new PhysicsPVA({ update: true }),
            new BoxCollider({
                shape: new THREE.Box3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(S, S, S)),
            }),
        ],
        update({ rng }) {
            const K = 0.25;
            const MV = 2;
            this.velocity.x += K * rng.range(-1, 1);
            this.velocity.y += K * rng.range(-1, 1);
            this.velocity.clampScalar(-MV, MV);
        },
    };
}

function buildActor(desc) {}

function init2(heightMap) {
    engine.actors.add(makeUpdater({ heightMap }));
}
