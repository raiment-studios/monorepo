export async function writeFile(name, content, options = {}) {
    const resp = await fetch('/internal-api/experimental-fs/v1', {
        method: 'POST',
        cache: 'no-cache',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            filename: name,
            data: content,
            options,
        }),
    });
    await resp.json();
}
