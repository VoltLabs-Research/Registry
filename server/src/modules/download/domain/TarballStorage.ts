import type { Readable } from 'node:stream';

/**
 * Storage port for downloading tarballs. Implementations live in infrastructure
 * and delegate to the underlying object store.
 */
export interface TarballStorage {
    getSignedDownloadUrl(bucket: string, key: string, ttlSeconds: number): Promise<string>;
    openDownloadStream(bucket: string, key: string): Promise<Readable>;
}
