import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "../api/axios";

const EmployeeAuthContext = createContext();

export const useEmployeeAuth = () => {
  return useContext(EmployeeAuthContext);
};

export const EmployeeAuthProvider = ({ children }) => {
  const [employeeUser, setEmployeeUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("employeeUser");
      if (storedUser) {
        setEmployeeUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse employee user from localStorage", error);
      localStorage.removeItem("employeeUser");
    }
    setLoading(false);
  }, []);

  const employeeLogin = async (email, password) => {
    try {
      const response = await axios.post("/api/employee/login", {
        email,
        password,
      });
      const userData = response.data;
      setEmployeeUser(userData);
      localStorage.setItem("employeeUser", JSON.stringify(userData));
    } catch (error) {
      console.error("Employee login failed:", error);
      throw new Error(error.response?.data?.error || "Employee login failed");
    }
  };

  const employeeLogout = () => {
    setEmployeeUser(null);
    localStorage.removeItem("employeeUser");
  };

  const value = {
    employeeUser,
    isEmployeeAuthenticated: !!employeeUser,
    loading,
    employeeLogin,
    employeeLogout,
  };

  return (
    <EmployeeAuthContext.Provider value={value}>
      {children}
    </EmployeeAuthContext.Provider>
  );
};
