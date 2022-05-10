import React from 'react';
import * as core from '@raiment/core';

async function getFileContent() {
    const accessToken = window.localStorage.getItem('PAT');

    const baseURL = `https://api.github.com/repos`;
    const org = `raiment-studios`;
    const repo = `raiment-studios.github.io`;
    const filepath = `contents/hello.html`;

    const url = `${baseURL}/${org}/${repo}/${filepath}`;

    const resp = await fetch(url, {
        headers: {
            Authorization: `token ${accessToken}`,
        },
    });
    return await resp.json();
}

export default function () {
    const [content, setContent] = React.useState('');

    const handleClickSetPAT = () => {
        const result = prompt('Set your Personal Access Token');
        window.localStorage.setItem('PAT', `${result}`.trim());
    };

    const handleClickGet = () => {
        (async () => {
            let t = [];
            const json = await getFileContent();

            t.push('\n## Repsonse\n');
            t.push(core.stringifyYAML(json));

            if (json.content) {
                t.push('\n## Content\n');
                const content = atob(json.content);
                t.push(content);
            }

            setContent(t.join('\n'));
        })();
    };

    const handleClickUpdate = () => {
        (async () => {
            let t = [];

            const json1 = await getFileContent();

            const accessToken = window.localStorage.getItem('PAT');
            t.push(`Personal access token: ${accessToken}`);

            const baseURL = `https://api.github.com/repos`;
            const org = `raiment-studios`;
            const repo = `raiment-studios.github.io`;
            const filepath = `contents/hello.html`;

            const sha = json1.sha;
            const content =
                `
<html>
    <body>
        <h3>Hello world!!</h3>
        <p>
            ${new Date()}
        </p>
    </body>
</html>
`.trim() + '\n';

            const url = `${baseURL}/${org}/${repo}/${filepath}`;
            t.push(`URL: ${url}`);
            const resp = await fetch(url, {
                method: 'PUT',
                headers: {
                    Authorization: `token ${accessToken}`,
                },
                body: JSON.stringify({
                    message: `Automated web-based commit ${new Date()}`,
                    committer: {
                        name: 'file-access sandbox',
                        email: 'computers@example.com',
                    },
                    sha,
                    content: btoa(content),
                }),
            });

            const json = await resp.json();

            t.push('\n## Repsonse\n');
            t.push(core.stringifyYAML(json));

            setContent(t.join('\n'));
        })();
    };

    return (
        <div
            style={{
                width: '62rem',
                margin: '1rem auto',
            }}
        >
            <h1>GitHub file file access sandbox</h1>
            <div style={{ display: 'flex', flexDirection: 'column', width: '14rem' }}>
                <button onClick={handleClickSetPAT}>Set Personal Access Token</button>
                <div style={{ flex: '0 0 1rem' }} />
                <button onClick={handleClickGet}>Get file content</button>
                <div style={{ flex: '0 0 1rem' }} />
                <button onClick={handleClickUpdate}>Update file content</button>
                <div style={{ flex: '0 0 1rem' }} />
            </div>
            <hr />
            <pre>{content}</pre>
            <hr />
        </div>
    );
}
