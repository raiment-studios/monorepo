import React from 'react';
import * as ReactEx from '../../../../../lib/react-ex';

export function Drawer({
    style,
    className,
    uuid,
    Header,
    headerMarginLeft,
    Body = ({ children }) => <>{children}</>,
    children,
}) {
    const [expanded, setExpanded] = ReactEx.useLocalStorage(`expanded-${uuid}`, false);

    return (
        <div className={className} style={style}>
            <Body expanded={expanded}>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                    }}
                >
                    <div
                        style={{
                            marginLeft: headerMarginLeft,
                            padding: '4px 16px 4px 4px',
                            cursor: 'pointer',
                            userSelect: 'none',
                            color: 'rgba(0,0,0,0.20)',
                            fontWeight: 'bold',
                            fontSize: '90%',
                        }}
                        onClick={() => {
                            setExpanded(!expanded);
                        }}
                    >
                        <div
                            style={{
                                transform: `rotate(${expanded ? 90 : 0}deg)`,
                                transition: 'transform 300ms',
                            }}
                        >
                            {'>'}
                        </div>
                    </div>
                    <div style={{ flexGrow: 1 }}>
                        <Header expanded={expanded} />
                    </div>
                </div>
                <div
                    style={{
                        maxHeight: expanded ? 'none' : 0,
                        marginTop: expanded ? 16 : 0,
                        marginBottom: expanded ? 48 : 0,
                        visibility: expanded ? 'visible' : 'hidden',
                    }}
                >
                    {children}
                </div>
            </Body>
        </div>
    );
}
