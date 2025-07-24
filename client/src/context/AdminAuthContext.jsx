import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";

const AdminAuthContext = createContext();

export const useAdminAuth = () => {
  return useContext(AdminAuthContext);
};

export const AdminAuthProvider = ({ children }) => {
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("adminUser");
    if (storedUser) {
      setAdminUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const adminLogin = async (email, password) => {
    try {
      const response = await axios.post("/api/employee/login", {
        email,
        password,
      });
      const userData = response.data;

      if (userData.employee?.role !== "Admin") {
        throw new Error("Access Denied: Not an administrator.");
      }

      setAdminUser(userData);
      localStorage.setItem("adminUser", JSON.stringify(userData));
    } catch (error) {
      console.error("Admin login failed:", error);
      throw new Error(
        error.response?.data?.error || error.message || "Admin login failed"
      );
    }
  };

  const adminLogout = () => {
    setAdminUser(null);
    localStorage.removeItem("adminUser");
  };

  const value = {
    adminUser,
    isAdminAuthenticated: !!adminUser,
    loading,
    adminLogin,
    adminLogout,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};
