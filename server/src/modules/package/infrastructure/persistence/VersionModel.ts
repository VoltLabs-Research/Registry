import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const platformSchema = new Schema(
    {
        tag: { type: String, required: true },
        sha256: { type: String, required: true },
        key: { type: String, required: true },
        sizeBytes: { type: Number, required: true }
    },
    { _id: false }
);

const manifestSchema = new Schema({}, { strict: false, _id: false });

const deprecationSchema = new Schema(
    {
        reason: { type: String, required: true },
        at: { type: Date, required: true }
    },
    { _id: false }
);

const versionSchema = new Schema(
    {
        packageId: { type: Schema.Types.ObjectId, ref: 'Package', required: true, index: true },
        version: { type: String, required: true, index: true },
        manifest: { type: manifestSchema, required: true },
        sha256: { type: String, required: true },
        sigEd25519: { type: String },
        sizeBytes: { type: Number, required: true, default: 0 },
        publishedAt: { type: Date, required: true, default: () => new Date() },
        publishedBy: { type: String, required: true },
        platforms: { type: [platformSchema], default: [] },
        deprecated: { type: deprecationSchema }
    },
    { timestamps: false }
);

versionSchema.index({ packageId: 1, version: 1 }, { unique: true });

export type VersionDocument = InferSchemaType<typeof versionSchema> & {
    _id: mongoose.Types.ObjectId;
};

export type VersionModelType = Model<VersionDocument>;

export const VersionModel: VersionModelType =
    (mongoose.models.Version as VersionModelType | undefined) ??
    mongoose.model<VersionDocument>('Version', versionSchema);
