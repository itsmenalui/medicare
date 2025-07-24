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

  // ✅ FIX: Show a loading indicator while any of the relevant auth checks are in progress.
  if (
    (roles.includes("patient") && patientLoading) ||
    (roles.includes("employee") && employeeLoading) ||
    (roles.includes("admin") && adminLoading)
  ) {
    return (
      <div className="text-center py-20 font-semibold">Authenticating...</div>
    );
  }

  // Once loading is complete, perform the checks
  if (roles.includes("admin")) {
    if (isAdminAuthenticated) return children;
    return <Navigate to="/admin/login" />;
  }

  if (roles.includes("patient")) {
    if (isPatientAuthenticated) return children;
    return <Navigate to="/login" />;
  }

  if (roles.includes("employee")) {
    if (isEmployeeAuthenticated) return children;
    return <Navigate to="/employee-login" />;
  }

  // Fallback if no role matches (should not happen in normal use)
  return <Navigate to="/" />;
};

export default ProtectedRoute;
