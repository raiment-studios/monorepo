import { EventEmitter, uuid as generateUUID } from '../../../core';
import { ActorList } from './actor_list';
import { FrameLoop } from '../frame_loop';
import { World } from './world';
import { StateMachine } from '../state_machine';
import { registerPinToGroundHeight } from './behaviors/register_pin_to_world_ground';
import { registerBillboard } from './behaviors/register_billboard';
import { Journal } from './journal';
import { makeRNG } from '../../../core';

export class Engine {
    //-----------------------------------------------------------------------//
    // Construction
    //-----------------------------------------------------------------------//

    constructor({ seed } = {}) {
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
            mesh: null,
        };

        this._hostElement = null;
        this._renderers = {};
        this._cache = {}; // 🚧 TODO: Document this!
        this._rng = makeRNG(seed);
        this._actors = new ActorList();
        this._world = new World(this);
        this._journal = new Journal(this);
        this._opt = {};

        registerPinToGroundHeight(this);
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

    get rng() {
        return this._rng;
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

    get journal() {
        return this._journal;
    }

    context() {
        return this._context;
    }

    /**
     * A place to put "custom" data and functions for a given instance.
     *
     * Grouping such objects under the opt field is _slightly_ cleaner than
     * using global variables. In theory, this has the advantage that a code
     * search for "engine.opt" should reveal such dependencies across
     * components so they are more discoverable.
     *
     * Note: using this mechanism usually leads to dependency coupling which
     * can make code hard to reuse and/or modify.
     */
    get opt() {
        return this._opt;
    }

    /**
     * A sequence is a function run across multiple frames.  This can be used to
     * created timed scripts, spread work across multiple frames, or to sequence
     * operations with dependencies that take multiple frames to resolve.
     */
    addSequence(generatorFunc, self) {
        // A sequence can be represented as a special case of a state machine
        this.actors.push({
            stateMachine() {
                return {
                    _bind: self,
                    _start: generatorFunc,
                };
            },
        });
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

                this.events.fire('actor.preinit', ctx);

                // Let the actor initialize itself on the first frame
                //
                // 📐 DESIGN NOTES
                //
                // - This is called before the state machine is initialized in case the state machine
                //   needs data from the initialization process.
                //
                actor.init?.(ctx);
                this.events.fire('actor.postinit', ctx);

                const desc = actor.stateMachine?.(ctx);
                if (desc) {
                    actor.__stateMachine = new StateMachine(desc);
                }

                // Let each renderer know about the new actora
                for (let renderer of Object.values(this._renderers)) {
                    renderer.addActor?.(ctx, actor);
                }
                this._actors._list.push(actor);
            }
            this._actors._added = [];
        }

        for (let actor of this._actors._removed) {
            for (let renderer of Object.values(this._renderers)) {
                renderer.removeActor?.(ctx, actor);
            }

            actor.dispose?.(ctx);
        }
        this._actors._removed = [];

        //
        // Run the logic update
        //
        this.events.fire('engine.preupdate', ctx);
        const frame10Parity = ctx.frameNumber % 10;
        for (let actor of this._actors) {
            if (actor.frame10Parity && actor.frame10Parity === frame10Parity) {
                continue;
            }

            ctx.actor = actor;
            ctx.mesh = actor.__mesh;

            this.events.fire('actor.preupdate', ctx);
            actor.events?.fire('preupdate', ctx);

            // Note: we could peer into the stateMachine and remove actors that we know are
            // busy waiting on a promise or for a long number of cycles and only readd them
            // when they are active again. This may be a potential optimization for later,
            // especially if there are many "infrequent" actors in the engine.
            actor.__stateMachine?.update(ctx);
            actor.update?.(ctx);

            actor.events?.fire('postupdate', ctx);
            this.events.fire('actor.postupdate', ctx);
        }
        this.events.fire('engine.preupdate', ctx);

        // Render frames
        ctx.actor = null;
        for (let renderer of Object.values(this._renderers)) {
            renderer.renderFrame?.(ctx);
        }
    }
}
