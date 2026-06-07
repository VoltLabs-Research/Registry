/**
 * Storage port for resolving downloadable tarball URLs. Implementations live in
 * infrastructure and delegate to the underlying object store.
 */
export interface TarballStorage {
    getSignedDownloadUrl(bucket: string, key: string, ttlSeconds: number): Promise<string>;
}
