export type PackageKind = 'engine' | 'workflow' | 'lib';

export interface DistTags {
    latest?: string;
    [tag: string]: string | undefined;
}

export interface DownloadStats {
    total: number;
    last30d: number;
}

export interface Package {
    id: string;
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
    activity?: number[];
    firstSeen?: Date;
    verified?: boolean;
    createdAt: Date;
    updatedAt: Date;
}
