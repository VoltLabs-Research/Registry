import { Router } from 'express';
import { asyncHandler } from '@/core/http/asyncHandler.js';
import type { PackageRepository } from '@/modules/package/domain/PackageRepository.js';
import { SearchUseCase } from '@/modules/search/application/SearchUseCase.js';
import { SearchPresenter } from '@/modules/search/infrastructure/http/SearchPresenter.js';
import { SearchController } from '@/modules/search/infrastructure/http/SearchController.js';

export interface SearchRouterDependencies {
    packageRepository: PackageRepository;
}

export const createSearchRouter = (dependencies: SearchRouterDependencies): Router => {
    const { packageRepository } = dependencies;

    const controller = new SearchController(
        new SearchUseCase(packageRepository),
        new SearchPresenter()
    );

    const router = Router();

    router.get('/-/search', asyncHandler(controller.search));

    return router;
};
