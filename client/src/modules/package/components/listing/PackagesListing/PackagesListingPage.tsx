import AppTopbar from '@/shared/presentation/components/AppTopbar';
import PackagesListing from '@/modules/package/components/listing/PackagesListing';
import { usePageTitle } from '@volt/ui';

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
