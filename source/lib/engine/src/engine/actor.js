export class Actor {
    constructor({ id }) {
        this._id = id ?? null;
        this._opt = {};
    }

    dispose() {}

    get id() {
        return this._id;
    }

    get opt() {
        return this._opt;
    }

    mixin(componentFunc, options) {
        const component = componentFunc(this, options);
        const { name, properties, events, ...rest } = component;

        if (this.opt[name]) {
            console.warn(`Actor already has component`, name);
            return;
        }
        this.opt[name] = {};

        if (properties) {
            Object.defineProperties(this, properties);
        }
        if (events) {
            for (let [name, func] of Object.entries(events)) {
                this.events.on(name, func.bind(component));
            }
        }
        if (rest) {
            for (let [methodName, method] of Object.entries(rest)) {
                this.opt[name][methodName] = method;
            }
        }
    }
}
