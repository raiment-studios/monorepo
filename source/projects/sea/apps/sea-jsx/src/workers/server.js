import express from 'express';
import fs from 'fs/promises';
import path from 'path';

export async function startServer(app, { port, filename, content }) {
    const assets = {
        'index.html': await app.asset('index.html'),
    };

    const workingDir = path.relative(process.cwd(), path.dirname(filename));

    const server = express();
    server.get('/cache-id', (req, res) => {
        res.contentType('text/plain');
        res.send(`${content.buildID}`);
    });
    server.get('/client.js', (req, res) => {
        res.set('etag', false);
        res.set('Cache-Control', 'no-store');
        res.contentType('text/javascript');
        res.send(content.output);
    });
    server.get('*', async (req, res) => {
        // First try the local file system
        const localPath = path.resolve(path.join(workingDir, req.path.replace(/^\//, '')));
        try {
            const stats = await fs.stat(localPath);
            if (stats.isFile()) {
                app.print(`Serving {{obj ${path.relative(process.cwd(), localPath)}}}.`);
                res.set('etag', false);
                res.set('Cache-Control', 'no-store');
                res.sendFile(localPath);
                return;
            }
        } catch (ignored) {}

        // Default to index.html as this is treated as a single-page webapp so index.html
        // way be doing client-side routing
        app.print(`Serving {{obj index.html}} (cached ID {{loc ${content.buildID}}}).`);
        res.contentType('text/html');
        res.send(assets['index.html'].toString().replace('{{app.cacheID}}', content.buildID));
    });
    server.listen(port);
}
