import type { UseCase } from '@/core/application/UseCase.js';
import { NotFoundError } from '@/core/errors/AppError.js';
import type { PackageRepository } from '@/modules/package/domain/PackageRepository.js';
import type { VersionRepository } from '@/modules/package/domain/VersionRepository.js';
import type { TarballStorage } from '@/modules/download/domain/TarballStorage.js';

export interface PresignTarballInput {
    username: string;
    name: string;
    version: string;
    platform: string;
}

export interface PresignedTarball {
    url: string;
    sha256: string;
    sizeBytes: number;
    platform: string;
}

const PRESIGN_TTL_SECONDS = 300;

const toFullName = (username: string, name: string): string =>
    `@${username.toLowerCase()}/${name.toLowerCase()}`;

export class PresignTarballUseCase implements UseCase<PresignTarballInput, PresignedTarball> {
    constructor(
        private readonly packageRepository: PackageRepository,
        private readonly versionRepository: VersionRepository,
        private readonly tarballStorage: TarballStorage,
        private readonly tarballBucket: string
    ) {}

    async execute({ username, name, version, platform }: PresignTarballInput): Promise<PresignedTarball> {
        const fullName = toFullName(username, name);
        const targetPackage = await this.packageRepository.findByFullName(fullName);
        if (!targetPackage) {
            throw new NotFoundError(`Package ${fullName} not found`);
        }

        const targetVersion = await this.versionRepository.findByPackageAndVersion(targetPackage.id, version);
        if (!targetVersion) {
            throw new NotFoundError(`Version ${version} for ${fullName} not found`);
        }

        const platformEntry = targetVersion.platforms.find((entry) => entry.tag === platform);
        if (!platformEntry) {
            throw new NotFoundError(`Platform ${platform} for ${fullName}@${version} not found`);
        }

        const url = await this.tarballStorage.getSignedDownloadUrl(
            this.tarballBucket,
            platformEntry.key,
            PRESIGN_TTL_SECONDS
        );

        return {
            url,
            sha256: platformEntry.sha256,
            sizeBytes: platformEntry.sizeBytes,
            platform: platformEntry.tag
        };
    }
}
