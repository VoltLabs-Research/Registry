import Heading from '@/shared/presentation/primitives/Heading';
import Text from '@/shared/presentation/primitives/Text';
import Stack from '@/shared/presentation/primitives/Stack';
import Button from '@/shared/presentation/primitives/Button';
import { usePageTitle } from '@/shared/presentation/hooks/use-page-title';

const NotFoundPage = () => {
    usePageTitle('Not Found');

    return (
        <Stack gap='2' align='center' justify='center' style={{ minHeight: '100vh', padding: '2rem' }}>
            <Heading level={1}>404</Heading>
            <Text>The page you are looking for does not exist.</Text>
            <Button to='/'>Go home</Button>
        </Stack>
    );
};

export default NotFoundPage;
