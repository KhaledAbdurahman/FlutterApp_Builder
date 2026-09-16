import { redirect } from '@tanstack/react-router';
import { AUTH_SERVICE } from '@/api/auth';

// Match AuthProvider's persisted-session check before rendering protected pages.
const isAuthenticated = () =>
  AUTH_SERVICE.isAuthenticated() && Boolean(AUTH_SERVICE.getStoredUser());

const requireAuth = () => {
  if (!isAuthenticated()) {
    throw redirect({ to: '/auth', replace: true });
  }
};

const requireNoAuth = () => {
  if (isAuthenticated()) {
    throw redirect({ to: '/dashboard', replace: true });
  }
};

export { requireAuth, requireNoAuth };
