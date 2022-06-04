import express from 'express';
import fs from 'fs/promises';
import path from 'path';

export async function startServer(app, { port, filename, content }) {
    const assets = {
        'index.html': await app.asset('index.html'),
    };

    const workingDir = path.relative(process.cwd(), path.dirname(filename));

    const server = express();
    server.use(express.json());

    // Returns a unique ID for the currently built file. This allows the client to use
    // long-polling to automatically refresh on a change.
    server.get('/cache-id', (req, res) => {
        res.contentType('text/plain');
        res.send(`${content.buildID}`);
    });

    // Return the compiled script. Hard-coded to "client.js" since the underlying HTML
    // is intentionally a blackbox to the end user.
    server.get('/client.js', (req, res) => {
        res.set('etag', false);
        res.set('Cache-Control', 'no-store');
        res.contentType('text/javascript');
        res.send(content.output);
    });

    registerExperimentalFS(app, { server, content, workingDir });

    // Everything else...
    //
    // (1) Return a local file if it exists
    // (2) Otherwise return HTML host document (single-page webapp behavior)
    //
    // ⚠️🦹 There are possible secruity concerns returning local files without more extensive
    // checks. sea-jsx is currently not recommended for running in production environments!
    //
    server.get('*', async (req, res) => {
        // Try file references
        let localPath;
        const reference = content.references[req.path.replace(/^\//, '')];
        if (reference) {
            localPath = reference.filepath;
        }
        // First the local file system
        if (!localPath) {
            localPath = path.resolve(path.join(workingDir, req.path.replace(/^\//, '')));
        }
        try {
            const stats = await fs.stat(localPath);
            if (stats.isFile()) {
                app.print(`Serving local file for {{obj ${req.path}}}`);
                res.set('etag', false);
                res.set('Cache-Control', 'no-store');
                res.sendFile(path.resolve(localPath));
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

/**
 * The purpose of sea-jsx is to decouple away the host environment and treat "everything"
 * as a "single binary." In the spirit of this, sea-jsx exposes the filesystem while
 * abstracting away the network calls.
 */
function registerExperimentalFS(app, { server, content, workingDir }) {
    server.post('/internal-api/experimental-fs/v1', async (req, res) => {
        const { filename, data, options } = req.body;

        let localPath;
        if (options?.directory) {
            function swapEnvironmentVariables(s) {
                return s.replace(/\$\((.+)\)/g, function (m, name) {
                    return process.env[name];
                });
            }
            const dir = swapEnvironmentVariables(options.directory);
            localPath = path.join(dir, filename);
        } else {
            localPath = content.references[filename]?.filepath;
            if (!localPath) {
                app.print(`Returning {{loc 404}} for {{obj ${filename}}`);
                return res.sendStatus(404);
            }
        }

        let payload = data;
        if (options?.encoding === 'data-uri') {
            // https://gist.github.com/kapad/5b93b14f8a8b193745807b969b189489
            const BASE64_MARKER = ';base64,';
            const base64Index = data.indexOf(BASE64_MARKER) + BASE64_MARKER.length;
            const base64 = data.substring(base64Index);
            payload = Buffer.from(base64, 'base64');
        }

        app.print(
            `Writing to file {{obj ${path.relative(workingDir, localPath)}}} {{loc ${
                data.length
            }}} bytes.`
        );
        await fs.writeFile(localPath, payload);
        res.set('etag', false);
        res.set('Cache-Control', 'no-store');
        res.send({ success: true });
    });
}
