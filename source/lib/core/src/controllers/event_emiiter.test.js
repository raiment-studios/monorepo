import { EventEmitter } from './event_emitter';

describe('EventEmitter', () => {
    test('basics', () => {
        const events = new EventEmitter();
        expect(events).toBeTruthy();

        let state = { count: 0 };
        let incCount = () => {
            state.count++;
        };
        events.on('inc', incCount);
        expect(state.count).toBe(0);
        events.fire('inc');
        expect(state.count).toBe(1);

        events.fire('inc');
        expect(state.count).toBe(2);

        events.off('inc', incCount);
        events.fire('inc');
        expect(state.count).toBe(2);

        events.once('inc', incCount);
        events.fire('inc');
        events.fire('inc');
        expect(state.count).toBe(3);

        events.on('inc', incCount);
        events.enqueue('inc');
        events.enqueue('inc');
        events.enqueue('inc');
        events.enqueue('inc');
        expect(state.count).toBe(3);
        events.flush();
        expect(state.count).toBe(7);
    });
});
