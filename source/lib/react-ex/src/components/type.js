import React from 'react';
import { makeUseStyles } from '../hooks/make_use_styles';

const useStyles = makeUseStyles({
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

    bold: {
        color: '#333',
        fontWeight: 800,
    },
    small: {
        fontSize: 13,
        color: '#555',
    },

    link: {
        cursor: 'pointer',
        userSelect: 'none',

        '&:hover': {
            color: '#33C',
        },
    },
});

export const Type = React.forwardRef((props, ref) => {
    const classes = useStyles();

    let {
        style = {},

        h1,
        h2,
        h3,
        h4,
        h5,
        bold,
        small,
        link,
        v, // variant

        w, // width

        m,
        mx,
        my,
        mt,
        mb,
        ml,
        mr,

        ellipsis,

        children,
    } = props;

    if (ellipsis) {
        return <EllipsisType {...props} />;
    }

    const className = [
        h1 && classes.h1,
        h2 && classes.h2,
        h3 && classes.h3,
        h4 && classes.h4,
        h5 && classes.h5,
        bold && classes.bold,
        small && classes.small,

        link && classes.link,

        v && classes[v],
    ].join(' ');

    // Margins
    mx ??= m;
    my ??= m;
    mt ??= my;
    mb ??= my;
    mr ??= mx;
    ml ??= mx;

    return (
        <span
            ref={ref}
            className={className}
            style={{
                marginTop: mt,
                marginBottom: mb,
                marginRight: mr,
                marginLeft: ml,
                width: w,
                ...style,
            }}
        >
            {children}
        </span>
    );
});

function EllipsisType({ ellipsis, children, ...rest }) {
    const ref = React.useRef(null);
    const [width, setWidth] = React.useState(undefined);
    React.useEffect(() => {
        let width = Infinity;
        let count = 8;

        let el = ref.current;
        while (count > 0 && el) {
            const rect = el.getBoundingClientRect();
            width = Math.min(width, rect.width);
            el = el.parentNode;
            count--;
        }
        if (width < Infinity) {
            ref.current.title = ref.current.textContent;
            setWidth(Math.floor(width));
        }
    }, []);

    return (
        <Type
            ref={ref}
            style={{
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                maxWidth: width,
            }}
            {...rest}
        >
            {children}
        </Type>
    );
}
