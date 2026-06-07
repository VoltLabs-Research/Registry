import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from '@/app/App';
import AppToaster from '@/shared/presentation/components/AppToaster';

import '@/shared/presentation/assets/stylesheets/fonts.css';
import '@/shared/presentation/assets/stylesheets/theme.css';
import '@/shared/presentation/assets/stylesheets/base.css';
import '@/shared/presentation/assets/stylesheets/general.css';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            retry: 1,
            refetchOnWindowFocus: false
        }
    }
});

const container = document.getElementById('root');
if (!container) {
    throw new Error('Root container not found');
}

createRoot(container).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <App />
            <AppToaster />
        </QueryClientProvider>
    </StrictMode>
);
