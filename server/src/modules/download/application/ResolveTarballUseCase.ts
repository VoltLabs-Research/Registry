import type { Readable } from 'node:stream';
import type { UseCase } from '@/core/application/UseCase.js';
import { NotFoundError } from '@/core/errors/AppError.js';
import type { PackageRepository } from '@/modules/package/domain/PackageRepository.js';
import type { VersionRepository } from '@/modules/package/domain/VersionRepository.js';
import type { TarballStorage } from '@/modules/download/domain/TarballStorage.js';
import { toFullName } from '@/modules/package/domain/packageName.js';

export interface ResolveTarballInput {
    username: string;
    name: string;
    version: string;
    platform: string;
    /** Whether the caller is downloading it, which counts as the package's activity; a lookup is not. */
    download: boolean;
}

export interface ResolvedTarball {
    sha256: string;
    sizeBytes: number;
    platform: string;
    /** A storage URL that serves it for a short while. */
    presign(): Promise<string>;
    /** Its bytes, read from storage. */
    open(): Promise<Readable>;
}

const PRESIGN_TTL_SECONDS = 300;

export class ResolveTarballUseCase implements UseCase<ResolveTarballInput, ResolvedTarball> {
    constructor(
        private readonly packageRepository: PackageRepository,
        private readonly versionRepository: VersionRepository,
        private readonly tarballStorage: TarballStorage,
        private readonly tarballBucket: string
    ) {}

    async execute({ username, name, version, platform, download }: ResolveTarballInput): Promise<ResolvedTarball> {
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

        if (download) {
            await this.packageRepository.recordActivity(targetPackage.id, 1);
        }

        return {
            sha256: platformEntry.sha256,
            sizeBytes: platformEntry.sizeBytes,
            platform: platformEntry.tag,
            presign: () => this.tarballStorage.getSignedDownloadUrl(this.tarballBucket, platformEntry.key, PRESIGN_TTL_SECONDS),
            open: () => this.tarballStorage.openDownloadStream(this.tarballBucket, platformEntry.key)
        };
    }
}
