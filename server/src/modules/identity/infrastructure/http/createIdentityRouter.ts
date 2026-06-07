import { Router } from 'express';
import { asyncHandler } from '@/core/http/asyncHandler.js';
import type { ConsoleGateway } from '@/modules/identity/domain/ConsoleGateway.js';
import { WhoamiController } from '@/modules/identity/infrastructure/http/WhoamiController.js';

export interface IdentityRouterDependencies {
    consoleGateway: ConsoleGateway;
}

export const createIdentityRouter = (dependencies: IdentityRouterDependencies): Router => {
    const { consoleGateway } = dependencies;

    const controller = new WhoamiController(consoleGateway);

    const router = Router();

    router.get('/-/whoami', asyncHandler(controller.whoami));

    return router;
};
