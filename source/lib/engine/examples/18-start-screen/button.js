import React from 'react';
import { makeUseStyles } from '../../../react-ex/src';

const useButtonStyles = makeUseStyles({
    button: {
        margin: '6px 0',
        padding: '6px 8px 6px 12px',
        border: 'solid 1px rgba(0,0,0,.1)',
        borderRadius: 8,
        fontWeight: 600,
        cursor: 'pointer',
        userSelect: 'none',
        backgroundColor: 'rgba(0, 0, 0, 0.02)',

        '&:hover': {
            color: '#26B',
            backgroundColor: 'rgba(0, 0, 255, 0.02)',
        },
    },
});
export function Button({ label, onClick = () => alert('Not yet implemented') }) {
    const classes = useButtonStyles();
    return (
        <div className={classes.button} onClick={onClick}>
            {label}
        </div>
    );
}
