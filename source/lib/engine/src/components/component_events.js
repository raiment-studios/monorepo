import { EventEmitter } from '../../../core/src';

export function componentEvents() {
    return {
        name: 'events',
        properties: {
            events: {
                value: new EventEmitter(),
            },
        },
    };
}
