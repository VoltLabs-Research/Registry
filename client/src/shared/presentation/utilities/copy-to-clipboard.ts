import { sileo } from 'sileo';

interface CopyToClipboardOptions {
    successMessage?: string;
    errorMessage?: string;
};

const DEFAULT_SUCCESS_MESSAGE = 'Copied to clipboard';
const DEFAULT_ERROR_MESSAGE = 'Failed to copy to clipboard';

/** Synchronous fallback for contexts where the async Clipboard API is unavailable. */
const copyWithExecCommand = (text: string): boolean => {
    try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.top = '0';
        textarea.style.left = '0';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const copied = document.execCommand('copy');
        document.body.removeChild(textarea);
        return copied;
    } catch {
        return false;
    }
};

const writeToClipboard = async (text: string): Promise<boolean> => {
    if (navigator.clipboard?.writeText) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch {
        }
    }
    return copyWithExecCommand(text);
};

/** Copies text to the clipboard and shows consistent toast feedback. */
export const copyTextToClipboard = async (
    text: string,
    {
        successMessage = DEFAULT_SUCCESS_MESSAGE,
        errorMessage = DEFAULT_ERROR_MESSAGE
    }: CopyToClipboardOptions = {}
): Promise<boolean> => {
    const copied = await writeToClipboard(text);
    if (copied) {
        sileo.success({ title: successMessage });
        return true;
    }
    sileo.error({ title: errorMessage });
    return false;
};
