export async function writeFile(name, content, options = {}) {
    const resp = await fetch('/internal-api/experimental-fs/v1', {
        method: 'POST',
        cache: 'no-cache',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            functionName: 'writeFile',
            filename: name,
            data: content,
            options,
        }),
    });
    await resp.json();
}

export async function glob(pattern, options = {}) {
    const resp = await fetch('/internal-api/experimental-fs/v1', {
        method: 'POST',
        cache: 'no-cache',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            functionName: 'glob',
            pattern,
            options,
        }),
    });
    const json = await resp.json();
    return json.results;
}

export async function stat(path, options = {}) {
    const resp = await fetch('/internal-api/experimental-fs/v1', {
        method: 'POST',
        cache: 'no-cache',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            functionName: 'stat',
            path,
            options,
        }),
    });
    const json = await resp.json();
    return json.results;
}
