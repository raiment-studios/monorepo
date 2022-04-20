import React from 'react';
import { createUseStyles } from 'react-jss';

const useStyles = createUseStyles({
    '@global': {
        body: {
            backgroundColor: '#f7f0e6',
            fontFamily: "'Open Sans', sans-serif",
            fontSize: '9pt',
        },
        '.flex-row': {
            display: 'flex',
            flexDirection: 'row',
        },
        '.flex1': {
            flex: '1 0 0',
        },
    },
    group: {
        minHeight: '1.8rem',
        margin: '2px',
        padding: 4,
        border: 'solid 1px #555',
        borderRadius: 4,
    },
    label: {
        marginBottom: 4,
        fontStyle: 'italic',
        fontSize: '70%',
        opacity: 0.7,
    },
    line: {
        height: '1rem',
        borderBottom: '1px solid #CCC',
    },
});

export default function () {
    useGoogleFont(
        'https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,300;1,400;1,500;1,600;1,700;1,800&display=swap'
    );
    const classes = useStyles();

    return (
        <div
            style={{
                width: '42rem',
                height: '68rem',
                margin: '2rem auto',
                border: 'solid 1px #AAA',
                borderRadius: 8,
                padding: '6px 12px',
                backgroundColor: '#faf8f5',
                boxShadow: '4px 4px 10px 3px rgba(0,0,0,0.08)',
            }}
        >
            <div
                style={{
                    fontStyle: 'italic',
                    marginBottom: 6,
                    opacity: 0.5,
                    textAlign: 'right',
                }}
            >
                Guidebook
            </div>
            <Section label="Date" height="1.6rem">
                <div>{`${new Date()}`}</div>
            </Section>
            <div className="flex-row">
                <div className="flex1">
                    <Section label="Adventure" height="12rem">
                        <div style={{ margin: '0 0.5rem 0 1rem' }}>
                            <div className={classes.line} />
                            <div className={classes.line} />
                            <div className={classes.line} />
                            <div className={classes.line} />
                            <div className={classes.line} />
                            <div className={classes.line} />
                            <div className={classes.line} />
                        </div>
                    </Section>
                    <Section label="Fitness" height="16rem">
                        <div>☒ 10,000 steps</div>
                        <div>☐ Run</div>
                        <div>☐ Gym</div>
                        <div style={{ marginTop: '0.5rem' }}>
                            <div>Food</div>
                            <div style={{ margin: '0 0.5rem 0 1rem' }}>
                                <div className={classes.line} />
                                <div className={classes.line} />
                                <div className={classes.line} />
                                <div className={classes.line} />
                                <div className={classes.line} />
                            </div>
                        </div>
                    </Section>
                </div>
                <div className="flex1">
                    <Section label="Social" height="auto">
                        <div className={classes.line} />
                        <div className={classes.line} />
                        <div className={classes.line} />
                        <div style={{ height: '1rem' }} />
                    </Section>
                    <Section label="Entertainment" height="8rem">
                        <div>Reading</div>
                        <div>Movies / Shows</div>
                        <div>Games</div>
                    </Section>
                    <Section label="Projects" height="8rem">
                        content
                    </Section>
                </div>
            </div>
        </div>
    );
}

function Section({ label, height, children }) {
    const classes = useStyles();

    return (
        <div className={classes.group} style={{ height }}>
            <div className={classes.label}>{label}</div>
            <div>{children}</div>
        </div>
    );
}

function useGoogleFont(href) {
    const ensureLinkNode = (nodes, rel, href) => {
        const link = document.createElement('link');
        link.rel = rel;
        link.href = href;

        // Do the comparison after creating the node so that any normalization, for example
        // of the URL, occurs and the comparison will match.
        for (let node of nodes) {
            if (node.rel === link.rel && node.href === link.href) {
                console.log('Skipping', href);
                return null;
            }
        }
        document.head.appendChild(link);
        return link;
    };

    React.useEffect(() => {
        const nodes = document.querySelectorAll('link');
        const link1 = ensureLinkNode(nodes, 'preconnect', 'https://fonts.gstatic.com');
        const link2 = ensureLinkNode(nodes, 'stylesheet', href);

        return () => {
            if (link2) {
                document.head.removeChild(link2);
            }
            if (link1) {
                document.head.removeChild(link1);
            }
        };
    }, []);
}
