import { createBrowserRouter } from 'react-router-dom';
import NotFoundPage from '@/app/routes/NotFoundPage';
import PackagesListingPage from '@/modules/package/components/listing/PackagesListing/PackagesListingPage';
import PackageDetailPage from '@/modules/package/components/detail/PackageDetailPage';

export const router = createBrowserRouter([
    {
        path: '/',
        element: <PackagesListingPage />
    },
    {
        path: '/packages/:username/:name',
        element: <PackageDetailPage />
    },
    {
        path: '*',
        element: <NotFoundPage />
    }
]);
