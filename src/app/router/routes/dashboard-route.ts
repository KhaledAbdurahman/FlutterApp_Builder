import { createRoute } from '@tanstack/react-router';
import { ProtectedDashboardRoute } from '@/app/router/route-components';
import { rootRoute } from '@/app/router/routes/root-route';

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'dashboard',
  component: ProtectedDashboardRoute,
});

export { dashboardRoute };
