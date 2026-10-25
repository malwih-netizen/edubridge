import { Navigate, useLocation } from 'react-router-dom';
import { homeFor, useAuth } from '@/context/AuthContext';

/** Allows only signed-in users with the given role; others go to login or their own portal. */
export default function ProtectedRoute({ role, children }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (role && user.role !== role) return <Navigate to={homeFor(user.role)} replace />;
  return children;
}
