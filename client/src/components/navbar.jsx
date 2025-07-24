import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { usePatientAuth } from "../context/PatientAuthContext.jsx";
import { useEmployeeAuth } from "../context/EmployeeAuthContext.jsx";
import { useAdminAuth } from "../context/AdminAuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import {
  LogOut,
  ChevronDown,
  User,
  Briefcase,
  ShoppingCart,
  Shield,
  LayoutDashboard,
} from "lucide-react";

const Navbar = () => {
  const { isAuthenticated, user, logout: patientLogout } = usePatientAuth();
  const { isEmployeeAuthenticated, employeeUser, employeeLogout } =
    useEmployeeAuth();
  const { isAdminAuthenticated, adminUser, adminLogout } = useAdminAuth();
  const { cartItems } = useCart();
  const navigate = useNavigate();

  // State for the logo animation
  const [animate, setAnimate] = useState(true);
  // State to control the dropdown menu
  const [isMenuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const animationInterval = setInterval(() => {
      setAnimate(false);
      setTimeout(() => setAnimate(true), 10);
    }, 2000);
    return () => clearInterval(animationInterval);
  }, []);

  const totalCartItems = cartItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const handleLogout = () => {
    if (isAuthenticated) patientLogout();
    if (isEmployeeAuthenticated) employeeLogout();
    if (isAdminAuthenticated) adminLogout();
    setMenuOpen(false); // Close menu on logout
    navigate("/");
  };

  const currentLoggedInUser = adminUser || employeeUser || user;
  const userRole = isAdminAuthenticated
    ? "admin"
    : isEmployeeAuthenticated
    ? "employee"
    : isAuthenticated
    ? "patient"
    : null;

  // Define styles based on admin login status
  const navClass = isAdminAuthenticated
    ? "bg-red-800 text-white shadow-lg"
    : "bg-white shadow-md";
  const linkClass = isAdminAuthenticated
    ? "text-gray-200 hover:text-white"
    : "text-gray-600 hover:text-indigo-600";
  const logoClass = isAdminAuthenticated ? "text-white" : "text-black";

  return (
    <>
      <style>
        {`
          @keyframes slideInFromLeft { 0% { transform: translateX(-100%); opacity: 0; } 100% { transform: translateX(0); opacity: 1; } }
          @keyframes slideInFromRight { 0% { transform: translateX(100%); opacity: 0; } 100% { transform: translateX(0); opacity: 1; } }
          .animate-slide-in-left { animation: slideInFromLeft 0.8s ease-out forwards; }
          .animate-slide-in-right { animation: slideInFromRight 0.8s ease-out forwards; }
        `}
      </style>

      <nav
        className={`${navClass} sticky top-0 z-50 transition-colors duration-300`}
      >
        <div className="container mx-auto px-6 py-3 flex justify-between items-center">
          <Link to="/" className="flex items-baseline overflow-hidden">
            <span
              className={`text-4xl font-bold ${logoClass} ${
                animate ? "animate-slide-in-left" : "opacity-0"
              }`}
            >
              M
            </span>
            <span className={`text-3xl font-bold ${logoClass}`}>ediCar</span>
            <span
              className={`text-3xl font-bold ${logoClass} ${
                animate ? "animate-slide-in-right" : "opacity-0"
              }`}
            >
              e
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            <Link to="/doctors" className={linkClass}>
              Find a Doctor
            </Link>
            <Link to="/diseases" className={linkClass}>
              Diseases
            </Link>
            <Link to="/pharmacy" className={linkClass}>
              Pharmacy
            </Link>
            <Link to="/ambulance" className={linkClass}>
              Ambulance
            </Link>
            <Link to="/rooms" className={linkClass}>
              Book a Room
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {totalCartItems > 0 && !isAdminAuthenticated && (
              <Link
                to="/checkout"
                className="btn btn-circle bg-gray-700 text-white hover:bg-gray-600"
              >
                <div className="indicator">
                  <ShoppingCart size={24} />
                  <span className="badge badge-sm indicator-item badge-secondary">
                    {totalCartItems}
                  </span>
                </div>
              </Link>
            )}

            <div className="relative">
              {currentLoggedInUser ? (
                <div>
                  <button
                    onClick={() => setMenuOpen(!isMenuOpen)}
                    className="btn btn-primary"
                  >
                    Welcome,{" "}
                    {currentLoggedInUser.employee?.first_name ||
                      currentLoggedInUser.patient?.first_name}
                    <ChevronDown
                      size={20}
                      className={`ml-1 transition-transform ${
                        isMenuOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {isMenuOpen && (
                    <ul className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 z-10">
                      <li>
                        <Link
                          to={
                            userRole === "admin"
                              ? "/admin/portal"
                              : userRole === "employee"
                              ? "/employee-portal"
                              : "/portal"
                          }
                          onClick={() => setMenuOpen(false)}
                          className="px-4 py-2 text-gray-800 hover:bg-indigo-50 flex items-center w-full"
                        >
                          <LayoutDashboard size={16} className="mr-2" />
                          My Portal
                        </Link>
                      </li>
                      <li>
                        <button
                          onClick={handleLogout}
                          className="px-4 py-2 text-red-600 hover:bg-red-50 flex items-center w-full"
                        >
                          <LogOut size={16} className="mr-2" />
                          Logout
                        </button>
                      </li>
                    </ul>
                  )}
                </div>
              ) : (
                <div className="relative group">
                  <button className="btn btn-primary">
                    Portal Login
                    <ChevronDown size={20} className="ml-1" />
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all duration-300 z-10">
                    <Link
                      to="/login"
                      className="px-4 py-2 text-gray-800 hover:bg-indigo-50 flex items-center w-full"
                    >
                      <User size={16} className="mr-2" /> Patient Portal
                    </Link>
                    <Link
                      to="/employee-login"
                      className="px-4 py-2 text-gray-800 hover:bg-indigo-50 flex items-center w-full"
                    >
                      <Briefcase size={16} className="mr-2" /> Employee Portal
                    </Link>
                    <Link
                      to="/admin/login"
                      className="px-4 py-2 text-gray-800 hover:bg-indigo-50 flex items-center w-full"
                    >
                      <Shield size={16} className="mr-2" /> Admin Portal
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
