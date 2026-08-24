import {
  ActionIcon,
  Menu,
  Tooltip,
  useComputedColorScheme,
  useMantineColorScheme,
} from '@mantine/core';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('dark');
  const isDark = computedColorScheme === 'dark';

  return (
    <Menu shadow="md" width={152} position="bottom-end">
      <Menu.Target>
        <Tooltip label={`Switch to ${isDark ? 'light' : 'dark'} theme`}>
          <ActionIcon
            variant="subtle"
            color="gray"
            size="lg"
            aria-label="Change color scheme"
            onClick={() => setColorScheme(isDark ? 'light' : 'dark')}
          >
            {isDark ? <Moon size={18} /> : <Sun size={18} />}
          </ActionIcon>
        </Tooltip>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item
          leftSection={<Sun size={16} />}
          rightSection={colorScheme === 'light' ? 'Current' : undefined}
          onClick={() => setColorScheme('light')}
        >
          Light
        </Menu.Item>
        <Menu.Item
          leftSection={<Moon size={16} />}
          rightSection={colorScheme === 'dark' ? 'Current' : undefined}
          onClick={() => setColorScheme('dark')}
        >
          Dark
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
