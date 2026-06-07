import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, BadgeCheck } from 'lucide-react';
import Sparkline from '@/shared/presentation/primitives/Sparkline';
import Skeleton from '@/shared/presentation/primitives/Skeleton';
import EmptyState from '@/shared/presentation/primitives/EmptyState';
import { useSearchPackagesQuery } from '@/modules/package/hooks/queries';
import { compactNumber } from '@/shared/utils/format';
import type { PackumentSummary } from '@/modules/package/api/entities/package/package';
import './PackagesListing.css';

const numberFormatter = new Intl.NumberFormat('en-US');

const useDebounced = <T,>(value: T, delay: number): T => {
    const [debounced, setDebounced] = useState<T>(value);
    useEffect(() => {
        const handle = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(handle);
    }, [value, delay]);
    return debounced;
};

const PackagesListing = () => {
    const navigate = useNavigate();
    const inputRef = useRef<HTMLInputElement>(null);
    const [query, setQuery] = useState('');
    const debouncedQuery = useDebounced(query, 250);

    const searchInput = useMemo(() => ({
        q: debouncedQuery.trim() || undefined,
        page: 1,
        pageSize: 50
    }), [debouncedQuery]);

    const searchQuery = useSearchPackagesQuery(searchInput);
    const rows: PackumentSummary[] = searchQuery.data?.items ?? [];
    const isLoading = searchQuery.isLoading;
    const hasError = searchQuery.isError;
    const total = searchQuery.data?.total ?? null;

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key !== '/') return;
            const target = event.target as HTMLElement | null;
            const tag = target?.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return;
            event.preventDefault();
            inputRef.current?.focus();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleRowClick = (row: PackumentSummary) => {
        navigate(`/packages/${row.username}/${row.name}`);
    };

    return (
        <div className='packages-listing'>
            <div className='packages-listing__search'>
                <Search size={18} className='packages-listing__search-icon' aria-hidden='true' />
                <input
                    ref={inputRef}
                    type='search'
                    className='packages-listing__search-input'
                    value={query}
                    onChange={(event) => setQuery(event.currentTarget.value)}
                    placeholder='Search plugins.'
                    aria-label='Search plugins'
                />
                <span className='packages-listing__search-hint' aria-hidden='true'>/</span>
            </div>

            <nav className='packages-listing__tabs' aria-label='Plugins'>
                <span className='packages-listing__tab packages-listing__tab--active' aria-current='true'>
                    All{total === null ? '' : ` (${numberFormatter.format(total)})`}
                </span>
            </nav>

            <div className='packages-listing__table' role='table' aria-label='Plugins'>
                <div className='packages-listing__head' role='row'>
                    <span className='packages-listing__col packages-listing__col--rank' role='columnheader'>#</span>
                    <span className='packages-listing__col packages-listing__col--package' role='columnheader'>Plugin</span>
                    <span className='packages-listing__col packages-listing__col--activity' role='columnheader'>Activity</span>
                    <span className='packages-listing__col packages-listing__col--installs' role='columnheader'>Installs</span>
                </div>

                {isLoading ? (
                    Array.from({ length: 8 }).map((_, index) => (
                        <div key={`skeleton-${index}`} className='packages-listing__row' aria-hidden='true'>
                            <span className='packages-listing__col packages-listing__col--rank'>
                                <Skeleton width={16} height={14} />
                            </span>
                            <span className='packages-listing__col packages-listing__col--package'>
                                <Skeleton width='40%' height={16} />
                            </span>
                            <span className='packages-listing__col packages-listing__col--activity'>
                                <Skeleton width={120} height={20} />
                            </span>
                            <span className='packages-listing__col packages-listing__col--installs'>
                                <Skeleton width={48} height={14} />
                            </span>
                        </div>
                    ))
                ) : hasError ? (
                    <div className='packages-listing__empty'>
                        <EmptyState
                            title='Could not load plugins'
                            description='Please retry in a moment.'
                            buttonText='Retry'
                            buttonOnClick={() => searchQuery.refetch()}
                        />
                    </div>
                ) : rows.length === 0 ? (
                    <div className='packages-listing__empty'>No plugins found.</div>
                ) : (
                    rows.map((row, index) => (
                        <div
                            key={row.fullName}
                            className='packages-listing__row packages-listing__row--clickable'
                            role='row'
                            tabIndex={0}
                            onClick={() => handleRowClick(row)}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault();
                                    handleRowClick(row);
                                }
                            }}
                        >
                            <span className='packages-listing__col packages-listing__col--rank' role='cell'>
                                {index + 1}
                            </span>
                            <span className='packages-listing__col packages-listing__col--package' role='cell'>
                                <span className='packages-listing__name'>{row.name}</span>
                                <span className='packages-listing__path'>{row.fullName}</span>
                            </span>
                            <span className='packages-listing__col packages-listing__col--activity' role='cell'>
                                <Sparkline points={row.activity} width={120} height={28} />
                            </span>
                            <span className='packages-listing__col packages-listing__col--installs' role='cell'>
                                {row.verified && (
                                    <BadgeCheck size={14} className='packages-listing__verified' aria-label='Verified' />
                                )}
                                <span className='packages-listing__installs-value'>
                                    {compactNumber(row.downloads.total)}
                                </span>
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default PackagesListing;
