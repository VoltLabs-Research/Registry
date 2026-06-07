import { Router } from 'express';
import multer from 'multer';
import { asyncHandler } from '@/core/http/asyncHandler.js';
import { requireAuth } from '@/core/http/middleware/requireAuth.js';
import type { PackageRepository } from '@/modules/package/domain/PackageRepository.js';
import type { VersionRepository } from '@/modules/package/domain/VersionRepository.js';
import type { PackageArtifactStorage } from '@/modules/package/domain/PackageArtifactStorage.js';
import { GetPackumentUseCase } from '@/modules/package/application/GetPackumentUseCase.js';
import { GetVersionUseCase } from '@/modules/package/application/GetVersionUseCase.js';
import { PublishPackageUseCase } from '@/modules/package/application/PublishPackageUseCase.js';
import { DeprecateVersionUseCase } from '@/modules/package/application/DeprecateVersionUseCase.js';
import { PackagePresenter } from '@/modules/package/infrastructure/http/PackagePresenter.js';
import { PackageController } from '@/modules/package/infrastructure/http/PackageController.js';

const MAX_BUNDLE_BYTES = 256 * 1024 * 1024;

export interface PackageRouterDependencies {
    packageRepository: PackageRepository;
    versionRepository: VersionRepository;
    artifactStorage: PackageArtifactStorage;
}

export const createPackageRouter = (dependencies: PackageRouterDependencies): Router => {
    const { packageRepository, versionRepository, artifactStorage } = dependencies;

    const controller = new PackageController(
        new GetPackumentUseCase(packageRepository, versionRepository),
        new GetVersionUseCase(packageRepository, versionRepository),
        new PublishPackageUseCase(packageRepository, versionRepository, artifactStorage),
        new DeprecateVersionUseCase(packageRepository, versionRepository),
        new PackagePresenter()
    );

    const uploadBundles = multer({
        storage: multer.memoryStorage(),
        limits: { fileSize: MAX_BUNDLE_BYTES }
    }).any();

    const router = Router();

    router.get('/packages/:username/:name', asyncHandler(controller.getPackument));
    router.get('/packages/:username/:name/:version', asyncHandler(controller.getVersion));
    router.put('/packages/:username/:name', requireAuth, uploadBundles, asyncHandler(controller.publish));
    router.post('/packages/:username/:name/:version/deprecate', requireAuth, asyncHandler(controller.deprecate));

    return router;
};
