import { createRoute } from '@tanstack/react-router';
import { rootRoute } from '@/app/router/routes/root-route';
import { AuthPage } from '@/pages/auth/auth-page';

const authRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'auth',
  component: AuthPage,
});

export { authRoute };
