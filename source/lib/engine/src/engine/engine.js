import { EventEmitter } from '../../../core';
import { ActorList } from './actor_list';
import { FrameLoop } from '../frame_loop';
import { World } from './world';

export class Engine {
    //-----------------------------------------------------------------------//
    // Construction
    //-----------------------------------------------------------------------//

    constructor() {
        EventEmitter.composeInto(this);

        this._frameLoop = new FrameLoop(this.runFrame.bind(this));
        this._context = {
            engine: this,
            timeMS: 0,
            frameNumber: 0,
            frameFPS: 0,
        };

        this._renderers = {};
        this._actors = new ActorList();
        this._world = new World();
    }

    dispose() {
        this.stop();

        for (let renderer of Object.values(this._renderers)) {
            renderer.dispose();
        }
    }

    //-----------------------------------------------------------------------//
    // Core objects
    //-----------------------------------------------------------------------//

    get renderers() {
        return this._renderers;
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

        //
        // Initialize any newly added actors
        //
        if (this._actors._added.length > 0) {
            for (let actor of this._actors._added) {
                // Let the actor initialize itself on the first frame
                if (actor.init) {
                    actor.init(ctx);
                }

                // Let each renderer know about the new actor
                for (let renderer of Object.values(this._renderers)) {
                    if (!renderer.addActor) {
                        break;
                    }
                    renderer.addActor(ctx, actor);
                }
            }
        }
        this._actors._added = [];

        // Run the logic update
        for (let actor of this._actors) {
            if (actor.update) {
                actor.update(ctx);
            }
        }

        // Render frames
        for (let renderer of Object.values(this._renderers)) {
            renderer.renderFrame(ctx);
        }
    }
}
