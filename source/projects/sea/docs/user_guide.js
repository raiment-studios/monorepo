import React from 'react';
import * as ReactEx from '../../../lib/react-ex';
import data from 'yaml:./user_guide.yaml';

const SectionContext = React.createContext({
    depth: 0,
});

export default function () {
    ReactEx.useCommonStyles();
    return (
        <ReactEx.ReadingFrame className="mono" width="42rem">
            <h1
                className="mt-64px mb-16px"
                style={{
                    borderBottom: 'solid 1px #DDD',
                }}
            >
                Sea: User Guide
            </h1>

            <div>
                <div>
                    <strong>Table of contents</strong>
                </div>
                <ol>
                    {data.content.map((section) => (
                        <TableOfContentsEntry key={`toc-${section.name}`} section={section} />
                    ))}
                </ol>
            </div>

            {data.content.map((section) => (
                <Section key={section.name} section={section} depth={1} />
            ))}
        </ReactEx.ReadingFrame>
    );
}

function TableOfContentsEntry({ section }) {
    const genKey = (section) => `#section-${encodeURIComponent(section.name)}`;
    const subSections = section.blocks?.filter((b) => b.type === 'section') || [];

    return (
        <li>
            <a href={genKey(section)}>{section.name}</a>
            {!!subSections.length && (
                <ol>
                    {subSections.map((section) => (
                        <TableOfContentsEntry key={genKey(section)} section={section} />
                    ))}
                </ol>
            )}
        </li>
    );
}

function Section({ section }) {
    const sectionContext = React.useContext(SectionContext);

    return (
        <SectionContext.Provider value={{ ...sectionContext, depth: sectionContext.depth + 1 }}>
            <div>
                <a name={`section-${encodeURIComponent(section.name)}`} />
                <h2
                    style={{
                        marginTop: `${(48 * 2) / (sectionContext.depth + 2)}px`,
                        fontSize: `${(24 * 4) / (sectionContext.depth + 4)}px`,
                    }}
                >
                    {section.name}
                </h2>
                <div>
                    {section.blocks?.map((block, index) => (
                        <Block key={index} block={block} />
                    ))}
                </div>
            </div>
        </SectionContext.Provider>
    );
}

function Block({ block }) {
    switch (block.type) {
        case 'text':
            return <ReactEx.TextBlock text={block.value} />;
        case 'section':
            return <Section section={block} />;
        default:
            return <div>UNKNOWN BLOCK: {block.type}</div>;
    }
}
