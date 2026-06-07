import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const distTagsSchema = new Schema({}, { strict: false, _id: false });

const repositorySchema = new Schema(
    {
        type: { type: String, required: true },
        url: { type: String, required: true }
    },
    { _id: false }
);

const downloadStatsSchema = new Schema(
    {
        total: { type: Number, default: 0 },
        last30d: { type: Number, default: 0 }
    },
    { _id: false }
);

const packageSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            lowercase: true,
            index: true
        },
        name: { type: String, required: true, lowercase: true, index: true },
        fullName: { type: String, required: true, unique: true, index: true },
        kind: { type: String, enum: ['engine', 'workflow', 'lib'], required: true },
        description: { type: String },
        keywords: { type: [String], default: [] },
        homepage: { type: String },
        repository: { type: repositorySchema },
        distTags: { type: distTagsSchema, default: () => ({}) },
        downloads: { type: downloadStatsSchema, default: () => ({ total: 0, last30d: 0 }) },
        readme: { type: String },
        activity: { type: [Number], default: undefined },
        firstSeen: { type: Date },
        verified: { type: Boolean }
    },
    { timestamps: true }
);

packageSchema.index({ username: 1, name: 1 }, { unique: true });
packageSchema.index(
    { name: 'text', description: 'text', keywords: 'text' },
    { weights: { name: 5, keywords: 3, description: 1 } }
);

export type PackageDocument = InferSchemaType<typeof packageSchema> & {
    _id: mongoose.Types.ObjectId;
};

export type PackageRecord = PackageDocument & {
    createdAt: Date;
    updatedAt: Date;
};

export type PackageModelType = Model<PackageDocument>;

export const PackageModel: PackageModelType =
    (mongoose.models.Package as PackageModelType | undefined) ??
    mongoose.model<PackageDocument>('Package', packageSchema);
