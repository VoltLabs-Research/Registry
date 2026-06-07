import type { DistTags, DownloadStats, Package, PackageKind } from '@/modules/package/domain/Package.js';

export interface PackageSearchCriteria {
    text?: string;
    kind?: PackageKind;
    page: number;
    pageSize: number;
}

export interface PackageSearchResult {
    packages: Package[];
    total: number;
}

export interface PackageKindCounts {
    all: number;
    engine: number;
    workflow: number;
    lib: number;
}

export interface NewPackageData {
    username: string;
    name: string;
    fullName: string;
    kind: PackageKind;
    description?: string;
    keywords?: string[];
    homepage?: string;
    repository?: { type: string; url: string };
    distTags: DistTags;
    downloads: DownloadStats;
    readme?: string;
    verified?: boolean;
}

export interface PackageUpdate {
    kind?: PackageKind;
    description?: string;
    keywords?: string[];
    homepage?: string;
    repository?: { type: string; url: string };
    distTags?: DistTags;
    readme?: string;
}

/**
 * Persistence port for packages. Implementations live in infrastructure and
 * translate between the storage engine and the domain entity.
 */
export interface PackageRepository {
    findByFullName(fullName: string): Promise<Package | null>;
    search(criteria: PackageSearchCriteria): Promise<PackageSearchResult>;
    countByKind(text: string | undefined): Promise<PackageKindCounts>;
    create(data: NewPackageData): Promise<Package>;
    update(id: string, changes: PackageUpdate): Promise<Package>;
}
