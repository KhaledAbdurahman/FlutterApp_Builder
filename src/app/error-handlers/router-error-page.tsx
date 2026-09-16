import { Button, Center, Stack, Text, Title } from '@mantine/core';
import { Link, useRouter } from '@tanstack/react-router';
import type { ErrorComponentProps } from '@tanstack/react-router';

const RouterErrorPage = ({ reset }: ErrorComponentProps) => {
  const router = useRouter();

  return (
    <Center mih="100dvh" p="xl">
      <Stack align="center" gap="md">
        <Title order={1}>Unable to load this page</Title>
        <Text c="dimmed">Please try again or return to the home page.</Text>
        <Button
          onClick={async () => {
            await router.invalidate();
            reset();
          }}
        >
          Try again
        </Button>
        <Button component={Link} to="/" variant="subtle">
          Return home
        </Button>
      </Stack>
    </Center>
  );
};

export { RouterErrorPage };
