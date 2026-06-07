import { z } from 'zod';
import type { UseCase } from '@/core/application/UseCase.js';
import type { Package } from '@/modules/package/domain/Package.js';
import type {
    PackageKindCounts,
    PackageRepository
} from '@/modules/package/domain/PackageRepository.js';

const querySchema = z.object({
    q: z.string().trim().min(0).max(120).optional(),
    kind: z.enum(['engine', 'workflow', 'lib']).optional(),
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(20)
});

export interface SearchOutcome {
    packages: Package[];
    page: number;
    pageSize: number;
    total: number;
    facets: PackageKindCounts;
}

export class SearchUseCase implements UseCase<unknown, SearchOutcome> {
    constructor(private readonly packageRepository: PackageRepository) {}

    async execute(rawQuery: unknown): Promise<SearchOutcome> {
        const { q, kind, page, pageSize } = querySchema.parse(rawQuery);

        const [result, facets] = await Promise.all([
            this.packageRepository.search({ text: q, kind, page, pageSize }),
            this.packageRepository.countByKind(q)
        ]);

        return {
            packages: result.packages,
            page,
            pageSize,
            total: result.total,
            facets
        };
    }
}
