import { Outlet, createRootRoute } from '@tanstack/react-router';
import { NotFoundPage } from '@/app/router/routes/not-found-route';

const rootRoute = createRootRoute({
  component: Outlet,
  notFoundComponent: NotFoundPage,
});

export { rootRoute };
