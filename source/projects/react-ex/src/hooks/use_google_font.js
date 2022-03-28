import React from 'react';

export function useGoogleFont(href) {
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
