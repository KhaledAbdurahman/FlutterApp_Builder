import { createRouter } from '@tanstack/react-router';
import { authRoute } from '@/app/router/routes/auth-route';
import { builderRoute } from '@/app/router/routes/builder-route';
import { dashboardRoute } from '@/app/router/routes/dashboard-route';
import { landingRoute } from '@/app/router/routes/landing-route';
import { rootRoute } from '@/app/router/routes/root-route';

const routeTree = rootRoute.addChildren([landingRoute, authRoute, dashboardRoute, builderRoute]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export { router };
