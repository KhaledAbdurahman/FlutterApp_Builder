import { Outlet, createRootRoute } from '@tanstack/react-router';
import { NotFound } from '@/app/router/routes/not-found-route';

const rootRoute = createRootRoute({
  component: Outlet,
  notFoundComponent: NotFound,
});

export { rootRoute };
