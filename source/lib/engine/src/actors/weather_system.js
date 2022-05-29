import * as core from '../../../core';
import { Rain } from './rain';
import { Snow } from './snow';

export class WeatherSystem {
    constructor() {
        this.id = 'weather_system';

        this.condition = null;
    }

    stateMachine({ engine }) {
        const rng = core.makeRNG();

        const RAIN_LIGHT = 5000;
        const RAIN_NORMAL = 100000;
        const RAIN_HEAVY = 500000;

        const makeStates = (table) => {
            const desc = {
                _bind: this,
            };

            const TIME_SCALE = 60;
            let local = {
                priorState: null,
            };
            for (let [
                key,
                { condition = 'clear', effect, duration, transitions, messages },
            ] of Object.entries(table)) {
                desc[key] = function* () {
                    this.condition = condition;

                    let actor;
                    if (effect) {
                        const [Type, ...args] = effect;
                        actor = new Type(...args);
                        engine.actors.push(actor);
                    }

                    const waitTime = duration
                        ? TIME_SCALE * rng.rangei(duration[0], duration[1])
                        : 0;
                    const wait0 = Math.min(waitTime, 5);
                    const wait1 = waitTime - wait0;

                    if (wait0) {
                        yield wait0;
                    }

                    // Don't display weather messages during the first ~5 seconds of gameplay
                    // as it can be distracting.
                    const ctx = engine.context();
                    if (messages && ctx.frameNumber > 5 * 60) {
                        const key = local.priorState;
                        const set = messages[key] || messages['*'];
                        if (set) {
                            const value = rng.select(set, (e) => e[0])[1];
                            let msg = typeof value === 'function' ? value() : value;
                            if (msg) {
                                engine.journal.message(msg);
                            }
                        }
                    }
                    if (wait1) {
                        yield wait1;
                    }

                    if (actor) {
                        engine.actors.remove(actor);
                    }

                    local.priorState = key;
                    const nextState = rng.select(transitions, (e) => e[0])[1];
                    return nextState;
                };
            }
            return desc;
        };

        return makeStates({
            _start: {
                transitions: [
                    [80, 'clear'],
                    [30, 'clearWindy'],
                    [15, 'rainLight'],
                    [10, 'rainNormal'],
                    [10, 'rainHeavy'],
                    [30, 'snow'],
                ],
            },
            clear: {
                duration: [10, 100],
                transitions: [
                    [30, 'clear'],
                    [30, 'clearWindy'],
                    [30, 'rainLight'],
                    [10, 'rainNormal'],
                    [10, 'rainHeavy'],
                    [10, 'snow'],
                ],
            },
            clearWindy: {
                duration: [10, 100],
                transitions: [
                    [30, 'clear'],
                    [50, 'rainLight'],
                    [50, 'rainNormal'],
                    [20, 'rainHeavy'],
                ],
                messages: {
                    '*': [[100, `The wind is howling.`]],
                },
            },
            snow: {
                condition: 'snow',
                effect: [Snow, { count: 500000 }],
                duration: [20, 200],
                transitions: [[100, 'snowLight']],
                messages: {
                    '*': [
                        [100, `It's beginning to snow.`],
                        [20, 'The snow does not seem to accumulate.'],
                    ],
                },
            },
            snowLight: {
                condition: 'snow',
                effect: [Snow, { count: 100000 }],
                duration: [3, 12],
                transitions: [[100, 'clear']],
                messages: {
                    '*': [
                        [100, `It's beginning to snow.`],
                        [20, 'The snow does not seem to accumulate.'],
                    ],
                },
            },
            rainLight: {
                effect: [Rain, { count: RAIN_LIGHT }],
                duration: [5, 50],
                transitions: [
                    [1, 'clear'],
                    [2, 'rainNormal'],
                ],
                messages: {
                    clear: [
                        [100, 'It has begun to rain.'],
                        [100, null],
                    ],
                },
            },
            rainLightEnd: {
                effect: [Rain, { count: RAIN_LIGHT }],
                duration: [5, 50],
                transitions: [[1, 'clear']],
                messages: {
                    '*': [[100, () => 'The weather Looks to be clearing up.']],
                },
            },
            rainNormal: {
                effect: [Rain, { count: RAIN_NORMAL }],
                duration: [10, 200],
                transitions: [
                    [1, 'rainLightEnd'],
                    [1, 'rainHeavy'],
                ],
            },
            rainHeavy: {
                effect: [Rain, { count: RAIN_HEAVY }],
                duration: [10, 100],
                transitions: [
                    [1, 'rainLightEnd'],
                    [2, 'rainNormal'],
                ],
            },
        });
    }
}
