import { Link } from 'react-router-dom';

const NAV_LINKS = [
    { label: 'Docs', href: 'https://docs.voltcloud.dev' },
    { label: 'Status', href: 'https://status.voltcloud.dev' },
    { label: 'Console', href: 'https://console.voltcloud.dev' }
];

const AppTopbar = () => {
    return (
        <header className='sticky top-0 z-50 w-full bg-background'>
            <div className='mx-auto flex h-16 w-full max-w-[1080px] flex-row items-center justify-between px-6'>
                <Link
                    to='/'
                    className='inline-flex flex-row items-center gap-2 text-base font-semibold tracking-[-0.01em] text-foreground no-underline'
                >
                    Registry
                </Link>
                <nav className='inline-flex flex-row items-center gap-6' aria-label='External'>
                    {NAV_LINKS.map((link) => (
                        <a
                            key={link.label}
                            href={link.href}
                            className='font-mono text-sm text-muted no-underline transition-colors hover:text-foreground'
                            rel='noreferrer'
                        >
                            {link.label}
                        </a>
                    ))}
                </nav>
            </div>
        </header>
    );
};

export default AppTopbar;
