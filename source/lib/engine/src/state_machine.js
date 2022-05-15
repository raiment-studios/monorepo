/**
 * StateMachine takes a map of named generators, with a special "_start" generator.
 * Each update calls the current generator.  The generator can yield with no value
 * to pause execution until the next update. Or the generator can yield a numeric
 * value which will skip that many updates until it resumes execution.  Generators
 * can return either:
 * - no value: end execution
 * - string value: name of the state to transition to
 * - array value: first element is the state to transition to and all others are
 *      passed as arguments to the state generator
 */

export class StateMachine {
    constructor(states) {
        this._self = states._bind;
        this._states = states; // descriptors
        this._activeState = states._start.call(this._self);
        this._waitCycles = 0;

        this._frame = 0;
    }

    update() {
        this._frame++;

        if (!this._activeState) {
            return;
        }
        if (this._waitCycles > 0) {
            this._waitCycles--;
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
        }
    }
}
