import { createRoute } from '@tanstack/react-router';
import { rootRoute } from '@/app/router/routes/root-route';
import Auth from '@/pages/Auth';

const authRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'auth',
  component: Auth,
});

export { authRoute };
