import fs from 'fs/promises';
import { constants } from 'fs';
import path from 'path';
import os from 'os';
//
// Temp directory
//
// TODO: is this a violation of any recommended practices to reuse the same
// temp directory?
//
export async function ensureTempDirectory(app) {
    const tempDirectory = path.join(os.tmpdir(), `sea-temp-${app.version}`);
    try {
        await fs.access(tempDirectory, constants.W_OK);
    } catch (e) {
        if (e.code == 'ENOENT') {
            await fs.mkdir(tempDirectory, { mode: 0x1e8 });
        } else {
            throw e;
        }
    }
    return tempDirectory;
}
