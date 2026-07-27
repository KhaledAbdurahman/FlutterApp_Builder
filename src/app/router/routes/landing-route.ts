import { createRoute } from '@tanstack/react-router';
import { rootRoute } from '@/app/router/routes/root-route';
import Landing from '@/pages/Landing';

const landingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Landing,
});

export { landingRoute };
