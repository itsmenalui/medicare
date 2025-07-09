import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { PatientAuthProvider } from "./context/PatientAuthContext.jsx";
import { EmployeeAuthProvider } from "./context/EmployeeAuthContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <PatientAuthProvider>
      <EmployeeAuthProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </EmployeeAuthProvider>
    </PatientAuthProvider>
  </React.StrictMode>
);
