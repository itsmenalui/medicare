import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { usePatientAuth } from "../context/PatientAuthContext.jsx";
import { useEmployeeAuth } from "../context/EmployeeAuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import {
  LogOut,
  ChevronDown,
  User,
  Briefcase,
  ShoppingCart,
} from "lucide-react";

const Navbar = () => {
  const { isAuthenticated, user, logout } = usePatientAuth();
  const { isEmployeeAuthenticated, employeeUser, employeeLogout } =
    useEmployeeAuth();
  const { cartItems } = useCart();
  const navigate = useNavigate();

  // State to control the animation reset
  const [animate, setAnimate] = useState(true);

  // This effect will re-trigger the animation every 2 seconds
  useEffect(() => {
    const animationInterval = setInterval(() => {
      setAnimate(false);
      setTimeout(() => {
        setAnimate(true);
      }, 10);
    }, 2000);

    return () => clearInterval(animationInterval);
  }, []);

  const totalCartItems = cartItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const handlePatientLogout = () => {
    logout();
    navigate("/");
  };

  const handleEmployeeLogout = () => {
    employeeLogout();
    navigate("/");
  };

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

      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-6 py-3 flex justify-between items-center">
          {/* Animated Logo */}
          <Link to="/" className="flex items-baseline overflow-hidden">
            <span
              className={`text-4xl font-bold text-black ${
                animate ? "animate-slide-in-left" : "opacity-0"
              }`}
            >
              M
            </span>
            <span className="text-3xl font-bold text-black">ediCar</span>
            <span
              className={`text-3xl font-bold text-black ${
                animate ? "animate-slide-in-right" : "opacity-0"
              }`}
            >
              e
            </span>
          </Link>

          {/* Primary Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/doctors" className="text-gray-600 hover:text-indigo-600">
              Find a Doctor
            </Link>
            <Link
              to="/diseases"
              className="text-gray-600 hover:text-indigo-600"
            >
              Diseases
            </Link>
            <Link
              to="/pharmacy"
              className="text-gray-600 hover:text-indigo-600"
            >
              Pharmacy
            </Link>
            <Link
              to="/ambulance"
              className="text-gray-600 hover:text-indigo-600"
            >
              Ambulance
            </Link>
            {/* NEW LINK ADDED HERE */}
            <Link to="/rooms" className="text-gray-600 hover:text-indigo-600">
              Book a Room
            </Link>
          </div>

          {/* Right side of Navbar: Cart and Auth */}
          <div className="flex items-center space-x-4">
            {/* Checkout Cart button */}
            {totalCartItems > 0 && (
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

            {/* Auth Section */}
            <div className="flex items-center">
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <span className="font-semibold text-gray-700">
                    Welcome, {user?.patient?.first_name}
                  </span>
                  <Link to="/portal" className="btn btn-sm btn-primary">
                    My Portal
                  </Link>
                  <button
                    onClick={handlePatientLogout}
                    className="btn btn-sm btn-ghost text-red-600 hover:bg-red-100"
                    title="Logout"
                  >
                    <LogOut size={16} className="mr-2" />
                    Logout
                  </button>
                </div>
              ) : isEmployeeAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <span className="font-semibold text-gray-700">
                    Staff: {employeeUser?.employee?.first_name}
                  </span>
                  <Link
                    to="/employee-portal"
                    className="btn btn-sm btn-secondary"
                  >
                    Staff Portal
                  </Link>
                  <button
                    onClick={handleEmployeeLogout}
                    className="btn btn-sm btn-ghost text-red-600 hover:bg-red-100"
                    title="Logout"
                  >
                    <LogOut size={16} className="mr-2" />
                    Logout
                  </button>
                </div>
              ) : (
                <div className="relative group">
                  <button className="btn btn-primary">
                    Portal Login
                    <ChevronDown size={20} className="ml-1" />
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all duration-300">
                    <Link
                      to="/login"
                      className="px-4 py-2 text-gray-800 hover:bg-indigo-50 flex items-center w-full"
                    >
                      <User size={16} className="mr-2" />
                      Patient Portal
                    </Link>
                    <Link
                      to="/employee-login"
                      className="px-4 py-2 text-gray-800 hover:bg-indigo-50 flex items-center w-full"
                    >
                      <Briefcase size={16} className="mr-2" />
                      Employee Portal
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
