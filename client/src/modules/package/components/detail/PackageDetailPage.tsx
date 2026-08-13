import { Link, useParams } from 'react-router-dom';
import { EmptyStateRoot, buttonVariants } from '@heroui/react';
import { PackageX } from 'lucide-react';
import AppTopbar from '@/shared/presentation/components/AppTopbar';
import Loader from '@/shared/presentation/components/Loader';
import PackageDetail from '@/modules/package/components/detail/PackageDetail';
import { useGetPackumentQuery } from '@/modules/package/hooks/queries';
import { usePageTitle } from '@/shared/presentation/hooks/use-page-title';

const PackageDetailPage = () => {
    const { username = '', name = '' } = useParams<{ username: string; name: string }>();
    const params = username && name ? { username, name } : null;
    const packumentQuery = useGetPackumentQuery(params);

    usePageTitle(packumentQuery.data ? `${username}/${name}` : 'Package');

    return (
        <>
            <AppTopbar />
            {packumentQuery.isLoading ? (
                <div className='mx-auto flex w-full max-w-[1080px] justify-center px-6 py-16'>
                    <Loader size='md' aria-label='Loading package' />
                </div>
            ) : packumentQuery.data ? (
                <PackageDetail packument={packumentQuery.data} />
            ) : (
                <EmptyStateRoot className='mx-auto flex w-full max-w-[1080px] flex-col items-center gap-4 px-6 pt-24 pb-16 text-center'>
                    <div className='flex shrink-0 flex-row items-center justify-center text-muted'>
                        <PackageX size={24} />
                    </div>
                    <p className='text-base font-medium text-foreground'>Package not found.</p>
                    <Link to='/' className={buttonVariants({ variant: 'primary', size: 'sm' })}>
                        Back to packages
                    </Link>
                </EmptyStateRoot>
            )}
        </>
    );
};

export default PackageDetailPage;
