import express from 'express';

export async function startServer(app, { port, content, cacheID }) {
    const assets = {
        'index.html': await app.asset('index.html'),
    };

    const server = express();
    server.get('/cache-id', (req, res) => {
        res.send(cacheID);
    });
    server.get('/client.js', (req, res) => {
        res.set('etag', false);
        res.set('Cache-Control', 'no-store');
        res.contentType('text/javascript');
        res.send(content);
    });
    server.get('*', (req, res) => {
        res.contentType('text/html');
        res.send(assets['index.html']);
    });
    server.listen(port);
}
