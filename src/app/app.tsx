import { AuthProvider } from '@/contexts/AuthContext';
import { Store } from '@/config/redux/store';
import { router } from '@/app/router/router';
import { ThemeSynchronizer } from '@/app/theme-synchronizer';
import { MantineProvider, createTheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { Provider } from 'react-redux';

const queryClient = new QueryClient();

const MantineTheme = createTheme({
  primaryColor: 'indigo',
  colors: {
    dark: [
      '#edf3ff',
      '#d8e4f8',
      '#b7c8e2',
      '#91a5c5',
      '#6b82a3',
      '#4d6382',
      '#344965',
      '#243a56',
      '#172b45',
      '#0e1a2b',
    ],
  },
  fontFamily: 'Open Sans, Arial, sans-serif',
  headings: { fontFamily: 'Inter, Open Sans, Arial, sans-serif', fontWeight: '700' },
  defaultRadius: 'sm',
  spacing: { xs: '4px', sm: '8px', md: '12px', lg: '16px', xl: '24px' },
});

export function App() {
  return (
    <Provider store={Store}>
      <QueryClientProvider client={queryClient}>
        <MantineProvider theme={MantineTheme} defaultColorScheme="dark">
          <ThemeSynchronizer />
          <Notifications />
          <AuthProvider>
            <RouterProvider router={router} />
          </AuthProvider>
        </MantineProvider>
      </QueryClientProvider>
    </Provider>
  );
}
