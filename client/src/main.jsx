import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// Import all the necessary providers
import { PatientAuthProvider } from "./context/PatientAuthContext.jsx";
import { EmployeeAuthProvider } from "./context/EmployeeAuthContext.jsx";
import { AdminAuthProvider } from "./context/AdminAuthContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";

// This is the single, correct place to wrap your application with providers.
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AdminAuthProvider>
      <EmployeeAuthProvider>
        <PatientAuthProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </PatientAuthProvider>
      </EmployeeAuthProvider>
    </AdminAuthProvider>
  </React.StrictMode>
);
