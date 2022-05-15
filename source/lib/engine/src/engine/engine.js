import { ActorList } from './actor_list';
import { FrameLoop } from '../frame_loop';

export class Engine {
    constructor() {
        this._frameLoop = new FrameLoop(this.runFrame.bind(this));
        this._context = {
            engine: this,
            timeMS: 0,
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

    runFrame() {
        const ctx = this._context;
        ctx.timeMS = window.performance.now();

        // Initialize any newly added actors
        if (this.actors._added.length > 0) {
            for (let renderer of Object.values(this.renderers)) {
                if (!renderer.addActor) {
                    break;
                }

                for (let actor of this.actors._added) {
                    renderer.addActor(actor);
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
            renderer.renderFrame(this);
        }
    }
}
