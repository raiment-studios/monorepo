import express from 'express';

export async function startServer(app) {
    const server = express();
    server.get('/cache-id', (req, res) => {
        res.send(app.cacheID);
    });
    server.get('/client.js', (req, res) => {
        res.set('etag', false);
        res.set('Cache-Control', 'no-store');
        res.contentType('text/javascript');
        res.send(app.content);
    });
    server.get('*', (req, res) => {
        res.contentType('text/html');
        res.send(app.assets['index.html']);
    });
    server.listen(app.config.port);
}
