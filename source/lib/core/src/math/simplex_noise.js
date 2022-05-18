import SimplexNoise from 'simplex-noise';

/**
 * See https://github.com/jwagner/simplex-noise.js for docs
 */
export function makeSimplexNoise(seed) {
    return new SimplexNoise(seed);
}
