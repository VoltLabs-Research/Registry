/**
 * Persistence port for package bundle artifacts (the per-platform tarballs).
 * The key is the object path within the artifact bucket.
 */
export interface PackageArtifactStorage {
    put(key: string, body: Buffer, contentType?: string): Promise<void>;
}
