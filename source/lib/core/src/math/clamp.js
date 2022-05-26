export function clamp(v, min, max) {
    // Note: the inverted tests is written to coerce NaN back to 0, since any
    // comparison to NaN is false
    if (!(v > min)) {
        return min;
    }
    if (!(v < max)) {
        return max;
    }
    return v;
}
