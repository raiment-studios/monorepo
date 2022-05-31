import React from 'react';

/**
 * Embellishes plain text in rendering to React.
 */
export function TextDown({ text }) {
    if (!text) {
        return null;
    }

    const expression =
        /(https?:\/\/)[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)?/i;

    const re = new RegExp(expression);

    const parts = [];
    let t = text;
    let id = 1;
    while (t.length > 0) {
        const m = re.exec(t);
        if (!m || !(m.index >= 0)) {
            break;
        }
        const pre = t.substring(0, m.index);
        const match = m[0];
        const post = t.substring(m.index + match.length);

        const url = match.match(/^[a-z]+:\/\//) ? match : `https://${match}`;

        parts.push(
            <span key={id++}>{pre}</span>, //
            <a key={id++} href={url} target="_blank">
                {match}
            </a>
        );
        t = post;
    }
    if (t.length > 0) {
        parts.push(<span key={id++}>{t}</span>);
    }

    return <>{parts}</>;
}
