import { Link } from 'react-router-dom';
import './AppTopbar.css';

const NAV_LINKS = [
    { label: 'Docs', href: 'https://docs.voltcloud.dev' },
    { label: 'Status', href: 'https://status.voltcloud.dev' },
    { label: 'Console', href: 'https://console.voltcloud.dev' }
];

const AppTopbar = () => {
    return (
        <header className='app-topbar'>
            <div className='app-topbar__inner'>
                <Link to='/' className='app-topbar__brand'>
                    <span className='app-topbar__brand-label'>Registry</span>
                </Link>
                <nav className='app-topbar__nav' aria-label='External'>
                    {NAV_LINKS.map((link) => (
                        <a
                            key={link.label}
                            href={link.href}
                            className='app-topbar__link'
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
