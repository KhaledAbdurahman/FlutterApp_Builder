import { createRoute } from '@tanstack/react-router';
import { ProtectedBuilderRoute } from '@/app/router/route-components';
import { rootRoute } from '@/app/router/routes/root-route';

const builderRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'builder',
  component: ProtectedBuilderRoute,
});

export { builderRoute };
