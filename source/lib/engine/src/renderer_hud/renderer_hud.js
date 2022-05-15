export class RendererHUD {
    constructor(hostElement, options) {
        const rect = hostElement.getBoundingClientRect();
        const { width, height } = rect;

        hostElement.style.position = 'relative';

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.style.position = 'absolute';
        canvas.style.top = 0;
        canvas.style.left = 0;

        hostElement.appendChild(canvas);

        this._canvas = canvas;
        this._options = Object.assign(
            {
                size: 16,
            },
            options
        );
    }

    renderFrame({ frameNumber, frameFPS }) {
        if (frameNumber < 20) {
            return;
        }
        if (frameNumber % 10 !== 0) {
            return;
        }

        const { width, height } = this._canvas;
        const { size } = this._options;

        const fps = Math.round(frameFPS * 10) / 10.0;
        const fpsString = `${fps.toFixed(1)} fps`;

        var ctx = this._canvas.getContext('2d');
        ctx.clearRect(0, 0, width, height);
        ctx.font = `${size}px monospace`;
        ctx.fillStyle = 'rgba(255, 255, 0, .75)';
        const dim = ctx.measureText(fpsString);
        ctx.fillText(fpsString, width - dim.width - 4, size);
    }
}
