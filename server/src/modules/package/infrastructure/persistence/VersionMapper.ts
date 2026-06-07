import type { Version, VpmManifest } from '@/modules/package/domain/Version.js';
import type { VersionDocument } from '@/modules/package/infrastructure/persistence/VersionModel.js';

/**
 * Translates a persisted version document into the domain entity.
 */
export class VersionMapper {
    toDomain(record: VersionDocument): Version {
        return {
            id: record._id.toString(),
            packageId: record.packageId.toString(),
            version: record.version,
            manifest: record.manifest as unknown as VpmManifest,
            sha256: record.sha256,
            sigEd25519: record.sigEd25519 ?? undefined,
            sizeBytes: record.sizeBytes,
            publishedAt: record.publishedAt,
            publishedBy: record.publishedBy,
            platforms: record.platforms.map((platform) => ({
                tag: platform.tag,
                sha256: platform.sha256,
                key: platform.key,
                sizeBytes: platform.sizeBytes
            })),
            deprecated: record.deprecated
                ? { reason: record.deprecated.reason, at: record.deprecated.at }
                : undefined
        };
    }
}
