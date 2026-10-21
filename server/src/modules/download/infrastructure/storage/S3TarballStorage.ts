import type { Readable } from 'node:stream';
import { getObjectStream, getSignedDownloadUrl } from '@/core/config/storage.js';
import type { TarballStorage } from '@/modules/download/domain/TarballStorage.js';

export class S3TarballStorage implements TarballStorage {
    getSignedDownloadUrl(bucket: string, key: string, ttlSeconds: number): Promise<string> {
        return getSignedDownloadUrl(bucket, key, ttlSeconds);
    }

    openDownloadStream(bucket: string, key: string): Promise<Readable> {
        return getObjectStream(bucket, key);
    }
}
