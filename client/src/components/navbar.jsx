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

  const { totalItemCount } = useCart();

  const navigate = useNavigate();

  const [animate, setAnimate] = useState(true);
  const [isMenuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    if (isAuthenticated) patientLogout();
    if (isEmployeeAuthenticated) employeeLogout();
    if (isAdminAuthenticated) adminLogout();
    setMenuOpen(false);
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

  const showCheckupsLink =
    isAuthenticated ||
    (isEmployeeAuthenticated && employeeUser?.employee?.role === "Nurse");

  // ✨ UPDATED: The non-admin class now includes the RGB strip animation
  const navClass = isAdminAuthenticated
    ? "bg-red-800 text-white shadow-lg"
    : "shadow-md rgb-strip-bg";

  const linkClass = isAdminAuthenticated
    ? "text-gray-200 hover:text-white"
    : "text-gray-600 hover:text-indigo-600";
  const logoClass = isAdminAuthenticated ? "text-white" : "text-black";

  return (
    <>
      {/* ✨ UPDATED: Added RGB strip animation keyframes and styles */}
      <style>{`
        @keyframes slideInFromLeft { 
          0% { transform: translateX(-100%); opacity: 0; } 
          100% { transform: translateX(0); opacity: 1; } 
        } 
        @keyframes slideInFromRight { 
          0% { transform: translateX(100%); opacity: 0; } 
          100% { transform: translateX(0); opacity: 1; } 
        } 
        .animate-slide-in-left { 
          animation: slideInFromLeft 1.5s ease-out infinite; 
        } 
        .animate-slide-in-right { 
          animation: slideInFromRight 1.5s ease-out infinite; 
        }

        @keyframes animateGradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animated-gradient-bg {
          background: linear-gradient(-45deg, #ffffff, #fdfdff, #f3f4ff, #f9f9ff);
          background-size: 400% 400%;
          animation: animateGradient 15s ease infinite;
        }

        @keyframes sweepAnimation {
          0% { 
            transform: translateX(-50%);
          }
          50% { 
            transform: translateX(0%);
          }
          100% { 
            transform: translateX(-50%);
          }
        }

        .rgb-strip-bg {
          position: relative;
          background: #ffffff;
          overflow: visible;
        }

        .rgb-strip-bg::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 200%;
          height: 100%;
          background: linear-gradient(90deg, 
            transparent 0%, 
            transparent 25%,
            rgba(16, 185, 129, 0.4) 45%,
            rgba(5, 150, 105, 0.5) 50%,
            rgba(16, 185, 129, 0.4) 55%,
            transparent 75%,
            transparent 100%
          );
          animation: sweepAnimation 8s ease-in-out infinite;
          z-index: 1;
        }

        .rgb-strip-bg > * {
          position: relative;
          z-index: 10;
        }
      `}</style>
      <nav
        className={`${navClass} sticky top-0 z-50 transition-colors duration-300 overflow-visible`}
      >
        <div className="container mx-auto px-6 py-3 flex justify-between items-center">
          <Link to="/" className="flex items-baseline overflow-hidden">
            <span
              className={`text-4xl font-bold ${logoClass} animate-slide-in-left`}
            >
              M
            </span>
            <span className={`text-3xl font-bold ${logoClass}`}>ediCar</span>
            <span
              className={`text-3xl font-bold ${logoClass} animate-slide-in-right`}
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
            {showCheckupsLink && (
              <Link to="/checkups" className={linkClass}>
                Medical Tests
              </Link>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {isAuthenticated && totalItemCount > 0 && (
              <Link
                to="/checkout"
                className="btn btn-circle bg-gray-700 text-white hover:bg-gray-600"
              >
                <div className="indicator">
                  <ShoppingCart size={24} />
                  <span className="badge badge-sm indicator-item badge-secondary">
                    {totalItemCount}
                  </span>
                </div>
              </Link>
            )}
            <div className="relative z-[100]">
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
                    <ul className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 z-[9999]">
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
                          <LayoutDashboard size={16} className="mr-2" /> My
                          Portal
                        </Link>
                      </li>
                      <li>
                        <button
                          onClick={handleLogout}
                          className="px-4 py-2 text-red-600 hover:bg-red-50 flex items-center w-full"
                        >
                          <LogOut size={16} className="mr-2" /> Logout
                        </button>
                      </li>
                    </ul>
                  )}
                </div>
              ) : (
                <div className="relative group">
                  <button className="btn btn-primary">
                    Portal Login <ChevronDown size={20} className="ml-1" />
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all duration-300 z-[9999]">
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
