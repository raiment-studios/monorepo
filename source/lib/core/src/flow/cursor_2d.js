/**
 * A iterator-like utility for walking regions of a 2D canvas.
 *
 * The design should prefer the ease-of-use from the callers perspective
 * over the raw efficiency. There's some tension in this choice since
 * this is class creates inner loops that may have a tangible performance
 * impact.
 */
export class Cursor2D {
    constructor(width, height) {
        this._width = width;
        this._height = height;
    }

    border(cx, cy, borderWidth, cb) {
        const extra = {
            index: 0,
            distance: 0,
        };

        const y0 = Math.max(cy - borderWidth, 0);
        const y1 = Math.min(cy + borderWidth, this._height - 1);
        const x0 = Math.max(cx - borderWidth, 0);
        const x1 = Math.min(cx + borderWidth, this._width - 1);

        for (let y = y0; y <= y1; y++) {
            for (let x = x0; x <= x1; x++) {
                extra.index = y * this._width + x;
                const dx = x - cx;
                const dy = y - cy;
                extra.distance = Math.sqrt(dx * dx + dy * dy);
                cb(x, y, extra);
            }
        }
    }

    rect(x0, y0, x1, y1, cb) {
        const extra = {
            index: 0,
            distance: 0,
        };

        x0 = Math.max(x0, 0);
        y0 = Math.max(y0, 0);
        x1 = Math.min(x1, this._width);
        y1 = Math.min(y1, this._height);

        for (let y = y0; y < y1; y++) {
            for (let x = x0; x < x1; x++) {
                extra.index = y * this._width + x;
                cb(x, y, extra);
            }
        }
    }

    box(box2, options, cb) {
        if (cb === undefined) {
            cb = options;
        }

        // Options
        const { inflate = 0 } = options || {};

        if (inflate !== 0) {
            box2 = box2.clone();
            box2.expandByScalar(inflate);
        }

        const x0 = Math.max(Math.floor(box2.min.x), 0);
        const y0 = Math.max(Math.floor(box2.min.y), 0);
        const x1 = Math.min(Math.ceil(box2.max.x), this._width);
        const y1 = Math.min(Math.ceil(box2.max.y), this._height);

        const it = {
            x: 0,
            y: 0,
            index: 0,
            distance: 0,
        };
        for (let y = y0; y < y1; y++) {
            for (let x = x0; x < x1; x++) {
                it.x = x;
                it.y = y;
                it.index = y * this._width + x;
                cb(it);
            }
        }
    }
}
