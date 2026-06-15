import type { DistTags, Package } from '@/modules/package/domain/Package.js';
import type {
    DeprecationInfo,
    Version,
    VersionPlatform,
    VpmManifest
} from '@/modules/package/domain/Version.js';
import { resolveLatestVersion } from '@/modules/package/domain/latestVersion.js';
import type { Packument } from '@/modules/package/application/GetPackumentUseCase.js';
import type { PackageVersion } from '@/modules/package/application/GetVersionUseCase.js';

export interface VersionMetadataResponse {
    version: string;
    manifest: VpmManifest;
    sha256: string;
    sigEd25519?: string;
    sizeBytes: number;
    publishedAt: Date;
    publishedBy: string;
    platforms: VersionPlatform[];
    deprecated?: DeprecationInfo;
}

export interface PackumentResponse {
    fullName: string;
    username: string;
    name: string;
    kind: string;
    description?: string;
    keywords?: string[];
    homepage?: string;
    repository?: { type: string; url: string };
    distTags: Record<string, string>;
    versions: Record<string, VersionMetadataResponse>;
    downloads: { total: number; last30d: number };
    readme?: string;
    activity?: number[];
    firstSeen?: string;
    verified?: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface VersionResponse extends VersionMetadataResponse {
    fullName: string;
    username: string;
    name: string;
    kind: string;
}

/**
 * Shapes domain entities into the public HTTP payloads. Optional fields are
 * assigned directly; `JSON.stringify` drops the `undefined` ones, so the wire
 * format only carries present values without any conditional spreads.
 */
export class PackagePresenter {
    toPackument({ package: targetPackage, versions }: Packument): PackumentResponse {
        const keywords = targetPackage.keywords;
        const activity = targetPackage.activity;

        return {
            fullName: targetPackage.fullName,
            username: targetPackage.username,
            name: targetPackage.name,
            kind: targetPackage.kind,
            description: targetPackage.description,
            keywords: keywords && keywords.length > 0 ? keywords : undefined,
            homepage: targetPackage.homepage,
            repository: targetPackage.repository,
            distTags: this.resolveDistTags(targetPackage.distTags, versions),
            versions: this.toVersionMap(versions),
            downloads: targetPackage.downloads,
            readme: targetPackage.readme,
            activity: activity && activity.length > 0 ? activity : undefined,
            firstSeen: targetPackage.firstSeen ? targetPackage.firstSeen.toISOString() : undefined,
            verified: targetPackage.verified,
            createdAt: targetPackage.createdAt,
            updatedAt: targetPackage.updatedAt
        };
    }

    toVersion({ package: targetPackage, version }: PackageVersion): VersionResponse {
        return {
            fullName: targetPackage.fullName,
            username: targetPackage.username,
            name: targetPackage.name,
            kind: targetPackage.kind,
            ...this.toVersionMetadata(version)
        };
    }

    private toVersionMap(versions: Version[]): Record<string, VersionMetadataResponse> {
        const map: Record<string, VersionMetadataResponse> = {};
        for (const version of versions) {
            map[version.version] = this.toVersionMetadata(version);
        }
        return map;
    }

    private toVersionMetadata(version: Version): VersionMetadataResponse {
        return {
            version: version.version,
            manifest: version.manifest,
            sha256: version.sha256,
            sigEd25519: version.sigEd25519,
            sizeBytes: version.sizeBytes,
            publishedAt: version.publishedAt,
            publishedBy: version.publishedBy,
            platforms: version.platforms,
            deprecated: version.deprecated
        };
    }

    private resolveDistTags(distTags: DistTags, versions: Version[]): Record<string, string> {
        const resolved: Record<string, string> = {};
        for (const [tag, value] of Object.entries(distTags)) {
            if (value) {
                resolved[tag] = value;
            }
        }

        if (!resolved.latest) {
            const latest = resolveLatestVersion(versions.map((version) => version.version));
            if (latest) {
                resolved.latest = latest;
            }
        }

        return resolved;
    }
}
