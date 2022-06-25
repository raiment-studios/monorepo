import { isEqual } from 'lodash';

/**
 *
 * A "goal" is conceptual-pattern. It introduces a "goal" property on
 * the actor that is intended to represent a transition to a new  high-level
 * objective for the actor.  It is designed with "goal-based state machines"
 * in mind.
 *
 * ## Example:
 *
 * A state machine has "normal" flow of control where it transitions between
 * states. For example, an entity simulating farming might (1) till the soil,
 * (2) plant seeds, (3) water them, (4) repeat in a new area.  This is the
 * normal cycle. If a threat appears, the "goal" might be set to "find safety".
 * During the normal pattern, at points at which the normal cycle of activities
 * can be logically interrupted, the FSM should check if a new goal has been
 * set.  If yes, it should transition _differently_ than it normally would
 * to set it into a cycle representing that high-level behavior.
 *
 * ## Implementation details:
 *
 * - The actor by design only can have one goal at a time
 * - This is a passive, polling-based approach
 * - The actor should clear the goal when transitioning (i.e. a null goal
 *   implies the actor is already behaving in accordance with the right goal)
 */
export function componentGoal2({ actor }, { engine }) {
    actor.goal = new GoalTracker(actor, engine);

    return {
        name: 'goal2',
    };
}

class GoalTracker {
    constructor(actor, engine) {
        this._actor = actor;
        this._engine = engine;
        this._name = null;
        this._params = [];
        this._history = {};
    }

    get name() {
        return this._name;
    }
    get params() {
        return this._params;
    }

    set(name, ...params) {
        const priorName = this._name;
        const priorParams = this._params;

        if (priorName !== name || !isEqual(priorParams, this._params)) {
            this._name = name;
            this._params = params;

            const { frameNumber } = this._engine.context();
            this._history[name] ??= new GoalHistory();
            let history = this._history[name];
            history.lastSet = frameNumber;

            this._actor.events?.fire('goal.change', [name, ...params], [priorName, ...priorParams]);
        }
    }
    release() {
        const ret = [this._name, ...this._params];
        this._name = null;
        this._params = [];
        return ret;
    }

    history(name) {
        this._history[name] ??= new GoalHistory();
        return this._history[name];
    }
}

class GoalHistory {
    constructor() {
        this.lastSet = 0;
    }
}
