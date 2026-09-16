import { createRoute } from '@tanstack/react-router';
import { BuilderPage } from '@/pages/builder/builder-page';
import { authRoutes } from '@/app/router/router';

const builderRoute = createRoute({
  getParentRoute: () => authRoutes,
  path: 'builder',
  component: BuilderPage,
});

export { builderRoute };
