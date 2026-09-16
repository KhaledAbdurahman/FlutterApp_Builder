import { createRoute } from '@tanstack/react-router';
import { requireNoAuth } from '@/app/router/middleware';
import { AuthPage } from '@/pages/auth/auth-page';
import { noAuthRoutes } from '@/app/router/router';

const authRoute = createRoute({
  getParentRoute: () => noAuthRoutes,
  path: 'auth',
  component: AuthPage,
  beforeLoad: requireNoAuth,
});

export { authRoute };
