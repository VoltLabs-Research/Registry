import { Link, useParams } from 'react-router-dom';
import AppTopbar from '@/shared/presentation/components/AppTopbar';
import PackageDetail from '@/modules/package/components/detail/PackageDetail';
import { useGetPackumentQuery } from '@/modules/package/hooks/queries';
import { usePageTitle } from '@/shared/presentation/hooks/use-page-title';
import './PackageDetailPage.css';

const PackageDetailPage = () => {
    const { username = '', name = '' } = useParams<{ username: string; name: string }>();
    const params = username && name ? { username, name } : null;
    const packumentQuery = useGetPackumentQuery(params);

    usePageTitle(packumentQuery.data ? `${username}/${name}` : 'Package');

    return (
        <>
            <AppTopbar />
            {packumentQuery.isLoading ? (
                <div className='package-detail-state'>Loading…</div>
            ) : packumentQuery.data ? (
                <PackageDetail packument={packumentQuery.data} />
            ) : (
                <div className='package-detail-state package-detail-state--center'>
                    <p>Package not found.</p>
                    <Link to='/' className='package-detail-state__link'>Back to packages</Link>
                </div>
            )}
        </>
    );
};

export default PackageDetailPage;
