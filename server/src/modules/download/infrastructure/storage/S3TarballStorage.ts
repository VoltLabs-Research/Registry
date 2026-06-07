import { getSignedDownloadUrl } from '@/core/config/storage.js';
import type { TarballStorage } from '@/modules/download/domain/TarballStorage.js';

export class S3TarballStorage implements TarballStorage {
    getSignedDownloadUrl(bucket: string, key: string, ttlSeconds: number): Promise<string> {
        return getSignedDownloadUrl(bucket, key, ttlSeconds);
    }
}
