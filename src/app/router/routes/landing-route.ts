import { createRoute } from '@tanstack/react-router';
import { rootRoute } from '@/app/router/routes/root-route';
import { LandingPage } from '@/pages/landing/landing-page';

const landingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: LandingPage,
});

export { landingRoute };
