import type { PackageKind } from '@/modules/package/domain/Package.js';

export interface VpmManifest {
    name: string;
    version: string;
    kind: PackageKind;
    description?: string;
    publisher: string;
    license?: string;
    homepage?: string;
    repository?: { type: string; url: string };
    keywords?: string[];
    entrypoints?: { binary?: string; workflow?: string };
    nodeTypes?: string[];
    platforms?: string[];
    voltsdk?: string;
    coretoolkit?: string;
    files?: string[];
}

export interface VersionPlatform {
    tag: string;
    sha256: string;
    key: string;
    sizeBytes: number;
}

export interface DeprecationInfo {
    reason: string;
    at: Date;
}

export interface Version {
    id: string;
    packageId: string;
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
