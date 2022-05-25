import { EventEmitter, uuid as generateUUID } from '../../../core';
import { ActorList } from './actor_list';
import { FrameLoop } from '../frame_loop';
import { World } from './world';
import { StateMachine } from '../state_machine';
import { registerPinToWorldGround } from './behaviors/register_pin_to_world_ground';
import { registerBillboard } from './behaviors/register_billboard';

export class Engine {
    //-----------------------------------------------------------------------//
    // Construction
    //-----------------------------------------------------------------------//

    constructor() {
        EventEmitter.composeInto(this);

        this._uuid = generateUUID();
        this._frameLoop = new FrameLoop(this.runFrame.bind(this));
        this._context = {
            engine: this,
            timeMS: 0,
            frameNumber: 0,
            frameFPS: 0,

            actors: null,
            actor: null,
        };

        this._renderers = {};
        this._cache = {};
        this._actors = new ActorList();
        this._world = new World(this);

        registerPinToWorldGround(this);
        registerBillboard(this);
    }

    dispose() {
        this.stop();

        for (let renderer of Object.values(this._renderers)) {
            renderer.dispose();
        }
    }

    //-----------------------------------------------------------------------//
    // Core properties
    //-----------------------------------------------------------------------//

    get uuid() {
        return this._uuid;
    }

    get renderers() {
        return this._renderers;
    }

    get cache() {
        return this._cache;
    }

    get actors() {
        return this._actors;
    }

    get world() {
        return this._world;
    }

    //-----------------------------------------------------------------------//
    // Event loop
    //-----------------------------------------------------------------------//

    start() {
        this._frameLoop.start();
    }

    stop() {
        this._frameLoop.stop();
    }

    runFrame({ frameNumber, frameFPS }) {
        const ctx = this._context;
        ctx.timeMS = window.performance.now();
        ctx.frameNumber = frameNumber;
        ctx.frameFPS = frameFPS;
        ctx.actors = this._actors;

        //
        // Initialize any newly added actors
        //
        if (this._actors._added.length > 0) {
            for (let actor of this._actors._added) {
                ctx.actor = actor;

                // Let the actor initialize itself on the first frame
                if (actor.init) {
                    actor.init(ctx);
                }

                // Give the actor a chance to init *before* validating in case there's logic
                // that needs to be run first to put the actor in a valid state.
                this.events.fire('actor.postinit', ctx);

                if (actor.stateMachine) {
                    const desc = actor.stateMachine(ctx);
                    if (desc) {
                        actor.__stateMachine = new StateMachine(desc);
                    }
                }

                // Let each renderer know about the new actora
                for (let renderer of Object.values(this._renderers)) {
                    if (!renderer.addActor) {
                        break;
                    }
                    renderer.addActor(ctx, actor);
                }
            }
        }
        this._actors._added = [];

        //
        // Run the logic update
        //
        this.events.fire('engine.preupdate', ctx);
        for (let actor of this._actors) {
            ctx.actor = actor;

            this.events.fire('actor.preupdate', ctx);

            if (actor.__stateMachine) {
                actor.__stateMachine.update(ctx);
            }
        }

        for (let actor of this._actors) {
            ctx.actor = actor;

            if (actor.update) {
                actor.update(ctx);
            }

            this.events.fire('actor.postupdate', ctx);
        }
        this.events.fire('engine.preupdate', ctx);

        // Render frames
        ctx.actor = null;
        for (let renderer of Object.values(this._renderers)) {
            renderer.renderFrame(ctx);
        }
    }
}
