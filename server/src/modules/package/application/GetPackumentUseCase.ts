import type { UseCase } from '@/core/application/UseCase.js';
import { NotFoundError } from '@/core/errors/AppError.js';
import type { Package } from '@/modules/package/domain/Package.js';
import type { Version } from '@/modules/package/domain/Version.js';
import type { PackageRepository } from '@/modules/package/domain/PackageRepository.js';
import type { VersionRepository } from '@/modules/package/domain/VersionRepository.js';
import { toFullName } from '@/modules/package/domain/packageName.js';

export interface GetPackumentInput {
    username: string;
    name: string;
}

export interface Packument {
    package: Package;
    versions: Version[];
}

export class GetPackumentUseCase implements UseCase<GetPackumentInput, Packument> {
    constructor(
        private readonly packageRepository: PackageRepository,
        private readonly versionRepository: VersionRepository
    ) {}

    async execute({ username, name }: GetPackumentInput): Promise<Packument> {
        const fullName = toFullName(username, name);
        const targetPackage = await this.packageRepository.findByFullName(fullName);
        if (!targetPackage) {
            throw new NotFoundError(`Package ${fullName} not found`);
        }

        const versions = await this.versionRepository.listByPackageId(targetPackage.id);
        return { package: targetPackage, versions };
    }
}
