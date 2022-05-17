import fs from 'fs/promises';
import fetch from 'node-fetch';

export async function publish(
    ctx,
    {
        accessToken, //
        target,
    } = {}
) {
    ctx.print('Publishing...');

    if (!accessToken) {
        ctx.error('Access token not specified.');
        ctx.print('Please set the SEA_GITHUB_TOKEN environment variable or use the --token flag');
    } else {
        ctx.print('Access token is defined.');
    }

    const { url, org, pathname } = buildPublishURL(ctx);
    const { status } = await updateFileContent(ctx, accessToken, url);
    if (status === 200) {
        ctx.print(`Success. Published to {{loc ${pathname}}}.`);
        ctx.print(`URL: {{loc https://${org}.github.io/${pathname}}}`);
    } else {
        ctx.error('Something went wrong.');
    }
}

function buildPublishURL(ctx) {
    const baseURL = `https://api.github.com/repos`;

    if (ctx.config.target) {
        const m = ctx.config.target.match(/^([a-z\-0-9_]+)\.github.io\/(.+)$/);
        if (m) {
            ctx.print('Publishing to github.io');
            const org = m[1];
            const pathname = m[2];
            const result = {
                org: m[1],
                pathname: m[2],
                url: `${baseURL}/${org}/${org}.github.io/contents/${pathname}`,
            };
            return result;
        }
    }

    const { publish } = ctx.frontmatter;

    const org = publish.org;
    const repo = `${org}.github.io`;
    const filepath = `contents/${publish.path}`;

    return {
        org,
        pathname: filepath,
        url: `${baseURL}/${org}/${repo}/${filepath}`,
    };
}

async function getFileContent(ctx, accessToken, publishURL) {
    const resp = await fetch(publishURL, {
        headers: {
            Authorization: `token ${accessToken}`,
        },
    });

    const json = await resp.json();
    if (resp.status === 404) {
        ctx.print(`Path not found. Creating new file.`);
    } else if (resp.status !== 200) {
        ctx.print('Get file contents results:');
        ctx.print(`Status code = {{loc ${resp.status}}}`);
        console.log(json);
        console.log();
    }

    return { status: resp.status, json };
}

async function updateFileContent(ctx, accessToken, publishURL) {
    const { status, json: json1 } = await getFileContent(ctx, accessToken, publishURL);
    if (status !== 200 && status !== 404) {
        return;
    }

    const sha = json1.sha;
    const content = ctx.assets['index.html'].toString().replace('{{client-source}}', ctx.content);

    const resp = await fetch(publishURL, {
        method: 'PUT',
        headers: {
            Authorization: `token ${accessToken}`,
        },
        body: JSON.stringify({
            message: `sea-jsx publish: ${new Date()}`,
            committer: {
                name: 'file-access sandbox',
                email: 'computer@example.com',
            },
            sha,
            content: Buffer.from(content).toString('base64'),
        }),
    });

    const json = await resp.json();

    if (resp.status !== 200 && resp.status !== 201) {
        ctx.error(`Status code = ${resp.status}`);
        console.log(json);
    }

    return {
        status: resp.status,
        json,
    };
}
