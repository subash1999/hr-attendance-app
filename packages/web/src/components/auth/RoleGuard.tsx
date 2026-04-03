import { Navigate, Outlet } from "react-router-dom";
import { ROUTES } from "@willdesign-hr/types";
import { useHasMinimumRole } from "../../hooks/useRole";

interface RoleGuardProps {
  readonly minRole: string;
}

/** Route guard that redirects to dashboard if user lacks the required role. */
export function RoleGuard({ minRole }: RoleGuardProps) {
  const hasRole = useHasMinimumRole(minRole);

  if (!hasRole) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <Outlet />;
}
