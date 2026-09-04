import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from '@/app/App';
import { AppToaster } from '@volt/ui';

import '@volt/ui/fonts.css';
import '@volt/ui/index.css';

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
