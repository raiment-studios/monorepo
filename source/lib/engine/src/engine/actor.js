/**
 * 📐 DESIGN NOTES
 *
 * - For convenience the Actor is a "medium" weight with builtin functionality
 *   that may not be needed by all Actors. Later in development it make make
 *   sense to create a more "bare" Actor or more bare variation.  For now,
 *   the priority is simplicity of coding or pure optimization.
 *
 */
export class Actor {
    //-----------------------------------------------------------------------//
    // @group Construction
    //-----------------------------------------------------------------------//

    constructor({ id = null, mixins = [] } = {}) {
        this._id = id;
        this._opt = {};

        for (let comp of mixins) {
            console.log(comp);
            const args = Array.isArray(comp) ? comp : [comp];
            this.mixin(...args);
        }
    }

    dispose() {}

    mixin(componentFunc, options = {}) {
        //
        // ⚠️ TODO: "ctx.methods" should be improved --
        //
        // Components want access both to the actor object and to the component themselves.
        // The problem is that the component itself isn't fully defined until the registration
        // function returns. This makes it complicated to reference any methods that the
        // component defines.  The subtle (and subtle is 🦹) "workaround" here is the
        // registration function is passed a "methods" object that _will_ contain the methods
        // registered by the component: (1) as long as the dereference occurs after registration
        // it's fine, but (2) and dereference during registration will be undefined.
        //
        const ctx = {
            actor: this,
            methods: {},
        };
        const component = componentFunc(ctx, options);
        const { name, properties, events, methods, stateMachine, ...rest } = component;

        if (this.opt[name]) {
            console.warn(`Actor already has component`, name);
            return;
        }
        this.opt[name] = {};

        if (properties) {
            Object.defineProperties(this, properties);
        }

        if (methods) {
            for (let [methodName, func] of Object.entries(methods)) {
                ctx.methods[methodName] = func;
                this.opt[name][methodName] = func;
            }
        }
        if (events) {
            for (let [eventName, func] of Object.entries(events)) {
                this.events.on(eventName, func);
            }
        }

        if (stateMachine) {
            console.log('HEY');
            // 🀄 Function chaining
            const prior = this.stateMachine;
            this.stateMachine = (...args) => {
                const baseDesc = prior?.call(this, ...args) || {};
                return Object.assign(baseDesc, stateMachine(...args));
            };
        }

        if (Object.keys(rest).length > 0) {
            console.error('Unexpected additional keys', Object.keys(rest));
            throw new Error();
        }
    }

    //-----------------------------------------------------------------------//
    // @group Properties
    //-----------------------------------------------------------------------//

    get id() {
        return this._id;
    }

    get opt() {
        return this._opt;
    }
}
