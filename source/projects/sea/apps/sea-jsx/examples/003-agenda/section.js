import React from 'react';
import { useStyles } from './agenda';

export function Section({ label, height, children }) {
    const classes = useStyles();

    return (
        <div className={classes.group} style={{ minHeight: height }}>
            <div className={classes.label}>{label}</div>
            <div>{children}</div>
        </div>
    );
}
