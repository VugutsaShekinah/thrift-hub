import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import Spinner from "../components/ui/Spinner";

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <Spinner full />;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  return <Outlet />;
}

export function StaffRoute() {
  const { isAuthenticated, isStaff, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <Spinner full />;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!isStaff) return <Navigate to="/" replace />;
  return <Outlet />;
}
