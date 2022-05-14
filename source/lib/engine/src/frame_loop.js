/**
 * Coordinates the main loop flow control.
 *
 * Given an async frame function, will call it iteratively.
 */
export class FrameLoop {
    constructor(
        cb,
        {
            maxFPS = 200,
            slowFrameMs = 200, //
            onSlowFrame = function (ctx) {
                console.log(
                    `Slow frame: ${frameDurationMS} milliseconds (frame=${ctx.frameNumber})`
                );
            },
        } = {}
    ) {
        this._frameRequest = null;
        this._timeoutRequest = null;
        this._callback = cb;
        this._frameLoopBeginMS = 0;

        const targetDurationMs = 1000 / maxFPS;

        const beginTimeBuffer = new RingBuffer(60);
        beginTimeBuffer.fill(window.performance.now());

        const ctx = {
            frameNumber: 0,
            frameTimeMS: 0,
            frameDurationMS: 0,
            frameBeginMS: 0,
            frameEndMS: 0,
            frameSkipCount: 0,
            frameLoopBeginMS: 0,
            frameLoopTimeMS: 0,
            frameFPS: 0,
            frameAverageFPS: 0,
        };
        const asyncFrame = async () => {
            const t0 = window.performance.now();
            const dtPrevious = t0 - ctx.frameBeginMS;
            const spareMs = targetDurationMs - dtPrevious;

            if (spareMs <= 1) {
                ctx.frameLoopBeginMS = this._frameLoopBeginMS;
                ctx.frameLoopTimeMS = t0 - this._frameLoopBeginMS;
                ctx.frameNumber++;
                ctx.frameBeginMS = t0;

                await cb(ctx);

                const t1 = window.performance.now();
                const dt = t1 - t0;

                ctx.frameTimeMS += dt;
                ctx.frameEndMS = t1;
                ctx.frameDurationMS = dt;

                const start = beginTimeBuffer.first();
                beginTimeBuffer.push(t0);

                ctx.frameFPS = (1000 * beginTimeBuffer.length) / (t1 - start);
                ctx.frameAverageFPS = (1000 * ctx.frameNumber) / (t1 - ctx.frameLoopBeginMS);

                if (t1 - t0 > slowFrameMs) {
                    onSlowFrame(ctx);
                }
                this._frameRequest = requestAnimationFrame(this._runFrame);
            } else {
                ctx.frameSkipCount++;

                // Try to reduce the "busy waiting" when there's a fair amount
                // of spare time between frames. But do this conservatively since
                // setTimeout does not seem trustworthy in when it will actually
                // do the next callback.
                if (spareMs < 3) {
                    this._frameRequest = requestAnimationFrame(this._runFrame);
                } else {
                    this._timeoutRequest = setTimeout(this._runFrame, 2);
                }
            }
        };
        this._runFrame = () => {
            asyncFrame();
        };
    }

    start() {
        // Ignore redundant calls
        if (this._frameRequest || this._timeoutRequest) {
            return;
        }
        this._frameLoopBeginMS = window.performance.now();
        this._frameRequest = requestAnimationFrame(this._runFrame);
    }

    stop() {
        clearTimeout(this._timeoutRequest);
        cancelAnimationFrame(this._frameRequest);
        this._frameRequest = null;
        this._timeoutRequest = null;
    }

    dispose() {
        this.stop();
        this._callback = null;
    }
}

class RingBuffer {
    constructor(len) {
        this._buffer = new Array(len);
        this._index = 0;
    }
    get length() {
        return this._buffer.length;
    }

    fill(value) {
        this._buffer.fill(value);
    }

    first() {
        return this._buffer[this._index];
    }
    last() {
        const i = (this._index + this.buffer.length - 1) % this._buffer.length;
        return this._buffer[i];
    }
    push(value) {
        this._buffer[this._index] = value;
        this._index = (this._index + 1) % this._buffer.length;
    }
}
