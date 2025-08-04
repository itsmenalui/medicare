import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "../api/axios";
import {
  Mail,
  Lock,
  User,
  Calendar,
  Phone,
  Shield,
  HeartPulse,
} from "lucide-react";

const SignupPage = () => {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    dob: "",
    gender: "",
    contact_number: "",
    address: "",
    blood_type: "",
    emergency_contact: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await axios.post("/api/signup", formData);
      setSuccess("Account created successfully! Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Failed to create account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl mx-auto bg-white rounded-2xl shadow-2xl flex overflow-hidden">
        {/* Left Decorative Panel */}
        <div className="hidden md:flex w-1/2 bg-gradient-to-br from-teal-500 to-cyan-600 p-12 text-white flex-col justify-between relative overflow-hidden">
          <div>
            <h1 className="text-4xl font-extrabold mb-4">
              Join Our Community of Care.
            </h1>
            <p className="text-cyan-100">
              Create your secure patient account to manage your health journey
              all in one place.
            </p>
          </div>
          <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-cyan-400 rounded-full opacity-30 animate-pulse"></div>
          <div className="absolute -bottom-24 -left-12 w-40 h-40 bg-teal-400 rounded-full opacity-30 animate-pulse delay-75"></div>
        </div>

        {/* Right Signup Form Panel */}
        <div className="w-full md:w-1/2 p-8 md:p-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Create a Patient Account
          </h2>
          <p className="text-gray-600 mb-8">Let's get you started.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* UPDATED: Added text-gray-900 to all input fields for visibility */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <User
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  name="first_name"
                  placeholder="First Name"
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-2 border rounded-lg bg-gray-50 focus:ring-1 focus:ring-cyan-500 text-gray-900"
                  required
                />
              </div>
              <div className="relative">
                <User
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  name="last_name"
                  placeholder="Last Name"
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-2 border rounded-lg bg-gray-50 focus:ring-1 focus:ring-cyan-500 text-gray-900"
                  required
                />
              </div>
            </div>
            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                name="email"
                type="email"
                placeholder="Email Address"
                onChange={handleChange}
                className="w-full pl-10 pr-3 py-2 border rounded-lg bg-gray-50 focus:ring-1 focus:ring-cyan-500 text-gray-900"
                required
              />
            </div>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                name="password"
                type="password"
                placeholder="Password"
                onChange={handleChange}
                className="w-full pl-10 pr-3 py-2 border rounded-lg bg-gray-50 focus:ring-1 focus:ring-cyan-500 text-gray-900"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div className="relative">
                <Calendar
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  name="dob"
                  type="date"
                  placeholder="Date of Birth"
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-2 border rounded-lg bg-gray-50 focus:ring-1 focus:ring-cyan-500 text-gray-700"
                  required
                />
              </div>
              <select
                name="gender"
                onChange={handleChange}
                className={`w-full p-2 border rounded-lg bg-gray-50 focus:ring-1 focus:ring-cyan-500 ${
                  formData.gender ? "text-gray-900" : "text-gray-400"
                }`}
                required
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="relative">
              <HeartPulse
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                name="blood_type"
                type="text"
                placeholder="Blood Type (e.g., A+)"
                onChange={handleChange}
                className="w-full pl-10 pr-3 py-2 border rounded-lg bg-gray-50 focus:ring-1 focus:ring-cyan-500 text-gray-900"
              />
            </div>

            <div className="pt-4 border-t">
              <div className="relative mb-4">
                <Phone
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  name="contact_number"
                  placeholder="Contact Number"
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-2 border rounded-lg bg-gray-50 focus:ring-1 focus:ring-cyan-500 text-gray-900"
                />
              </div>
              <div className="relative">
                <Shield
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  name="emergency_contact"
                  placeholder="Emergency Contact Name & Number"
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-2 border rounded-lg bg-gray-50 focus:ring-1 focus:ring-cyan-500 text-gray-900"
                />
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}
            {success && (
              <p className="text-green-500 text-sm text-center">{success}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cyan-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-cyan-700 transition duration-300 disabled:bg-gray-400"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>

            <div className="text-center mt-4">
              <span className="text-gray-600">Already have an account? </span>
              <Link
                to="/login"
                className="text-cyan-600 hover:underline font-semibold"
              >
                Login here
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
