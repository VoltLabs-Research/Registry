import { useQuery } from '@tanstack/react-query';
import { packageService } from '@/modules/package/api/services/package-service';
import type {
    PackageRouteParams,
    SearchPackagesInput
} from '@/modules/package/api/services/package-service';
import type { Packument, SearchResponse } from '@/modules/package/api/entities/package/package';

export const PACKAGE_QUERY_KEYS = {
    search: (input: SearchPackagesInput) => ['package', 'search', input] as const,
    packument: (params: PackageRouteParams) => ['package', 'packument', params] as const
};

export const useSearchPackagesQuery = (input: SearchPackagesInput) => {
    return useQuery<SearchResponse, Error>({
        queryKey: PACKAGE_QUERY_KEYS.search(input),
        queryFn: () => packageService.search(input)
    });
};

export const useGetPackumentQuery = (params: PackageRouteParams | null) => {
    return useQuery<Packument, Error>({
        queryKey: PACKAGE_QUERY_KEYS.packument(params ?? { username: '', name: '' }),
        queryFn: () => packageService.getPackument(params as PackageRouteParams),
        enabled: params !== null
    });
};
