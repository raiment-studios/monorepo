import { generate } from './generate';

describe('generate', () => {
    it('should generate the given number of items', () => {
        const counts = [0, 1, 2, 3, 10, 100, 1000];
        for (let count of counts) {
            const arr = generate(count, () => 'test');
            expect(arr.length).toBe(count);
        }
    });
});
