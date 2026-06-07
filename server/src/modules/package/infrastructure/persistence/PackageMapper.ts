import type { DistTags, Package, PackageKind } from '@/modules/package/domain/Package.js';
import type { PackageRecord } from '@/modules/package/infrastructure/persistence/PackageModel.js';

/**
 * Translates a persisted package document into the domain entity. Optional
 * fields collapse to `undefined` so the domain never carries storage noise.
 */
export class PackageMapper {
    toDomain(record: PackageRecord): Package {
        return {
            id: record._id.toString(),
            username: record.username,
            name: record.name,
            fullName: record.fullName,
            kind: record.kind as PackageKind,
            description: record.description ?? undefined,
            keywords: record.keywords ?? [],
            homepage: record.homepage ?? undefined,
            repository: record.repository
                ? { type: record.repository.type, url: record.repository.url }
                : undefined,
            distTags: (record.distTags ?? {}) as DistTags,
            downloads: {
                total: record.downloads?.total ?? 0,
                last30d: record.downloads?.last30d ?? 0
            },
            readme: record.readme ?? undefined,
            activity: record.activity ?? undefined,
            firstSeen: record.firstSeen ?? undefined,
            verified: typeof record.verified === 'boolean' ? record.verified : undefined,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt
        };
    }
}
