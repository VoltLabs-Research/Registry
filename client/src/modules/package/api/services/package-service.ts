import { createService, get } from '@/app/core/http/utilities/create-service';
import type {
    Packument,
    PackumentSummary,
    SearchResponse
} from '@/modules/package/api/entities/package/package';
import type { PackageKind } from '@/modules/package/api/entities/package/package';

export interface SearchPackagesInput {
    q?: string;
    kind?: PackageKind;
    page?: number;
    pageSize?: number;
}

export interface PackageRouteParams {
    username: string;
    name: string;
}

interface RawSearchResponse {
    items?: Partial<PackumentSummary>[];
    page?: number;
    pageSize?: number;
    total?: number;
    facets?: SearchResponse['facets'];
}

const normalizeSummary = (raw: Partial<PackumentSummary>): PackumentSummary => ({
    fullName: raw.fullName ?? '',
    username: raw.username ?? '',
    name: raw.name ?? '',
    kind: raw.kind ?? 'lib',
    description: raw.description,
    latest: raw.latest,
    downloads: {
        total: raw.downloads?.total ?? 0,
        last30d: raw.downloads?.last30d ?? 0
    },
    activity: Array.isArray(raw.activity) ? raw.activity : [],
    verified: raw.verified
});

const normalizeSearch = (raw: RawSearchResponse): SearchResponse => ({
    items: (raw.items ?? []).map(normalizeSummary),
    page: raw.page ?? 1,
    pageSize: raw.pageSize ?? 20,
    total: raw.total ?? 0,
    facets: raw.facets
});

export const packageService = createService(
    {},
    {
        search: get<SearchPackagesInput, SearchResponse>('/-/search', {
            query: (input) => ({
                q: input.q,
                kind: input.kind,
                page: input.page,
                pageSize: input.pageSize
            }),
            map: (payload) => normalizeSearch(payload as RawSearchResponse)
        }),
        getPackument: get<PackageRouteParams, Packument>('/packages/:username/:name')
    }
);
