import type { Request, Response } from 'express';
import { HttpStatus } from '@/core/http/HttpStatus.js';
import type { PresignTarballUseCase } from '@/modules/download/application/PresignTarballUseCase.js';

export class DownloadController {
    constructor(private readonly presignTarballUseCase: PresignTarballUseCase) {}

    download = async (request: Request, response: Response): Promise<void> => {
        const { username = '', name = '', version = '', platform = '' } = request.params;
        const result = await this.presignTarballUseCase.execute({ username, name, version, platform });
        response.setHeader('X-Volt-Sha256', result.sha256);
        response.setHeader('X-Volt-Size', result.sizeBytes.toString());
        response.redirect(HttpStatus.TemporaryRedirect, result.url);
    };
}
