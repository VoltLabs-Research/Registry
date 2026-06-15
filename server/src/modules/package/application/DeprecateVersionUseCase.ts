import type { UseCase } from '@/core/application/UseCase.js';
import { ForbiddenError, NotFoundError, ValidationError } from '@/core/errors/AppError.js';
import type { Version } from '@/modules/package/domain/Version.js';
import type { PackageRepository } from '@/modules/package/domain/PackageRepository.js';
import type { VersionRepository } from '@/modules/package/domain/VersionRepository.js';
import { toFullName } from '@/modules/package/domain/packageName.js';

export interface DeprecateVersionInput {
    username: string;
    name: string;
    version: string;
    accountId: string;
    actorUsername: string;
    reason: string;
}

export class DeprecateVersionUseCase implements UseCase<DeprecateVersionInput, Version> {
    constructor(
        private readonly packageRepository: PackageRepository,
        private readonly versionRepository: VersionRepository
    ) {}

    async execute(input: DeprecateVersionInput): Promise<Version> {
        if (input.reason.trim().length === 0) {
            throw new ValidationError('A deprecation reason is required');
        }

        const fullName = toFullName(input.username, input.name);
        const targetPackage = await this.packageRepository.findByFullName(fullName);
        if (!targetPackage) {
            throw new NotFoundError(`Package ${fullName} not found`);
        }

        if (targetPackage.username.toLowerCase() !== input.actorUsername.toLowerCase()) {
            throw new ForbiddenError(`Not authorized to modify @${targetPackage.username}`);
        }

        const deprecated = await this.versionRepository.markDeprecated(targetPackage.id, input.version, {
            reason: input.reason,
            at: new Date()
        });
        if (!deprecated) {
            throw new NotFoundError(`Version ${input.version} for ${fullName} not found`);
        }
        return deprecated;
    }
}
