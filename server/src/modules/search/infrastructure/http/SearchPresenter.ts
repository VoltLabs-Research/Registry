import type { Package } from '@/modules/package/domain/Package.js';
import type { PackageKindCounts } from '@/modules/package/domain/PackageRepository.js';
import type { SearchOutcome } from '@/modules/search/application/SearchUseCase.js';

export interface PackumentSummary {
    fullName: string;
    username: string;
    name: string;
    kind: string;
    description?: string;
    keywords?: string[];
    latest?: string;
    downloads: { total: number; last30d: number };
    activity?: number[];
    verified?: boolean;
    updatedAt: Date;
}

export interface SearchResponse {
    items: PackumentSummary[];
    page: number;
    pageSize: number;
    total: number;
    facets: PackageKindCounts;
}

/**
 * Shapes domain packages into the public search payload. Optional fields are
 * assigned directly; `JSON.stringify` drops the `undefined` ones, so the wire
 * format only carries present values without any conditional spreads.
 */
export class SearchPresenter {
    toResponse(outcome: SearchOutcome): SearchResponse {
        return {
            items: outcome.packages.map((targetPackage) => this.toSummary(targetPackage)),
            page: outcome.page,
            pageSize: outcome.pageSize,
            total: outcome.total,
            facets: outcome.facets
        };
    }

    private toSummary(targetPackage: Package): PackumentSummary {
        const keywords = targetPackage.keywords;
        const activity = targetPackage.activity;

        return {
            fullName: targetPackage.fullName,
            username: targetPackage.username,
            name: targetPackage.name,
            kind: targetPackage.kind,
            description: targetPackage.description,
            keywords: keywords && keywords.length > 0 ? keywords : undefined,
            latest: targetPackage.distTags.latest,
            downloads: targetPackage.downloads,
            activity: activity && activity.length > 0 ? activity : undefined,
            verified: targetPackage.verified,
            updatedAt: targetPackage.updatedAt
        };
    }
}
