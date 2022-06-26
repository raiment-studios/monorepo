import * as THREE from 'three';
import { Actor, componentEvents } from '../..';

export class TextBubble extends Actor {
    constructor({ text, position, followActor, offsetZ, lifetime, ...rest } = {}) {
        super(rest);
        this.mixin(componentEvents);

        this._text = text;
        this._group = new THREE.Group();
        this._position = position ?? new THREE.Vector3();
        this._offsetZ = offsetZ ?? 0.0;
        this._followActor = followActor;
        this._finalFrame = lifetime;
        this._disposeCallbacks = [];
    }

    get position() {
        return this._position;
    }

    init({ frameNumber }) {
        this._finalFrame = this._finalFrame + frameNumber;
    }

    update({ engine, frameNumber }) {
        if (frameNumber >= this._finalFrame) {
            engine.actors.remove(this);
            return;
        }

        if (this._followActor) {
            this._position.copy(this._followActor.position);
        }
    }

    async initMesh() {
        const { banner, disposeCb } = addText(this, this._text);
        banner.scale.multiplyScalar(6);
        banner.position.z += this._offsetZ;
        this._group.add(banner);

        this.events.on('dispose', disposeCb);
        return this._group;
    }
}

function addText(actor, message) {
    // Parameters
    // NOTE: 1.4 is extra height factor for text below baseline (g,j,p,q).
    //
    // TODO: this code assumes the message will fit within the canvas.
    // If it does not, it will be clipped.
    const fontHeight = 32 / 1.4;

    //
    // Create a offscreen canvas to render the text to..
    //
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 32;
    const canvasAspectRatio = canvas.width / canvas.height;

    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);

    //
    // Render the text centered in the canvas
    //
    const PAD_X = 6;
    const PAD_Y = 6;

    context.font = `normal ${fontHeight}px 'EBGaramond'`;
    context.strokeStyle = 'black';
    context.lineWidth = 2;
    const metrics = context.measureText(message);
    const centerOffset = (256 - metrics.width) / 2.0 + PAD_X;

    context.fillStyle = 'rgba(0, 0, 0, .5)';
    context.strokeStyle = 'rgba(0, 0, 0, .75)';
    context.fillRect(centerOffset - PAD_X, 0, metrics.width + 2 * PAD_X, fontHeight + 2 * PAD_Y);
    context.strokeRect(centerOffset - PAD_X, 0, metrics.width + 2 * PAD_X, fontHeight + 2 * PAD_Y);
    context.fillStyle = 'rgb(133, 212, 255)';
    context.fillText(message, centerOffset, fontHeight);

    //
    // Convert the canvas to a textured sprite.
    //
    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;

    const spriteMaterial = new THREE.SpriteMaterial({
        map: texture,
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(1, 1 / canvasAspectRatio, 1);

    // Custom hint to make sure the SSAO pass does not process text
    // elements
    sprite.userData = {
        ssao: false,
    };

    return {
        banner: sprite,
        disposeCb: () => {
            spriteMaterial.dispose();
            texture.dispose();
        },
    };
}
