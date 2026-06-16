/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_REGISTRY_URL: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

import 'react';
declare module 'react' {
    interface HTMLAttributes<T> {
        popover?: '' | 'auto' | 'manual' | undefined;
    }
}
