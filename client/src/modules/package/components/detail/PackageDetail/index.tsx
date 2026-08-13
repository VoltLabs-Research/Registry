import { Link } from 'react-router-dom';
import { BadgeCheck } from 'lucide-react';
import { Chip, Separator } from '@heroui/react';
import Sparkline from '@/shared/presentation/components/Sparkline';
import MarkdownView from '@/shared/presentation/components/MarkdownView';
import { compactNumber, formatDate } from '@/shared/utils/format';
import type { Packument } from '@/modules/package/api/entities/package/package';

interface PackageDetailProps {
    packument: Packument;
}

const stripGithubPrefix = (url: string): string =>
    url.replace(/^https?:\/\/github\.com\//i, '').replace(/\.git$/i, '').replace(/\/$/, '');

const compareVersionsDescending = (a: string, b: string): number => {
    const segmentsOf = (version: string): number[] =>
        version
            .split('-')[0]
            .split('.')
            .map((segment) => Number.parseInt(segment, 10) || 0);
    const left = segmentsOf(a);
    const right = segmentsOf(b);
    const length = Math.max(left.length, right.length);
    for(let index = 0; index < length; index++){
        const diff = (right[index] ?? 0) - (left[index] ?? 0);
        if(diff !== 0) return diff;
    }
    return b.localeCompare(a);
};

interface SectionLabelProps {
    children: string;
}

const SectionLabel = ({ children }: SectionLabelProps) => (
    <div className='mb-3 flex flex-row items-center gap-3.5'>
        <span className='font-mono text-xs tracking-[0.08em] whitespace-nowrap text-muted uppercase'>
            {children}
        </span>
        <Separator className='flex-1' />
    </div>
);

const PackageDetail = ({ packument }: PackageDetailProps) => {
    const activity = packument.activity ?? [];
    const latestVersion = packument.distTags.latest;
    const versions = Object.values(packument.versions).sort((a, b) =>
        compareVersionsDescending(a.version, b.version)
    );

    return (
        <div className='mx-auto w-full max-w-[1080px] px-6 pt-4 pb-16'>
            <nav
                className='flex flex-row items-center gap-1.5 font-mono text-sm text-muted'
                aria-label='Breadcrumb'
            >
                <Link to='/' className='text-muted no-underline transition-colors hover:text-foreground'>
                    packages
                </Link>
                <span className='opacity-60' aria-hidden='true'>/</span>
                <span>{packument.username}</span>
                <span className='opacity-60' aria-hidden='true'>/</span>
                <span>{packument.name}</span>
            </nav>

            <h1 className='mt-3 text-4xl leading-tight font-bold tracking-[-0.03em] text-foreground max-md:text-3xl'>
                {packument.name}
            </h1>
            <Chip variant='soft' size='sm' className='mt-3.5 font-mono'>Plugin</Chip>

            <div className='mt-10 grid grid-cols-[minmax(0,1fr)_300px] gap-12 max-[900px]:grid-cols-[minmax(0,1fr)] max-[900px]:gap-10'>
                <div className='flex min-w-0 flex-col gap-9'>
                    {packument.readme && packument.readme.trim().length > 0 ? (
                        <MarkdownView markdown={packument.readme} />
                    ) : (
                        <p className='text-base text-muted'>No README provided.</p>
                    )}
                </div>

                <aside className='flex flex-col gap-6'>
                    <div className='flex flex-col'>
                        <SectionLabel>Installs</SectionLabel>
                        <div className='text-3xl leading-tight font-semibold text-foreground tabular-nums'>
                            {compactNumber(packument.downloads.total)}
                        </div>
                        {activity.length > 0 && (
                            <Sparkline values={activity} height={40} className='mt-3' />
                        )}
                    </div>

                    {packument.repository && (
                        <div className='flex flex-col'>
                            <SectionLabel>Repository</SectionLabel>
                            <div className='flex flex-row items-center gap-1.5'>
                                {packument.verified && (
                                    <BadgeCheck size={14} className='shrink-0 text-muted' aria-label='Verified' />
                                )}
                                <a
                                    href={packument.repository.url}
                                    target='_blank'
                                    rel='noreferrer'
                                    className='truncate font-mono text-sm text-foreground underline decoration-border underline-offset-2 transition-colors hover:decoration-foreground'
                                >
                                    {stripGithubPrefix(packument.repository.url)}
                                </a>
                            </div>
                        </div>
                    )}

                    {versions.length > 0 && (
                        <div className='flex flex-col'>
                            <SectionLabel>Versions</SectionLabel>
                            <ul className='flex list-none flex-col gap-1.5 p-0'>
                                {versions.map((version) => (
                                    <li
                                        key={version.version}
                                        className='flex flex-row items-center gap-2 font-mono text-sm'
                                    >
                                        <span className='text-foreground'>{version.version}</span>
                                        <span className='ml-auto text-xs text-muted'>
                                            {formatDate(version.publishedAt)}
                                        </span>
                                        {version.deprecated && (
                                            <span className='rounded-sm border border-warning-soft-foreground/40 px-1.5 text-2xs tracking-[0.04em] text-warning-soft-foreground'>
                                                deprecated
                                            </span>
                                        )}
                                        {version.version === latestVersion && (
                                            <span className='rounded-sm border border-border px-1.5 text-2xs tracking-[0.04em] text-foreground'>
                                                latest
                                            </span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {packument.firstSeen && (
                        <div className='flex flex-col'>
                            <SectionLabel>First seen</SectionLabel>
                            <div className='font-mono text-base text-foreground'>
                                {formatDate(packument.firstSeen)}
                            </div>
                        </div>
                    )}
                </aside>
            </div>
        </div>
    );
};

export default PackageDetail;
