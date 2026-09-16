import { createRoute } from '@tanstack/react-router';
import { DashboardPage } from '@/pages/dashboard/dashboard-page';
import { authRoutes } from '@/app/router/router';

const dashboardRoute = createRoute({
  getParentRoute: () => authRoutes,
  path: 'dashboard',
  component: DashboardPage,
});

export { dashboardRoute };
