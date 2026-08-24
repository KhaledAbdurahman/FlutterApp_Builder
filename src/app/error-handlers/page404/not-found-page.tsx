import { Link, useLocation } from '@tanstack/react-router';
import { Button, Center, Stack, Text, Title } from '@mantine/core';
import { useEffect } from 'react';
import styles from '@/app/error-handlers/page404/not-found-page.module.css';

const NotFoundPage = () => {
  const location = useLocation();

  useEffect(() => {
    console.error('404 Error: User attempted to access non-existent route:', location.pathname);
  }, [location.pathname]);

  return (
    <Center className={styles.page}>
      <Stack align="center" gap="md" className={styles.content}>
        <Text className={styles.code}>404</Text>
        <Title order={1}>Page not found</Title>
        <Text c="dimmed">The address does not point to an available page.</Text>
        <Button component={Link} to="/">
          Return home
        </Button>
      </Stack>
    </Center>
  );
};

export { NotFoundPage };
