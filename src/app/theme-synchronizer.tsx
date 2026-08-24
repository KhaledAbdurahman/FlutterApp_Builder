import { useEffect } from 'react';
import { useComputedColorScheme } from '@mantine/core';

// Tailwind remains during the editor migration, so its dark selector must follow Mantine's saved preference.
export function ThemeSynchronizer() {
  const colorScheme = useComputedColorScheme('dark');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', colorScheme === 'dark');
  }, [colorScheme]);

  return null;
}
