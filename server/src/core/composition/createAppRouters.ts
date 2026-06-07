import type { Router } from 'express';
import env from '@/core/config/env.js';
import { MongoPackageRepository } from '@/modules/package/infrastructure/persistence/MongoPackageRepository.js';
import { MongoVersionRepository } from '@/modules/package/infrastructure/persistence/MongoVersionRepository.js';
import { S3PackageArtifactStorage } from '@/modules/package/infrastructure/persistence/S3PackageArtifactStorage.js';
import { S3TarballStorage } from '@/modules/download/infrastructure/storage/S3TarballStorage.js';
import { HttpConsoleGateway } from '@/modules/identity/infrastructure/console/HttpConsoleGateway.js';
import { createPackageRouter } from '@/modules/package/infrastructure/http/createPackageRouter.js';
import { createSearchRouter } from '@/modules/search/infrastructure/http/createSearchRouter.js';
import { createDownloadRouter } from '@/modules/download/infrastructure/http/createDownloadRouter.js';
import { createIdentityRouter } from '@/modules/identity/infrastructure/http/createIdentityRouter.js';

export interface AppRouters {
    identity: Router;
    search: Router;
    download: Router;
    package: Router;
}

/**
 * Composition root. Instantiates the shared infrastructure adapters once and
 * injects them into each module's router factory. This is the single place
 * where concrete implementations are wired to the ports they satisfy.
 */
export const createAppRouters = (): AppRouters => {
    const packageRepository = new MongoPackageRepository();
    const versionRepository = new MongoVersionRepository();
    const tarballStorage = new S3TarballStorage();
    const artifactStorage = new S3PackageArtifactStorage(env.RUSTFS_TARBALL_BUCKET);
    const consoleGateway = new HttpConsoleGateway();

    return {
        identity: createIdentityRouter({ consoleGateway }),
        search: createSearchRouter({ packageRepository }),
        download: createDownloadRouter({
            packageRepository,
            versionRepository,
            tarballStorage,
            tarballBucket: env.RUSTFS_TARBALL_BUCKET
        }),
        package: createPackageRouter({
            packageRepository,
            versionRepository,
            artifactStorage
        })
    };
};
