import React from "react";
import { Navigate } from "react-router-dom";
import { usePatientAuth } from "../context/PatientAuthContext";
import { useEmployeeAuth } from "../context/EmployeeAuthContext";
import { useAdminAuth } from "../context/AdminAuthContext";

const ProtectedRoute = ({ children, role }) => {
  // Get the loading and authentication status from each context
  const { isAuthenticated: isPatientAuthenticated, loading: patientLoading } =
    usePatientAuth();
  const { isEmployeeAuthenticated, loading: employeeLoading } =
    useEmployeeAuth();
  const { isAdminAuthenticated, loading: adminLoading } = useAdminAuth();

  const roles = Array.isArray(role) ? role : [role];

  // Show a loading indicator while any of the relevant auth checks are in progress.
  if (
    (roles.includes("patient") && patientLoading) ||
    (roles.includes("employee") && employeeLoading) ||
    (roles.includes("admin") && adminLoading)
  ) {
    return (
      <div className="text-center py-20 font-semibold">Authenticating...</div>
    );
  }

  // ✅ FIX: This new logic correctly checks if the user has ANY of the required roles.
  let isAuthorized = false;
  if (roles.includes("admin") && isAdminAuthenticated) {
    isAuthorized = true;
  }
  if (roles.includes("employee") && isEmployeeAuthenticated) {
    isAuthorized = true;
  }
  if (roles.includes("patient") && isPatientAuthenticated) {
    isAuthorized = true;
  }

  if (isAuthorized) {
    return children;
  }

  // If the user is not authorized, redirect them to the appropriate login page.
  // We check in order of privilege.
  if (roles.includes("admin")) {
    return <Navigate to="/admin/login" />;
  }
  if (roles.includes("employee")) {
    return <Navigate to="/employee-login" />;
  }
  if (roles.includes("patient")) {
    return <Navigate to="/login" />;
  }

  // Fallback if no role matches
  return <Navigate to="/" />;
};

export default ProtectedRoute;
