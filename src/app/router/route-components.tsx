import { ProtectedRoute } from '@/components/ProtectedRoute';
import { BuilderPage } from '@/pages/builder/builder-page';
import { DashboardPage } from '@/pages/dashboard/dashboard-page';

const ProtectedBuilderRoute = () => (
  <ProtectedRoute>
    <BuilderPage />
  </ProtectedRoute>
);

const ProtectedDashboardRoute = () => (
  <ProtectedRoute>
    <DashboardPage />
  </ProtectedRoute>
);

export { ProtectedBuilderRoute, ProtectedDashboardRoute };
