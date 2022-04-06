import { makeRNG } from './rng';

describe('random number generator (RNG)', () => {
    it('should generate the exact same values with the same seed', () => {
        const seeds = [0, 1, 2, 3, 23647, 3247, 99957324];

        for (let seed of seeds) {
            const rng0 = makeRNG(seed);
            const rng1 = makeRNG(seed);
            for (let i = 0; i < 5; i++) {
                expect(rng0.random()).toBe(rng1.random());
                expect(rng0.int31()).toBe(rng1.int31());
                expect(rng0.bool()).toBe(rng1.bool());
            }
        }
    });

    describe('random', () => {
        it('should generate numbers in the [0, 1) range', () => {
            for (let i = 0; i < 10; i++) {
                const rng = makeRNG(Math.floor(Math.random() * 1e6));
                for (let j = 0; j < 1000; j++) {
                    const value = rng.random();
                    expect(value >= 0.0 && value < 1.0).toBe(true);
                }
            }
        });
    });

    describe('range', () => {
        it('should generate numbers in the [0, N) range', () => {
            for (let i = 0; i < 10; i++) {
                const rng = makeRNG(Math.floor(Math.random() * 1e6));
                for (let j = 0; j < 1000; j++) {
                    const value = rng.rangei(0, 1000);
                    expect(value >= 0 && value < 1000).toBe(true);
                }
            }
        });
    });

    describe('rangei', () => {
        it('should generate numbers in the [0, N) range', () => {
            for (let i = 0; i < 10; i++) {
                const rng = makeRNG(Math.floor(Math.random() * 1e6));
                for (let j = 0; j < 1000; j++) {
                    const value = rng.rangei(0, 1000);
                    expect(Math.floor(value)).toBe(value);
                    expect(value >= 0 && value < 1000).toBe(true);
                }
            }
        });
    });

    describe('uuid', () => {
        it('should generate strings', () => {
            for (let i = 0; i < 10; i++) {
                const rng = makeRNG(Math.floor(Math.random() * 1e6));
                for (let j = 0; j < 50; j++) {
                    const value = rng.uuid();
                    expect(typeof value).toBe('string');
                }
            }
        });
    });

    describe('select', () => {
        it('should return a single value when passed an array', () => {
            const rng = makeRNG();
            const r = rng.select([1, 2, 3]);
            expect(typeof r).toBe('number');
        });
        it('should return an array when passed an array and count', () => {
            const rng = makeRNG();
            const r = rng.select([1, 2, 3], 3);
            expect(r.length).toBe(3);
            expect(typeof r[0]).toBe('number');
            expect(typeof r[1]).toBe('number');
            expect(typeof r[2]).toBe('number');
        });
        it('should return a single value when passed an array and weight function', () => {
            const rng = makeRNG();
            const r = rng.select([1, 2, 3], (w) => w);
            expect(typeof r).toBe('number');
        });

        it('should return an array when passed an array, count, and weight function', () => {
            const rng = makeRNG();
            const r = rng.select([1, 2, 3], 3, (w) => w);
            expect(r.length).toBe(3);
            expect(typeof r[0]).toBe('number');
            expect(typeof r[1]).toBe('number');
            expect(typeof r[2]).toBe('number');
        });

        it('should return undefined when passed any empty array', () => {
            const rng = makeRNG();
            const r = rng.select([]);
            expect(r).toBe(undefined);
        });

        it('should return the full array when the count is greater than the array length', () => {
            const rng = makeRNG();
            const r = rng.select([1, 2, 3], 10);
            expect(r.length).toBe(3);
        });

        it('should return the full array when the count is greater than the array length', () => {
            const rng = makeRNG();
            const r = rng.select([1, 2, 3], 10, (w) => w);
            expect(r.length).toBe(3);
        });
    });
});
