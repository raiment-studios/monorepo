import * as core from '../../../core';
import { Rain } from './rain';

export class WeatherSystem {
    stateMachine({ engine }) {
        const rng = core.makeRNG();

        const RAIN_LIGHT = 5000;
        const RAIN_NORMAL = 100000;
        const RAIN_HEAVY = 500000;

        return {
            _start: function* () {
                return rng.select(
                    [
                        [1, 'clear'],
                        [15, 'rainLight'],
                        [10, 'rainNormal'],
                        [10, 'rainHeavy'],
                    ],
                    (e) => e[0]
                )[1];
            },
            clear: function* () {
                yield 60 * rng.rangei(10, 100);
                return rng.select([
                    'clear',
                    'clear',
                    'rainLight',
                    'rainLight',
                    'rainLight',
                    'rainNormal',
                    'rainHeavy',
                ]);
            },
            rainLight: function* () {
                const actor = new Rain({ count: RAIN_LIGHT });
                engine.actors.push(actor);
                yield 60 * rng.rangei(5, 50);
                engine.actors.remove(actor);
                return rng.select(['clear', 'rainNormal', 'rainNormal']);
            },
            rainLightEnd: function* () {
                const actor = new Rain({ count: RAIN_LIGHT });
                engine.actors.push(actor);
                yield 60 * rng.rangei(5, 50);
                engine.actors.remove(actor);
                return 'clear';
            },
            rainNormal: function* () {
                const actor = new Rain({ count: RAIN_NORMAL });
                engine.actors.push(actor);
                yield 60 * rng.rangei(10, 200);
                engine.actors.remove(actor);
                return rng.select(['rainLightEnd', 'rainHeavy']);
            },
            rainHeavy: function* () {
                const actor = new Rain({ count: RAIN_HEAVY });
                engine.actors.push(actor);
                yield 60 * rng.rangei(10, 100);
                engine.actors.remove(actor);
                return rng.select([
                    'rainLightEnd',
                    'rainLightEnd',
                    'rainLightEnd',
                    'rainLightEnd',
                    'rainNormal',
                    'clear',
                ]);
            },
        };
    }
}
