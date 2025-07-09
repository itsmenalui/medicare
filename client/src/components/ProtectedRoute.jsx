import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { usePatientAuth } from "../context/PatientAuthContext";
import { useEmployeeAuth } from "../context/EmployeeAuthContext";

const ProtectedRoute = ({ children, role }) => {
  const { isAuthenticated, loading: patientLoading } = usePatientAuth();
  const { isEmployeeAuthenticated, loading: employeeLoading } =
    useEmployeeAuth();
  const location = useLocation();

  const isLoading = patientLoading || employeeLoading;

  if (isLoading) {
    // You can show a loading spinner here while checking auth state
    return <div>Loading...</div>;
  }

  // Check patient role
  if (role === "patient") {
    if (!isAuthenticated) {
      // Not a logged-in patient, redirect to patient login page
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
  }

  // Check employee role
  if (role === "employee") {
    if (!isEmployeeAuthenticated) {
      // Not a logged-in employee, redirect to employee login page
      return (
        <Navigate to="/employee-login" state={{ from: location }} replace />
      );
    }
  }

  // If roles include both, check if either is authenticated
  if (
    Array.isArray(role) &&
    role.includes("patient") &&
    role.includes("employee")
  ) {
    if (!isAuthenticated && !isEmployeeAuthenticated) {
      // Not logged in as either, redirect to a generic login choice page or homepage
      return <Navigate to="/" state={{ from: location }} replace />;
    }
  }

  // If all checks pass, render the component the user was trying to access
  return children;
};

export default ProtectedRoute;
