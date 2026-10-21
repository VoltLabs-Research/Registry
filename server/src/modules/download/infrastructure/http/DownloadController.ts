import type { Request, Response } from 'express';
import { pipeline } from 'node:stream/promises';
import { HttpStatus } from '@/core/http/HttpStatus.js';
import type { ResolveTarballUseCase } from '@/modules/download/application/ResolveTarballUseCase.js';

export class DownloadController {
    constructor(private readonly resolveTarballUseCase: ResolveTarballUseCase) {}

    /**
     * A tarball, three ways. Asked for JSON, what it is: its digest and size, for a client that
     * passes the download on (a VOLT server, to its compute daemon). From a web page (a request with
     * an Origin), its bytes: the storage it is presigned on answers no cross-origin reads, and a
     * redirect a page follows must. Otherwise a redirect to storage, which serves it.
     */
    download = async (request: Request, response: Response): Promise<void> => {
        const { username = '', name = '', version = '', platform = '' } = request.params;
        const lookup = request.accepts(['application/octet-stream', 'application/json']) === 'application/json';
        const tarball = await this.resolveTarballUseCase.execute({ username, name, version, platform, download: !lookup });
        response.vary('Accept');
        response.vary('Origin');
        response.setHeader('X-Volt-Sha256', tarball.sha256);
        response.setHeader('X-Volt-Size', tarball.sizeBytes.toString());
        if (lookup) {
            response.json({ sha256: tarball.sha256, sizeBytes: tarball.sizeBytes, platform: tarball.platform });
            return;
        }
        if (request.headers.origin) {
            const body = await tarball.open();
            response.setHeader('Content-Type', 'application/octet-stream');
            response.setHeader('Content-Length', tarball.sizeBytes.toString());
            await pipeline(body, response);
            return;
        }
        response.redirect(HttpStatus.TemporaryRedirect, await tarball.presign());
    };
}
