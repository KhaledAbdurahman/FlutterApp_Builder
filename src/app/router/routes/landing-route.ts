import { createRoute } from '@tanstack/react-router';
import { LandingPage } from '@/pages/landing/landing-page';
import { noAuthRoutes } from '@/app/router/router';

const landingRoute = createRoute({
  getParentRoute: () => noAuthRoutes,
  path: '/',
  component: LandingPage,
});

export { landingRoute };
