import { ProtectedRoute } from '@/components/ProtectedRoute';
import Builder from '@/pages/Builder';
import Dashboard from '@/pages/Dashboard';

const ProtectedBuilderRoute = () => (
  <ProtectedRoute>
    <Builder />
  </ProtectedRoute>
);

const ProtectedDashboardRoute = () => (
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
);

export { ProtectedBuilderRoute, ProtectedDashboardRoute };
