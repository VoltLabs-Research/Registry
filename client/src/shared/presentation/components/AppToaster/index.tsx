import { Toaster } from 'sileo';
import { useEffect, useRef } from 'react';

/**
 * Renders Sileo's <Toaster /> at the application root.
 * We avoid portaling into modals because it causes the toast to visually
 * jump. Instead, we wrap the Toaster in a native popover element and
 * show it manually, which pushes it to the browser's top layer natively.
 */

const POPOVER_STYLE = {
    padding: 0,
    margin: 0,
    border: 'none',
    background: 'transparent',
    overflow: 'visible'
} as const;

const AppToaster = () => {
    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        popoverRef.current?.showPopover();
    }, []);

    return (
        <div
            ref={popoverRef}
            id='app-toaster-popover'
            popover='manual'
            style={POPOVER_STYLE}
        >
            {/*
             * Sileo v0.1.5 uses contrast-inverted fills internally
             * (THEME_FILLS maps 'light' → dark fill, 'dark' → light fill).
             * The app is dark-only, so we pass 'light' to get a dark fill.
             */}
            <Toaster position='bottom-right' theme='light' />
        </div>
    );
};

export default AppToaster;
