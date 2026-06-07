/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_REGISTRY_URL: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

// @types/react 18.3.x predates the Popover API attributes; declare the
// minimal surface AppToaster relies on.
import 'react';
declare module 'react' {
    interface HTMLAttributes<T> {
        popover?: '' | 'auto' | 'manual' | undefined;
    }
}
