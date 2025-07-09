import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { usePatientAuth } from "../context/PatientAuthContext";
import { Mail, Lock } from "lucide-react";

const PatientLoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = usePatientAuth(); // Get isAuthenticated state
  const navigate = useNavigate();

  // UPDATED: This useEffect hook will redirect logged-in users
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/portal"); // Redirect to the patient portal if already logged in
    }
  }, [isAuthenticated, navigate]);

  // In src/pages/PatientLoginPage.jsx

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/portal");
    } catch (err) {
      // FIXED: Removed the "=>" arrow
      setError(
        err.message || "Failed to log in. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl mx-auto bg-white rounded-2xl shadow-2xl flex overflow-hidden">
        {/* Left Decorative Panel */}
        <div className="hidden md:flex w-1/2 bg-gradient-to-br from-blue-500 to-indigo-600 p-12 text-white flex-col justify-between relative overflow-hidden">
          <div>
            <h1 className="text-4xl font-extrabold mb-4">
              Your Health, Our Priority.
            </h1>
            <p className="text-blue-100">
              Access your personal health records, manage appointments, and
              connect with your doctors seamlessly.
            </p>
          </div>
          <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-blue-400 rounded-full opacity-30 animate-pulse"></div>
          <div className="absolute -bottom-24 -left-12 w-40 h-40 bg-indigo-400 rounded-full opacity-30 animate-pulse delay-75"></div>
        </div>

        {/* Right Login Form Panel */}
        <div className="w-full md:w-1/2 p-8 md:p-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Patient Portal Login
          </h2>
          <p className="text-gray-600 mb-8">
            Use your registered email and password.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="mb-6 relative">
              <Mail
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-gray-900"
                required
              />
            </div>

            <div className="mb-6 relative">
              <Lock
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-gray-900"
                required
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition duration-300 disabled:bg-gray-400"
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            <div className="text-center mt-6">
              <span className="text-gray-600">Don't have an account? </span>
              <Link
                to="/signup"
                className="text-blue-600 hover:underline font-semibold"
              >
                Sign up here
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PatientLoginPage;
