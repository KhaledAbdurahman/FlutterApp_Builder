import { useNavigate } from '@tanstack/react-router';
import { LogOut, User, LayoutDashboard } from 'lucide-react';
import { ActionIcon, Avatar, Menu, Text } from '@mantine/core';
import { useAuth } from '@/contexts/AuthContext';
import { ChooseNotification } from '@/lib/choose-notification';

export function UserProfileMenu() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate({ to: '/' });
    ChooseNotification.success({ message: 'Logged out successfully' });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Menu shadow="md" width={224} position="bottom-end">
      <Menu.Target>
        <ActionIcon variant="subtle" color="gray" size="lg" radius="xl" aria-label="Open user menu">
          <Avatar color="indigo" radius="xl" size="sm">
            {user?.username ? getInitials(user.username) : <User size={16} />}
          </Avatar>
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>
          <Text size="sm" fw={600}>
            {user?.username}
          </Text>
          {user?.email && (
            <Text size="xs" c="dimmed">
              {user.email}
            </Text>
          )}
        </Menu.Label>
        <Menu.Divider />
        <Menu.Item
          leftSection={<LayoutDashboard size={16} />}
          onClick={() => navigate({ to: '/dashboard' })}
        >
          Dashboard
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item color="red" leftSection={<LogOut size={16} />} onClick={handleLogout}>
          Log out
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
