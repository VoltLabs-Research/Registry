import { putObject } from '@/core/config/storage.js';
import type { PackageArtifactStorage } from '@/modules/package/domain/PackageArtifactStorage.js';

const DEFAULT_CONTENT_TYPE = 'application/octet-stream';

export class S3PackageArtifactStorage implements PackageArtifactStorage {
    constructor(private readonly bucket: string) {}

    async put(key: string, body: Buffer, contentType: string = DEFAULT_CONTENT_TYPE): Promise<void> {
        await putObject({ bucket: this.bucket, key, body, contentType });
    }
}
