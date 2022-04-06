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
});
