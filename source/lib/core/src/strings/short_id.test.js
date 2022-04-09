import { shortID } from './short_id';

describe('short_id', () => {
    it('should be exactly 12 characters', () => {
        for (let i = 0; i < 100; i++) {
            const id = shortID();
            expect(id.length).toBe(12);
        }
    });
});
