import React from 'react';
import { makeUseStyles } from '../hooks/make_use_styles';

const useStyles = makeUseStyles({
    bold: {
        color: '#333',
        fontWeight: 800,
    },
    small: {
        fontSize: 13,
        color: '#555',
    },
    h1: {
        display: 'block',
        fontSize: 32,
        fontWeight: 800,
        margin: '4px 0',
    },
    h2: {
        display: 'block',
        fontSize: 24,
        fontWeight: 800,
        margin: '4px 0',
    },
    h3: {
        display: 'block',
        fontSize: 20,
        fontWeight: 800,
        margin: '4px 0',
    },
    h4: {
        display: 'block',
        fontSize: 18,
        fontWeight: 800,
        margin: '4px 0',
    },
    h5: {
        display: 'block',
        fontSize: 16,
        fontWeight: 800,
        margin: '4px 0',
    },
});

export function Type({
    h1,
    h2,
    h3,
    h4,
    h5,
    bold,
    small,
    v,

    m,
    mx,
    my,
    mt,
    mb,
    ml,
    mr,
    children,
}) {
    const classes = useStyles();

    v = h1
        ? 'h1'
        : h2
        ? 'h2'
        : h3
        ? 'h3'
        : h4
        ? 'h4'
        : h5
        ? 'h5'
        : bold
        ? 'bold'
        : small
        ? 'small'
        : v;

    // Margins
    mx ??= m;
    my ??= m;
    mt ??= my;
    mb ??= my;
    mr ??= mx;
    ml ??= mx;

    return (
        <span
            className={classes[v]}
            style={{
                marginTop: mt,
                marginBottom: mb,
                marginRight: mr,
                marginLeft: ml,
            }}
        >
            {children}
        </span>
    );
}
