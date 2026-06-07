import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { request } from 'undici';
import env from '@/core/config/env.js';
import logger from '@/core/config/logger.js';
import { connectDatabase, disconnectDatabase } from '@/core/config/db.js';
import { headObject, putObject } from '@/core/config/storage.js';
import { PackageModel } from '@/modules/package/infrastructure/persistence/PackageModel.js';
import { VersionModel } from '@/modules/package/infrastructure/persistence/VersionModel.js';

interface LegacyPlatformEntry {
    url?: string;
    sha256?: string;
}

interface LegacyVersionEntry {
    [platform: string]: LegacyPlatformEntry;
}

interface LegacyKeyEntry {
    publisher: string;
    latest?: string;
    versions: Record<string, LegacyVersionEntry>;
}

interface LegacyIndex {
    plugins: Record<string, Record<string, LegacyKeyEntry>>;
}

const FALLBACK_LOCAL_PATH = '/home/rodyherrera/Desktop/dev/Volt/server/static/plugin-registry/index.json';

const parseArgs = (): { source: string | null } => {
    const args = process.argv.slice(2);
    let source: string | null = null;
    for (let i = 0; i < args.length; i += 1) {
        if (args[i] === '--source' && args[i + 1]) {
            source = args[i + 1] ?? null;
            i += 1;
        }
    }
    return { source };
};

const loadLegacyIndex = async (source: string | null): Promise<LegacyIndex> => {
    if (source && existsSync(source)) {
        const raw = await readFile(source, 'utf-8');
        return JSON.parse(raw) as LegacyIndex;
    }

    const url = source ?? env.LEGACY_INDEX_URL;
    try {
        const response = await request(url, { method: 'GET' });
        if (response.statusCode >= 200 && response.statusCode < 300) {
            const text = await response.body.text();
            return JSON.parse(text) as LegacyIndex;
        }
        logger.warn({ status: response.statusCode, url }, 'remote index unreachable, trying local fallback');
    } catch (err) {
        logger.warn(
            { err: err instanceof Error ? err.message : String(err), url },
            'remote index fetch failed, trying local fallback'
        );
    }

    if (existsSync(FALLBACK_LOCAL_PATH)) {
        const raw = await readFile(FALLBACK_LOCAL_PATH, 'utf-8');
        return JSON.parse(raw) as LegacyIndex;
    }

    throw new Error(`Unable to load legacy index from ${url} or ${FALLBACK_LOCAL_PATH}`);
};

const ensurePackage = async (
    username: string,
    name: string
): Promise<{ id: string; fullName: string }> => {
    const lowercase = username.toLowerCase();
    const fullName = `@${lowercase}/${name}`;
    const found = await PackageModel.findOne({ fullName });
    if (found) {
        return { id: found._id.toString(), fullName };
    }
    const created = await PackageModel.create({
        username: lowercase,
        name,
        fullName,
        kind: 'engine',
        keywords: [],
        distTags: {},
        downloads: { total: 0, last30d: 0 }
    });
    logger.info({ fullName }, 'package created');
    return { id: created._id.toString(), fullName };
};

const downloadTarball = async (url: string): Promise<Buffer> => {
    const response = await request(url, { method: 'GET', maxRedirections: 5 });
    if (response.statusCode < 200 || response.statusCode >= 300) {
        throw new Error(`Download ${url} failed status=${response.statusCode}`);
    }
    const arrayBuffer = await response.body.arrayBuffer();
    return Buffer.from(arrayBuffer);
};

const sha256Hex = (buffer: Buffer): string => createHash('sha256').update(buffer).digest('hex');

interface PlatformIngestResult {
    tag: string;
    key: string;
    sha256: string;
    sizeBytes: number;
}

const ingestPlatform = async (params: {
    username: string;
    packageId: string;
    version: string;
    platform: string;
    url: string;
    expectedSha256?: string;
}): Promise<PlatformIngestResult | null> => {
    const { username, packageId, version, platform, url, expectedSha256 } = params;
    const key = `${username}/${packageId}/${version}/${platform}.tgz`;

    if (await headObject(env.RUSTFS_TARBALL_BUCKET, key)) {
        logger.debug({ key }, 'object exists, skipping upload');
        if (!expectedSha256) {
            return { tag: platform, key, sha256: '', sizeBytes: 0 };
        }
        return { tag: platform, key, sha256: expectedSha256, sizeBytes: 0 };
    }

    const buffer = await downloadTarball(url);
    const actualSha = sha256Hex(buffer);
    if (expectedSha256 && expectedSha256.toLowerCase() !== actualSha) {
        logger.error(
            { expected: expectedSha256, actual: actualSha, url },
            'sha256 mismatch, skipping'
        );
        return null;
    }

    await putObject({
        bucket: env.RUSTFS_TARBALL_BUCKET,
        key,
        body: buffer,
        contentType: 'application/gzip'
    });

    return {
        tag: platform,
        key,
        sha256: actualSha,
        sizeBytes: buffer.byteLength
    };
};

