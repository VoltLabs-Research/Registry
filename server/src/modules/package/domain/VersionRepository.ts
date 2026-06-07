import type {
    DeprecationInfo,
    Version,
    VersionPlatform,
    VpmManifest
} from '@/modules/package/domain/Version.js';

export interface NewVersionData {
    packageId: string;
    version: string;
    manifest: VpmManifest;
    sha256: string;
    sigEd25519?: string;
    sizeBytes: number;
    publishedBy: string;
    platforms: VersionPlatform[];
}

/**
 * Persistence port for package versions.
 */
export interface VersionRepository {
    findByPackageAndVersion(packageId: string, version: string): Promise<Version | null>;
    listByPackageId(packageId: string): Promise<Version[]>;
    create(data: NewVersionData): Promise<Version>;
    markDeprecated(packageId: string, version: string, info: DeprecationInfo): Promise<Version | null>;
}
