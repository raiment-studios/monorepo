import levenshtein from 'js-levenshtein';

export function nearestOverlap(set, word) {
    const results = [];

    for (let i = 0; i < set.length; i++) {
        const candidate = set[i];

        for (let j = 0; j <= candidate.length - word.length; j++) {
            const prefix = candidate.substr(j, word.length);
            const score = levenshtein(prefix, word);

            if (score < word.length) {
                results.push({
                    candidate,
                    score,
                    prefix,
                });
            }
        }
    }

    results.sort((a, b) => {
        if (a.score < b.score) {
            return -1;
        }
        if (a.score > b.score) {
            return 1;
        }
        return 0;
    });

    return results;
}
