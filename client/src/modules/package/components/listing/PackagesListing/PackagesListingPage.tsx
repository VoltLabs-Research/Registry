import AppTopbar from '@/shared/presentation/components/AppTopbar';
import PackagesListing from '@/modules/package/components/listing/PackagesListing';
import { usePageTitle } from '@/shared/presentation/hooks/use-page-title';

const PackagesListingPage = () => {
    usePageTitle('Packages');
    return (
        <>
            <AppTopbar />
            <PackagesListing />
        </>
    );
};

export default PackagesListingPage;
