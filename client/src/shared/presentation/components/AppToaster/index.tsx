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

const TOASTER_DEFAULTS = {
    fill: 'var(--surface-tertiary)'
};

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
            <Toaster position='bottom-right' options={TOASTER_DEFAULTS} />
        </div>
    );
};

export default AppToaster;
