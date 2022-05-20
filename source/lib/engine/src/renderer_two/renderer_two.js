export class RendererTwo {
    //-----------------------------------------------------------------------//
    // Construction
    //-----------------------------------------------------------------------//

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

    dispose() {}

    //-----------------------------------------------------------------------//
    // Properties
    //-----------------------------------------------------------------------//

    get canvas() {
        return this._canvas;
    }

    //-----------------------------------------------------------------------//
    // Methods
    //-----------------------------------------------------------------------//

    addActor(ctx, actor) {
        if (!actor.init2D) {
            return;
        }

        const { width, height } = this._canvas;
        var ctx = this._canvas.getContext('2d');

        ctx.save();
        actor.init2D({
            ctx,
            width,
            height,
        });
        ctx.restore();
    }

    renderFrame({ actors }) {
        const { width, height } = this._canvas;

        var ctx = this._canvas.getContext('2d');
        ctx.clearRect(0, 0, width, height);

        for (let actor of actors.filter((a) => !!a.render2D)) {
            ctx.save();
            actor.render2D({
                ctx,
                width,
                height,
            });
            ctx.restore();
        }
    }
}
