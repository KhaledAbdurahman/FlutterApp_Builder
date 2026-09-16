import { RouterErrorPage } from '@/app/error-handlers/router-error-page';
import { NotFoundPage } from '@/app/error-handlers/page404/not-found-page';
import { createRootRoute, createRoute, createRouter, Outlet } from '@tanstack/react-router';
import { builderRoute } from '@/app/router/routes/builder-route';
import { dashboardRoute } from '@/app/router/routes/dashboard-route';
import { landingRoute } from '@/app/router/routes/landing-route';
import { requireAuth, requireNoAuth } from '@/app/router/middleware';
import { authRoute } from '@/app/router/routes/auth-route';

const rootRoute = createRootRoute({ component: Outlet });

export const authRoutes = createRoute({
  getParentRoute: () => rootRoute,
  id: 'auth_routes',
  component: Outlet,
  beforeLoad: requireAuth,
});

export const noAuthRoutes = createRoute({
  getParentRoute: () => rootRoute,
  id: 'no_auth_routes',
  component: Outlet,
  beforeLoad: requireNoAuth,
});

const routeTree = rootRoute.addChildren([
  authRoutes.addChildren([dashboardRoute, builderRoute]),
  noAuthRoutes.addChildren([landingRoute, authRoute]),
]);

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  defaultViewTransition: true,
  defaultErrorComponent: RouterErrorPage,
  defaultNotFoundComponent: NotFoundPage,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
