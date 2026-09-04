import { Link } from 'react-router-dom';
import { EmptyStateRoot, buttonVariants } from '@heroui/react';
import { SearchX } from 'lucide-react';
import { useId } from 'react';
import { usePageTitle } from '@volt/ui';

const NotFoundPage = () => {
    usePageTitle('Not Found');

    const headingId = useId();

    return (
        <EmptyStateRoot<'section'>
            render={(props) => <section {...props} />}
            aria-labelledby={headingId}
            className='flex h-dvh w-full items-center justify-center bg-background p-6'
        >
            <div className='flex max-w-96 flex-col items-center gap-6 text-center max-md:max-w-[90%]'>
                <div className='flex shrink-0 flex-row items-center justify-center text-muted'>
                    <SearchX size={24} />
                </div>

                <div className='flex flex-col gap-2'>
                    <h1 className='text-base font-medium text-foreground' id={headingId}>
                        Page not found
                    </h1>
                    <p className='text-sm leading-normal text-muted'>
                        The page you were looking for is unavailable or may have moved.
                    </p>
                </div>

                <Link to='/' className={buttonVariants({ variant: 'primary', size: 'sm' })}>
                    Go to packages
                </Link>
            </div>
        </EmptyStateRoot>
    );
};

export default NotFoundPage;
