import { Link } from 'react-router-dom';
import { BadgeCheck } from 'lucide-react';
import { Sparkline } from '@voltstack/bravais';
import MarkdownView from '@/shared/presentation/components/MarkdownView';
import { compactNumber, formatDate } from '@/shared/utils/format';
import type { Packument } from '@/modules/package/api/entities/package/package';
import './PackageDetail.css';

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
    <div className='package-detail__section-label'>
        <span>{children}</span>
        <hr className='package-detail__hairline' />
    </div>
);

const PackageDetail = ({ packument }: PackageDetailProps) => {
    const activity = packument.activity ?? [];
    const latestVersion = packument.distTags.latest;
    const versions = Object.values(packument.versions).sort((a, b) =>
        compareVersionsDescending(a.version, b.version)
    );

    return (
        <div className='package-detail'>
            <nav className='package-detail__breadcrumb' aria-label='Breadcrumb'>
                <Link to='/' className='package-detail__breadcrumb-link'>packages</Link>
                <span className='package-detail__breadcrumb-sep'>/</span>
                <span>{packument.username}</span>
                <span className='package-detail__breadcrumb-sep'>/</span>
                <span>{packument.name}</span>
            </nav>

            <h1 className='package-detail__title'>{packument.name}</h1>
            <span className='package-detail__kind'>Plugin</span>

            <div className='package-detail__layout'>
                <div className='package-detail__main'>
                    {packument.readme && packument.readme.trim().length > 0 ? (
                        <MarkdownView markdown={packument.readme} />
                    ) : (
                        <p className='package-detail__muted'>No README provided.</p>
                    )}
                </div>

                <aside className='package-detail__sidebar'>
                    <div className='package-detail__block'>
                        <SectionLabel>Installs</SectionLabel>
                        <div className='package-detail__installs'>{compactNumber(packument.downloads.total)}</div>
                        {activity.length > 0 && (
                            <div className='package-detail__sidebar-spark'>
                                <Sparkline color='var(--color-text-secondary)' values={activity} width={260} height={40} />
                            </div>
                        )}
                    </div>

                    {packument.repository && (
                        <div className='package-detail__block'>
                            <SectionLabel>Repository</SectionLabel>
                            <div className='package-detail__repo'>
                                {packument.verified && (
                                    <BadgeCheck size={14} className='package-detail__verified' aria-label='Verified' />
                                )}
                                <a
                                    href={packument.repository.url}
                                    target='_blank'
                                    rel='noreferrer'
                                    className='package-detail__repo-link'
                                >
                                    {stripGithubPrefix(packument.repository.url)}
                                </a>
                            </div>
                        </div>
                    )}

                    {versions.length > 0 && (
                        <div className='package-detail__block'>
                            <SectionLabel>Versions</SectionLabel>
                            <ul className='package-detail__versions'>
                                {versions.map((version) => (
                                    <li key={version.version} className='package-detail__version'>
                                        <span className='package-detail__version-name'>{version.version}</span>
                                        <span className='package-detail__version-date'>{formatDate(version.publishedAt)}</span>
                                        {version.deprecated && (
                                            <span className='package-detail__version-tag package-detail__version-tag--deprecated'>
                                                deprecated
                                            </span>
                                        )}
                                        {version.version === latestVersion && (
                                            <span className='package-detail__version-tag package-detail__version-tag--latest'>
                                                latest
                                            </span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {packument.firstSeen && (
                        <div className='package-detail__block'>
                            <SectionLabel>First seen</SectionLabel>
                            <div className='package-detail__first-seen'>{formatDate(packument.firstSeen)}</div>
                        </div>
                    )}
                </aside>
            </div>
        </div>
    );
};

export default PackageDetail;
