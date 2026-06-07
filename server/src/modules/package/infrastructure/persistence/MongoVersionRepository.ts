import type {
    DeprecationInfo,
    Version
} from '@/modules/package/domain/Version.js';
import type {
    NewVersionData,
    VersionRepository
} from '@/modules/package/domain/VersionRepository.js';
import {
    VersionModel,
    type VersionDocument
} from '@/modules/package/infrastructure/persistence/VersionModel.js';
import { VersionMapper } from '@/modules/package/infrastructure/persistence/VersionMapper.js';

export class MongoVersionRepository implements VersionRepository {
    constructor(private readonly mapper: VersionMapper = new VersionMapper()) {}

    async findByPackageAndVersion(packageId: string, version: string): Promise<Version | null> {
        const record = await VersionModel.findOne({ packageId, version }).lean<VersionDocument>().exec();
        return record ? this.mapper.toDomain(record) : null;
    }

    async listByPackageId(packageId: string): Promise<Version[]> {
        const records = await VersionModel.find({ packageId }).lean<VersionDocument[]>().exec();
        return records.map((record) => this.mapper.toDomain(record));
    }

    async create(data: NewVersionData): Promise<Version> {
        const created = await VersionModel.create(data);
        return this.mapper.toDomain(created.toObject() as VersionDocument);
    }

    async markDeprecated(
        packageId: string,
        version: string,
        info: DeprecationInfo
    ): Promise<Version | null> {
        const updated = await VersionModel.findOneAndUpdate(
            { packageId, version },
            { $set: { deprecated: info } },
            { new: true }
        )
            .lean<VersionDocument>()
            .exec();
        return updated ? this.mapper.toDomain(updated) : null;
    }
}
