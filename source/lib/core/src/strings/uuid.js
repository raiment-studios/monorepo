function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
}

/**
 * Returns a [Universally Unique Identifier (UUID)](https://www.wikiwand.com/en/Universally_unique_identifier) string.
 *
 * Implementation dervied from https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
 */
export function uuid() {
    return `${s4() + s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
}
