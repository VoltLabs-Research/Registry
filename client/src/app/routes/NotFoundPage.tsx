import { Heading, Text, Stack, Button } from '@voltstack/bravais';
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
