import type { FilterQuery } from 'mongoose';
import type { Package } from '@/modules/package/domain/Package.js';
import type {
    NewPackageData,
    PackageKindCounts,
    PackageRepository,
    PackageSearchCriteria,
    PackageSearchResult,
    PackageUpdate
} from '@/modules/package/domain/PackageRepository.js';
import {
    PackageModel,
    type PackageDocument,
    type PackageRecord
} from '@/modules/package/infrastructure/persistence/PackageModel.js';
import { PackageMapper } from '@/modules/package/infrastructure/persistence/PackageMapper.js';

const escapeRegex = (input: string): string => input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export class MongoPackageRepository implements PackageRepository {
    constructor(private readonly mapper: PackageMapper = new PackageMapper()) {}

    async findByFullName(fullName: string): Promise<Package | null> {
        const record = await PackageModel.findOne({ fullName }).lean<PackageRecord>().exec();
        return record ? this.mapper.toDomain(record) : null;
    }

    async search(criteria: PackageSearchCriteria): Promise<PackageSearchResult> {
        const filter = this.buildFilter(criteria.text, criteria.kind);
        const skip = (criteria.page - 1) * criteria.pageSize;

        const [records, total] = await Promise.all([
            PackageModel.find(filter)
                .sort({ 'downloads.total': -1, updatedAt: -1 })
                .skip(skip)
                .limit(criteria.pageSize)
                .lean<PackageRecord[]>()
                .exec(),
            PackageModel.countDocuments(filter)
        ]);

        return {
            packages: records.map((record) => this.mapper.toDomain(record)),
            total
        };
    }

    async countByKind(text: string | undefined): Promise<PackageKindCounts> {
        const filter = this.buildFilter(text, undefined);
        const grouped = await PackageModel.aggregate<{ _id: string; count: number }>([
            { $match: filter },
            { $group: { _id: '$kind', count: { $sum: 1 } } }
        ]);

        const counts: PackageKindCounts = { all: 0, engine: 0, workflow: 0, lib: 0 };
        for (const group of grouped) {
            counts.all += group.count;
            if (group._id === 'engine' || group._id === 'workflow' || group._id === 'lib') {
                counts[group._id] = group.count;
            }
        }
        return counts;
    }

    async create(data: NewPackageData): Promise<Package> {
        const created = await PackageModel.create(data);
        return this.mapper.toDomain(created.toObject() as PackageRecord);
    }

    async update(id: string, changes: PackageUpdate): Promise<Package> {
        const updated = await PackageModel.findByIdAndUpdate(id, { $set: changes }, { new: true })
            .lean<PackageRecord>()
            .exec();
        if (!updated) {
            throw new Error(`Package ${id} disappeared during update`);
        }
        return this.mapper.toDomain(updated);
    }

    private buildFilter(text: string | undefined, kind: string | undefined): FilterQuery<PackageDocument> {
        const filter: FilterQuery<PackageDocument> = {};

        if (text && text.length > 0) {
            const safeText = escapeRegex(text);
            filter.$or = [
                { name: { $regex: safeText, $options: 'i' } },
                { description: { $regex: safeText, $options: 'i' } },
                { keywords: { $regex: safeText, $options: 'i' } }
            ];
        }

        if (kind) {
            filter.kind = kind;
        }

        return filter;
    }
}
