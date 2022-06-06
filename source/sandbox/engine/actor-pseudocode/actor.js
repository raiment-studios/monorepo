
class Actor {

    constructor({ 
        imp,
        updateParity = 0,
        flags, // merged not set
        tags, // merged not set, with syntax to remove 

    }) {
        this._imp = imp;
        this._mesh = null;
    }

    dispose() {}

    get imp() {
        return this._imp;
    }

    get id() {}
    get uuid() {}
    get tags() {}
    get flags() {}

    get position() {}
    get velocity() {}
    get acceleration() {}

    get events() {}
    get children() {}
    get mesh() {
        return this._mesh;
    }

    // Update only if
    // (frameNum + updateParity[0]) % updateParity[1] === 0 
    get updateParity() {}

    placement() {}
    collisionShape() {}

    init();
    update();
    stateMachine();
}

function init() {
    // makeActor...
    // (1) Creates a default "empty" actor
    // (2) Links any functionality from the "imp" object in
    // (3) Overrides imp or adds additional options
    const actor = engine.makeActor({
        imp : new VoxelSprite(),
        id: 'my-sprite',
        flags: {
            pinToGroundHeightFlag : true,
        },
        behaviors: [

        ],
    });

    

    // Simple behaviors are usually added via a engine plug-in combined with
    // actor flags
    engine.register(new PinToGroundHeightFlag());

    // Complex behaviors are added directly to actors with behavior specifics
    // accessed under the 'opt' field 
    actor.behavior.add(new PathFinding(heightmap));
    actor.opt.pathfinding.goal = ['move', 6, 7];

    engine.actors.add(actor);
}