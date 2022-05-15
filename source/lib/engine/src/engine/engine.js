import { ActorList } from './actor_list';
import { FrameLoop } from '../frame_loop';

export class Engine {
    constructor() {
        this._frameLoop = new FrameLoop(this.runFrame.bind(this));
        this._context = {
            engine: this,
            timeMS: 0,
            frameNumber: 0,
            frameFPS: 0,
        };

        this.renderers = {};
        this.actors = new ActorList();
    }

    dispose() {
        this.stop();

        for (let renderer of Object.values(this.renderers)) {
            renderer.dispose();
        }
    }

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

        // Initialize any newly added actors
        if (this.actors._added.length > 0) {
            for (let renderer of Object.values(this.renderers)) {
                if (!renderer.addActor) {
                    break;
                }

                for (let actor of this.actors._added) {
                    renderer.addActor(ctx, actor);
                }
            }
        }
        this.actors._added = [];

        // Run the logic update
        for (let actor of this.actors) {
            if (actor.update) {
                actor.update(ctx);
            }
        }

        // Render frames
        for (let renderer of Object.values(this.renderers)) {
            renderer.renderFrame(ctx);
        }
    }
}
