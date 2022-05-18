import express from 'express';

export async function startServer(app, { port, content }) {
    const assets = {
        'index.html': await app.asset('index.html'),
    };

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
    server.get('*', (req, res) => {
        app.print(`Serving {{obj index.html}} ({{loc ${content.buildID}}}).`);
        res.contentType('text/html');
        res.send(assets['index.html'].toString().replace('{{app.cacheID}}', content.buildID));
    });
    server.listen(port);
}
