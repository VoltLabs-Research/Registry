import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, BadgeCheck } from 'lucide-react';
import { Button, EmptyStateRoot, InputGroup, Kbd, Skeleton, TextField } from '@heroui/react';
import Sparkline from '@/shared/presentation/components/Sparkline';
import { useSearchPackagesQuery } from '@/modules/package/hooks/queries';
import { compactNumber } from '@/shared/utils/format';
import type { PackumentSummary } from '@/modules/package/api/entities/package/package';

const numberFormatter = new Intl.NumberFormat('en-US');

const ROW_GRID = 'grid grid-cols-[2.5rem_minmax(0,1fr)_140px_120px] items-center gap-4 max-[720px]:grid-cols-[2rem_minmax(0,1fr)_100px]';

const SKELETON_ROW_COUNT = 8;

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
        <div className='mx-auto w-full max-w-[1080px] px-6 pt-8 pb-16'>
            <TextField value={query} onChange={setQuery} aria-label='Search plugins' fullWidth>
                <InputGroup fullWidth>
                    <InputGroup.Prefix aria-hidden='true'>
                        <Search size={18} />
                    </InputGroup.Prefix>
                    <InputGroup.Input
                        ref={inputRef}
                        type='search'
                        placeholder='Search plugins.'
                    />
                    <InputGroup.Suffix aria-hidden='true'>
                        <Kbd variant='light'>/</Kbd>
                    </InputGroup.Suffix>
                </InputGroup>
            </TextField>

            <div className='mt-7 border-b border-border pb-3'>
                <span className='font-mono text-sm text-foreground'>
                    All{total === null ? '' : ` (${numberFormatter.format(total)})`}
                </span>
            </div>

            <div className='mt-6 w-full' role='table' aria-label='Plugins'>
                <div
                    className={`${ROW_GRID} border-b border-border px-2 pb-2.5 font-mono text-2xs tracking-[0.08em] text-muted uppercase`}
                    role='row'
                >
                    <span role='columnheader'>#</span>
                    <span role='columnheader'>Plugin</span>
                    <span role='columnheader' className='max-[720px]:hidden'>Activity</span>
                    <span role='columnheader' className='justify-self-end'>Installs</span>
                </div>

                {isLoading ? (
                    Array.from({ length: SKELETON_ROW_COUNT }).map((_, index) => (
                        <div
                            key={`skeleton-${index}`}
                            className={`${ROW_GRID} min-h-14 border-b border-border px-2`}
                            aria-hidden='true'
                        >
                            <Skeleton className='h-3.5 w-4 rounded-sm' />
                            <Skeleton className='h-4 w-2/5 rounded-sm' />
                            <Skeleton className='h-5 w-full rounded-sm max-[720px]:hidden' />
                            <Skeleton className='h-3.5 w-12 justify-self-end rounded-sm' />
                        </div>
                    ))
                ) : hasError ? (
                    <EmptyStateRoot className='flex flex-col items-center gap-4 px-4 py-16 text-center'>
                        <p className='text-base font-medium text-foreground'>Could not load plugins</p>
                        <p className='text-sm text-muted'>Please retry in a moment.</p>
                        <Button variant='primary' size='sm' onPress={() => searchQuery.refetch()}>
                            Retry
                        </Button>
                    </EmptyStateRoot>
                ) : rows.length === 0 ? (
                    <EmptyStateRoot className='px-4 py-16 text-center font-mono text-base text-muted'>
                        No plugins found.
                    </EmptyStateRoot>
                ) : (
                    rows.map((row, index) => (
                        <div
                            key={row.fullName}
                            className={`${ROW_GRID} min-h-14 cursor-pointer border-b border-border px-2 transition-colors hover:bg-surface focus-visible:bg-surface`}
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
                            <span className='font-mono text-sm text-muted' role='cell'>
                                {index + 1}
                            </span>
                            <span className='flex min-w-0 flex-row items-baseline gap-2' role='cell'>
                                <span className='text-base font-semibold text-foreground'>{row.name}</span>
                                <span className='truncate font-mono text-sm text-muted'>{row.fullName}</span>
                            </span>
                            <span className='max-[720px]:hidden' role='cell'>
                                <Sparkline values={row.activity} height={28} />
                            </span>
                            <span
                                className='inline-flex flex-row items-center justify-self-end gap-1.5'
                                role='cell'
                            >
                                {row.verified && (
                                    <BadgeCheck size={14} className='shrink-0 text-muted' aria-label='Verified' />
                                )}
                                <span className='font-mono text-sm text-foreground'>
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
