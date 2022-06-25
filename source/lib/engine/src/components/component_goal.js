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
export function componentGoal(actor) {
    actor._goal = null;
    return {
        name: 'goal',
        properties: {
            goal: {
                set(value) {
                    const prior = actor._goal;
                    actor._goal = value;
                    if (!isEqual(prior, value)) {
                        actor.events?.fire('goal.change', value, prior);
                    }
                },
                get() {
                    return actor._goal;
                },
            },
        },
    };
}
