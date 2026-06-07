export type PackageKind = 'workflow' | 'engine' | 'lib';

export interface DownloadStats {
    total: number;
    last30d: number;
}

export interface VpmManifest {
    name: string;
    version: string;
    kind: PackageKind;
    description?: string;
    publisher: string;
    license?: string;
    keywords?: string[];
    platforms?: string[];
    voltsdk?: string;
    coretoolkit?: string;
}

export interface VersionPlatform {
    tag: string;
    sha256: string;
    key: string;
    sizeBytes: number;
}

export interface VersionMetadata {
    version: string;
    manifest: VpmManifest;
    sha256: string;
    sigEd25519?: string;
    sizeBytes: number;
    publishedAt: string;
    publishedBy: string;
    platforms: VersionPlatform[];
    deprecated?: { reason: string; at: string };
}

export interface Packument {
    fullName: string;
    username: string;
    name: string;
    kind: PackageKind;
    description?: string;
    keywords?: string[];
    homepage?: string;
    repository?: { type: string; url: string };
    distTags: Record<string, string>;
    versions: Record<string, VersionMetadata>;
    downloads: DownloadStats;
    activity?: number[];
    readme?: string;
    firstSeen?: string;
    verified?: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface PackumentSummary {
    fullName: string;
    username: string;
    name: string;
    kind: PackageKind;
    description?: string;
    latest?: string;
    downloads: DownloadStats;
    activity: number[];
    verified?: boolean;
}

export interface SearchFacets {
    kind?: Partial<Record<PackageKind, number>>;
}

export interface SearchResponse {
    items: PackumentSummary[];
    page: number;
    pageSize: number;
    total: number;
    facets?: SearchFacets;
}