const upsertVersion = async (params: {
    packageId: string;
    name: string;
    fullName: string;
    publisher: string;
    version: string;
    platforms: PlatformIngestResult[];
}): Promise<void> => {
    const existing = await VersionModel.findOne({
        packageId: params.packageId,
        version: params.version
    });

    const aggregateSha = params.platforms.length > 0
        ? createHash('sha256')
            .update(params.platforms.map((p) => p.sha256).sort().join('\n'))
            .digest('hex')
        : '';

    const sizeBytes = params.platforms.reduce((sum, p) => sum + p.sizeBytes, 0);

    const manifest = {
        name: params.fullName,
        version: params.version,
        kind: 'engine' as const,
        publisher: params.publisher,
        platforms: params.platforms.map((p) => p.tag)
    };

    if (existing) {
        existing.set(
            'platforms',
            params.platforms.map((p) => ({
                tag: p.tag,
                sha256: p.sha256,
                key: p.key,
                sizeBytes: p.sizeBytes
            }))
        );
        existing.sizeBytes = sizeBytes;
        if (!existing.sha256) {
            existing.sha256 = aggregateSha;
        }
        await existing.save();
        return;
    }

    await VersionModel.create({
        packageId: params.packageId,
        version: params.version,
        manifest,
        sha256: aggregateSha,
        sizeBytes,
        publishedAt: new Date(),
        publishedBy: env.SYSTEM_ACCOUNT_ID,
        platforms: params.platforms.map((p) => ({
            tag: p.tag,
            sha256: p.sha256,
            key: p.key,
            sizeBytes: p.sizeBytes
        }))
    });
};

const updateDistTag = async (
    packageId: string,
    latest: string | undefined
): Promise<void> => {
    if (!latest) {
        return;
    }
    const pkg = await PackageModel.findById(packageId);
    if (!pkg) {
        return;
    }
    const existingDistTags = (pkg.distTags ?? {}) as Record<string, string>;
    pkg.set('distTags', { ...existingDistTags, latest });
    await pkg.save();
};

const main = async (): Promise<void> => {
    const { source } = parseArgs();
    await connectDatabase();
    try {
        const index = await loadLegacyIndex(source);
        const publishers = Object.keys(index.plugins ?? {});
        logger.info({ publishers }, 'starting legacy import');

        for (const publisher of publishers) {
            const keys = index.plugins[publisher] ?? {};
            for (const [key, entry] of Object.entries(keys)) {
                const pkg = await ensurePackage(publisher, key);
                const versionEntries = Object.entries(entry.versions ?? {});
                for (const [version, platforms] of versionEntries) {
                    const platformEntries = Object.entries(platforms);
                    if (platformEntries.length === 0) {
                        logger.info({ fullName: pkg.fullName, version }, 'no platforms, skipping');
                        continue;
                    }

                    const ingested: PlatformIngestResult[] = [];
                    for (const [platform, plat] of platformEntries) {
                        if (!plat || !plat.url) {
                            continue;
                        }
                        try {
                            const result = await ingestPlatform({
                                username: publisher,
                                packageId: pkg.id,
                                version,
                                platform,
                                url: plat.url,
                                ...(plat.sha256 ? { expectedSha256: plat.sha256 } : {})
                            });
                            if (result) {
                                ingested.push(result);
                                logger.info(
                                    { fullName: pkg.fullName, version, platform },
                                    'platform ingested'
                                );
                            }
                        } catch (err) {
                            logger.error(
                                {
                                    fullName: pkg.fullName,
                                    version,
                                    platform,
                                    err: err instanceof Error ? err.message : String(err)
                                },
                                'platform ingestion failed'
                            );
                        }
                    }

                    if (ingested.length === 0) {
                        continue;
                    }

                    await upsertVersion({
                        packageId: pkg.id,
                        name: key,
                        fullName: pkg.fullName,
                        publisher,
                        version,
                        platforms: ingested
                    });
                }

                await updateDistTag(pkg.id, entry.latest);
            }
        }

        logger.info('legacy import complete');
    } finally {
        await disconnectDatabase();
    }
};

main().catch((err) => {
    logger.error({ err: err instanceof Error ? err.message : String(err) }, 'legacy import failed');
    process.exit(1);
});
