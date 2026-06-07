import type { Request, Response } from 'express';
import { UnauthorizedError } from '@/core/errors/AppError.js';
import type { ConsoleGateway } from '@/modules/identity/domain/ConsoleGateway.js';

export class WhoamiController {
    constructor(private readonly consoleGateway: ConsoleGateway) {}

    whoami = async (request: Request, response: Response): Promise<void> => {
        const authorization = request.header('authorization') ?? request.header('Authorization');
        if (!authorization) {
            throw new UnauthorizedError('Missing bearer token');
        }

        const result = await this.consoleGateway.whoami(authorization);

        response.status(result.status);
        if (result.body === null) {
            response.end();
            return;
        }
        response.json(result.body);
    };
}
