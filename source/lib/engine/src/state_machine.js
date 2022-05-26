/**
 * StateMachine is an object designed to make state machine control flow easier.
 *
 * StateMachine utilizes JavaScript generator functions to create iterative,
 * interruptible state functions. State transitions can pass arguments upon
 * entering new states
 *
 * StateMachine takes a map of named generators, with a special "_start" generator.
 * Each call to update() calls the current generator for one iteration.
 *
 * Each generator can yield:
 *
 *  - No value: pause execution until the next call to update
 *  - A number: ignore the next N update calls (i.e. "pause" for that many calls)
 *  - A Promise: ignore any update calls until the promise is resolved
 *
 * The generator return value is used to transition states:
 *
 *  - A string: this is the name of the next state to transition to
 *  - An array: the first element must the string name of the next state, subsequent
 *          elements are passed as arguments to the next state
 *
 * Special state names:
 *
 *  - _start: the starting state
 *  - _bind: A special, non-state object that if specified will be the object bound
 *          as the "this" object passed to the generator functions
 */
export class StateMachine {
    constructor(states) {
        this._self = states._bind;
        this._states = states; // descriptors
        this._activeState = states._start.call(this._self);
        this._waitCycles = 0;
        this._busyWait = true;
    }

    bind(obj) {
        this._self = obj;
    }

    update() {
        if (!this._activeState) {
            return;
        }
        if (this._waitCycles > 0) {
            this._waitCycles--;
            return;
        }
        if (this._busyWait) {
            return;
        }

        const result = this._activeState.next();
        if (result.done) {
            let [nextState, nextStateArgs] = Array.isArray(result.value)
                ? [result.value[0], result.value.slice(1)]
                : [result.value, []];

            const generator = this._states[nextState];
            this._activeState = generator ? generator.call(this._self, ...nextStateArgs) : null;
        } else if (typeof result.value === 'number') {
            this._waitCycles = result.value;
        } else if (result.value.then) {
            this._busyWait = true;
            result.value.then(() => {
                this._busyWait = false;
            });
        }
    }
}
