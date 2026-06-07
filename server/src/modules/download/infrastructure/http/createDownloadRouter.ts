import { Router } from 'express';
import { asyncHandler } from '@/core/http/asyncHandler.js';
import type { PackageRepository } from '@/modules/package/domain/PackageRepository.js';
import type { VersionRepository } from '@/modules/package/domain/VersionRepository.js';
import type { TarballStorage } from '@/modules/download/domain/TarballStorage.js';
import { PresignTarballUseCase } from '@/modules/download/application/PresignTarballUseCase.js';
import { DownloadController } from '@/modules/download/infrastructure/http/DownloadController.js';

export interface DownloadRouterDependencies {
    packageRepository: PackageRepository;
    versionRepository: VersionRepository;
    tarballStorage: TarballStorage;
    tarballBucket: string;
}

export const createDownloadRouter = (dependencies: DownloadRouterDependencies): Router => {
    const { packageRepository, versionRepository, tarballStorage, tarballBucket } = dependencies;

    const controller = new DownloadController(
        new PresignTarballUseCase(packageRepository, versionRepository, tarballStorage, tarballBucket)
    );

    const router = Router();

    router.get('/packages/:username/:name/:version/-/:platform.tgz', asyncHandler(controller.download));

    return router;
};
