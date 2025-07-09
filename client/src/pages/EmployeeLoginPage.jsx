import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useEmployeeAuth } from "../context/EmployeeAuthContext";
import { Mail, Lock, Stethoscope } from "lucide-react";

const EmployeeLoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { employeeLogin } = useEmployeeAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await employeeLogin(email, password);
      navigate("/employee-portal");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to log in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl mx-auto bg-white rounded-2xl shadow-2xl flex overflow-hidden">
        <div className="hidden md:flex w-1/2 bg-gradient-to-br from-purple-500 to-indigo-600 p-12 text-white flex-col justify-between relative">
          <div>
            <h1 className="text-4xl font-extrabold mb-4">
              Staff Access Portal.
            </h1>
            <p className="text-indigo-100">
              Log in to access your dashboard, patient information, and
              scheduling tools.
            </p>
          </div>
          <Stethoscope
            size={100}
            className="absolute bottom-8 right-8 opacity-10"
          />
        </div>

        <div className="w-full md:w-1/2 p-8 md:p-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Employee Login
          </h2>
          <p className="text-gray-600 mb-8">Please enter your credentials.</p>

          <form onSubmit={handleSubmit}>
            <div className="mb-6 relative">
              <Mail
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="email"
                placeholder="Work Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border rounded-lg"
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
                className="w-full pl-12 pr-4 py-3 border rounded-lg"
                required
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition disabled:bg-gray-400"
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            <div className="text-center mt-6">
              <span className="text-gray-600">Need an employee account? </span>
              <Link
                to="/employee-signup"
                className="text-indigo-600 hover:underline font-semibold"
              >
                Register here
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EmployeeLoginPage;
