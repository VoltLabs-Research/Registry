import semver from 'semver';

export const resolveLatestVersion = (versions: string[]): string | undefined =>
    versions
        .filter((version) => semver.valid(version) !== null)
        .sort(semver.rcompare)[0];
