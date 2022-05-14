/*!@sea:header
    publish:
        type: '@raiment/github-pages'
        org: raiment-studios
        path: engine/examples/bounce.html
*/

import React from 'react';
import { FrameLoop } from '../..';
import * as core from '../../../core';

export default function () {
    return (
        <div
            style={{
                margin: '1rem auto 6rem',
                width: '62rem',
            }}
        >
            <h1>Bounce</h1>
            <Bounce />
        </div>
    );
}

class Actor {
    constructor({
        x = 400, //
        y = 300,
        vx = 1,
        vy = -1,
        radius = 20,
        rgb = [0, 92, 163],
    } = {}) {
        this.shape = {
            type: 'circle',
            radius,
        };
        this.position = {
            x,
            y,
        };
        this.velocity = {
            x: vx,
            y: vy,
        };
        this.color = {
            r: rgb[0],
            g: rgb[1],
            b: rgb[2],
        };
    }

    update() {
        const { radius } = this.shape;

        let px = this.position.x + this.velocity.x;
        let py = this.position.y + this.velocity.y;

        const jitter = () => {
            return 0.1 * (2 * Math.random() - 1);
        };

        if (px - radius < 0) {
            px = radius;
            this.velocity.x = Math.abs(this.velocity.x);
            this.velocity.y = this.velocity.y + jitter();
        }
        if (px + radius >= 800) {
            px = 800 - radius;
            this.velocity.x = -Math.abs(this.velocity.x);
            this.velocity.y = this.velocity.y + jitter();
        }

        if (py - radius < 0) {
            py = radius;
            this.velocity.y = Math.abs(this.velocity.y);
            this.velocity.x = this.velocity.x + jitter();
        }
        if (py + radius >= 600) {
            py = 600 - radius;
            this.velocity.y = -Math.abs(this.velocity.y);
            this.velocity.x = this.velocity.x + jitter();
        }

        this.position.x = px;
        this.position.y = py;
    }

    render(ctx, g2d) {
        const { r, g, b } = this.color;
        g2d.fillStyle = `rgb(${r},${g},${b})`;
        g2d.beginPath();
        g2d.arc(this.position.x, this.position.y, this.shape.radius, 0, 2 * Math.PI, true);
        g2d.fill();
        g2d.stroke();
    }
}

function Bounce() {
    const refCanvas = React.useRef(null);
    const [fps, setFPS] = React.useState(0);
    const [avgFPS, setAvgFPS] = React.useState(0);

    React.useEffect(() => {
        const canvas = refCanvas.current;
        const g2d = canvas.getContext('2d');

        const rng = core.makeRNG();

        const actors = [];
        for (let i = 0; i < 1500; i++) {
            const radius = 4 * rng.rangei(4, 6);
            const actor = new Actor({
                x: rng.range(radius, canvas.width - radius),
                y: rng.range(radius, canvas.height - radius),
                vx: rng.sign() * rng.range(0.05, 3),
                vy: rng.sign() * rng.range(0.05, 3),
                radius,
                rgb: [
                    10 + rng.rangei(100, 200),
                    10 + rng.rangei(100, 200),
                    10 + rng.rangei(100, 200),
                ],
            });
            actors.push(actor);
        }

        let frameLoop = new FrameLoop((ctx) => {
            // Logic
            for (let actor of actors) {
                actor.update();
            }

            // Render
            g2d.fillStyle = 'rgba(255,255,255,1.0)';
            g2d.fillRect(0, 0, canvas.width, canvas.height);

            for (let actor of actors) {
                actor.render(null, g2d);
            }

            if (ctx.frameNumber % 20 === 0) {
                setFPS(ctx.frameFPS);
                setAvgFPS(ctx.frameAverageFPS);
            }
        });

        frameLoop.start();
        return () => {
            frameLoop.stop();
        };
    }, []);

    return (
        <div
            style={{
                margin: '1rem 0 6rem',
            }}
        >
            <canvas
                ref={refCanvas}
                width={800}
                height={600}
                style={{
                    display: 'block',
                    margin: '0 auto',
                    //border: 'solid 1px #555',
                }}
            />
            <div
                style={{
                    marginTop: 8,
                    textAlign: 'center',
                }}
            >
                FPS {Math.round(fps * 10) / 10} ({avgFPS.toFixed(1)})
            </div>
        </div>
    );
}
