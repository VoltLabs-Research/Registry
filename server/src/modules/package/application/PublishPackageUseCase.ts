import { createHash } from 'node:crypto';
import semver from 'semver';
import type { UseCase } from '@/core/application/UseCase.js';
import { ConflictError, ForbiddenError, ValidationError } from '@/core/errors/AppError.js';
import type { VersionPlatform, VpmManifest } from '@/modules/package/domain/Version.js';
import type { Package } from '@/modules/package/domain/Package.js';
import type { PackageRepository } from '@/modules/package/domain/PackageRepository.js';
import type { VersionRepository } from '@/modules/package/domain/VersionRepository.js';
import type { PackageArtifactStorage } from '@/modules/package/domain/PackageArtifactStorage.js';
import { publishManifestSchema } from '@/modules/package/application/PublishManifestSchema.js';
import type { Packument } from '@/modules/package/application/GetPackumentUseCase.js';

export interface PublishBundle {
    tag: string;
    body: Buffer;
}

export interface PublishPackageInput {
    username: string;
    name: string;
    accountId: string;
    actorUsername: string;
    manifest: unknown;
    readme?: string;
    bundles: PublishBundle[];
}

const sha256 = (body: Buffer | string): string => createHash('sha256').update(body).digest('hex');

export class PublishPackageUseCase implements UseCase<PublishPackageInput, Packument> {
    constructor(
        private readonly packageRepository: PackageRepository,
        private readonly versionRepository: VersionRepository,
        private readonly artifactStorage: PackageArtifactStorage
    ) {}

    async execute(input: PublishPackageInput): Promise<Packument> {
        const username = input.username.toLowerCase();
        const packageName = input.name.toLowerCase();
        const fullName = `@${username}/${packageName}`;

        if (username !== input.actorUsername.toLowerCase()) {
            throw new ForbiddenError(`You can only publish under your own username @${input.username}`);
        }

        const manifest = this.parseManifest(input.manifest);
        if (manifest.name.toLowerCase() !== fullName) {
            throw new ValidationError(
                `Manifest name ${manifest.name} does not match the publish target ${fullName}`
            );
        }
        if (input.bundles.length === 0) {
            throw new ValidationError('At least one platform bundle is required to publish');
        }

        const targetPackage = await this.resolvePackage(username, packageName, fullName, manifest, input.readme);

        await this.assertVersionIsNew(targetPackage, manifest.version);

        const platforms = await this.storeBundles(username, targetPackage.id, manifest.version, input.bundles);

        await this.versionRepository.create({
            packageId: targetPackage.id,
            version: manifest.version,
            manifest: manifest as unknown as VpmManifest,
            sha256: sha256(JSON.stringify(manifest)),
            sizeBytes: platforms.reduce((total, platform) => total + platform.sizeBytes, 0),
            publishedBy: input.accountId,
            platforms
        });

        await this.refreshPackageMetadata(targetPackage, manifest, input.readme);

        return this.buildPackument(fullName);
    }

    private parseManifest(rawManifest: unknown): ReturnType<typeof publishManifestSchema.parse> {
        const parsed = publishManifestSchema.safeParse(rawManifest);
        if (!parsed.success) {
            throw new ValidationError('Invalid manifest', parsed.error.flatten());
        }
        return parsed.data;
    }

    private async resolvePackage(
        username: string,
        packageName: string,
        fullName: string,
        manifest: ReturnType<typeof publishManifestSchema.parse>,
        readme: string | undefined
    ): Promise<Package> {
        const existing = await this.packageRepository.findByFullName(fullName);
        if (existing) {
            return existing;
        }

        return this.packageRepository.create({
            username,
            name: packageName,
            fullName,
            kind: manifest.kind,
            description: manifest.description,
            keywords: manifest.keywords,
            homepage: manifest.homepage,
            repository: manifest.repository,
            distTags: {},
            downloads: { total: 0, last30d: 0 },
            readme,
            verified: false
        });
    }

    private async assertVersionIsNew(targetPackage: Package, version: string): Promise<void> {
        const existing = await this.versionRepository.findByPackageAndVersion(targetPackage.id, version);
        if (existing) {
            throw new ConflictError(`${targetPackage.fullName}@${version} is already published`);
        }
    }

    private async storeBundles(
        username: string,
        packageId: string,
        version: string,
        bundles: PublishBundle[]
    ): Promise<VersionPlatform[]> {
        const platforms: VersionPlatform[] = [];
        for (const bundle of bundles) {
            const key = `${username}/${packageId}/${version}/${bundle.tag}.tgz`;
            await this.artifactStorage.put(key, bundle.body, 'application/octet-stream');
            platforms.push({
                tag: bundle.tag,
                sha256: sha256(bundle.body),
                key,
                sizeBytes: bundle.body.length
            });
        }
        return platforms;
    }

    private async refreshPackageMetadata(
        targetPackage: Package,
        manifest: ReturnType<typeof publishManifestSchema.parse>,
        readme: string | undefined
    ): Promise<void> {
        const versions = await this.versionRepository.listByPackageId(targetPackage.id);
        const latest = versions
            .map((version) => version.version)
            .filter((version) => semver.valid(version) !== null)
            .sort(semver.rcompare)[0];

        await this.packageRepository.update(targetPackage.id, {
            kind: manifest.kind,
            description: manifest.description,
            keywords: manifest.keywords,
            homepage: manifest.homepage,
            repository: manifest.repository,
            readme: readme ?? targetPackage.readme,
            distTags: latest ? { ...targetPackage.distTags, latest } : targetPackage.distTags
        });
    }

    private async buildPackument(fullName: string): Promise<Packument> {
        const targetPackage = await this.packageRepository.findByFullName(fullName);
        if (!targetPackage) {
            throw new ValidationError(`Package ${fullName} vanished after publish`);
        }
        const versions = await this.versionRepository.listByPackageId(targetPackage.id);
        return { package: targetPackage, versions };
    }
}
