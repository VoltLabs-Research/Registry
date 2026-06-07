import { useEffect, useMemo, useRef } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { copyTextToClipboard } from '@/shared/presentation/utilities/copy-to-clipboard';
import './markdown.css';

interface MarkdownViewProps {
    markdown: string;
    className?: string;
}

const COPY_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>';

const MarkdownView = ({ markdown, className }: MarkdownViewProps) => {
    const containerRef = useRef<HTMLDivElement>(null);

    const html = useMemo(() => {
        const parsed = marked.parse(markdown, { async: false, gfm: true, breaks: false });
        return DOMPurify.sanitize(parsed as string);
    }, [markdown]);

    useEffect(() => {
        const root = containerRef.current;
        if (!root) return;

        const cleanups: Array<() => void> = [];
        root.querySelectorAll('pre').forEach((pre) => {
            if (pre.querySelector('.markdown-copy-btn')) return;
            const code = pre.querySelector('code');
            const text = (code ?? pre).textContent ?? '';
            if (!text.trim()) return;

            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'markdown-copy-btn';
            button.setAttribute('aria-label', 'Copy code');
            button.innerHTML = COPY_ICON;

            const handleClick = () => {
                void copyTextToClipboard(text, { successMessage: 'Copied' });
            };
            button.addEventListener('click', handleClick);
            pre.appendChild(button);

            cleanups.push(() => {
                button.removeEventListener('click', handleClick);
                button.remove();
            });
        });

        return () => cleanups.forEach((cleanup) => cleanup());
    }, [html]);

    return (
        <div
            ref={containerRef}
            className={className ? `markdown-body ${className}` : 'markdown-body'}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
};

export default MarkdownView;
