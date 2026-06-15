import type { UseCase } from '@/core/application/UseCase.js';
import { NotFoundError } from '@/core/errors/AppError.js';
import type { Package } from '@/modules/package/domain/Package.js';
import type { Version } from '@/modules/package/domain/Version.js';
import type { PackageRepository } from '@/modules/package/domain/PackageRepository.js';
import type { VersionRepository } from '@/modules/package/domain/VersionRepository.js';
import { toFullName } from '@/modules/package/domain/packageName.js';

export interface GetVersionInput {
    username: string;
    name: string;
    version: string;
}

export interface PackageVersion {
    package: Package;
    version: Version;
}


export class GetVersionUseCase implements UseCase<GetVersionInput, PackageVersion> {
    constructor(
        private readonly packageRepository: PackageRepository,
        private readonly versionRepository: VersionRepository
    ) {}

    async execute({ username, name, version }: GetVersionInput): Promise<PackageVersion> {
        const fullName = toFullName(username, name);
        const targetPackage = await this.packageRepository.findByFullName(fullName);
        if (!targetPackage) {
            throw new NotFoundError(`Package ${fullName} not found`);
        }

        const targetVersion = await this.versionRepository.findByPackageAndVersion(
            targetPackage.id,
            version
        );
        if (!targetVersion) {
            throw new NotFoundError(`Version ${version} for ${fullName} not found`);
        }

        return { package: targetPackage, version: targetVersion };
    }
}
