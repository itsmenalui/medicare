import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "../api/axios";
import {
  Mail,
  Lock,
  User,
  Phone,
  Stethoscope,
  Award,
  Building,
  DollarSign, // ✅ 1. Import the new icon
} from "lucide-react";

const EmployeeSignupPage = () => {
  const [role, setRole] = useState(null);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    contact_number: "",
    license_number: "",
    department_name: "",
    doctor_type_id: "",
    consultation_fee: "", // ✅ 2. Add the new field to the form state
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
    if (!role) {
      setError("Please select a role.");
      return;
    }
    setError("");
    setSuccess("");
    setLoading(true);

    const payload = {
      role,
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      password: formData.password,
      contact_number: formData.contact_number,
      license_number: formData.license_number,
      department_name: formData.department_name,
    };

    if (role === "Doctor") {
      payload.doctor_type_id = formData.doctor_type_id;
      payload.consultation_fee = formData.consultation_fee; // ✅ 3. Add the fee to the payload
    }

    try {
      // Using the custom api instance is better, but this will work
      await axios.post("/api/employee/signup", payload);
      setSuccess("Account submitted! Please wait for admin approval.");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fadeIn {
            animation: fadeIn 0.5s ease-out forwards;
          }
        `}
      </style>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-5xl mx-auto bg-white rounded-2xl shadow-2xl flex overflow-hidden">
          <div className="hidden md:flex w-1/2 bg-gradient-to-br from-purple-500 to-indigo-600 p-12 text-white flex-col justify-between relative overflow-hidden">
            <div>
              <h1 className="text-4xl font-extrabold mb-4">
                Join the MediCare Professional Team.
              </h1>
              <p className="text-indigo-100">
                Register for an employee account to manage patients and access
                our internal systems.
              </p>
            </div>
            <Stethoscope
              size={100}
              className="absolute bottom-8 right-8 opacity-10"
            />
          </div>

          <div className="w-full md:w-1/2 p-8 md:p-12">
            <h2 className="text-3xl font-bold text-indigo-600 mb-2">
              Employee Registration
            </h2>
            <p className="text-gray-500 mb-8">First, select your role.</p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <button
                type="button"
                onClick={() => setRole("Doctor")}
                className={`p-4 rounded-lg text-center font-bold text-lg transition-all duration-300 transform hover:scale-105 ${
                  role === "Doctor"
                    ? "bg-cyan-500 text-white shadow-lg"
                    : "bg-cyan-50 text-cyan-800 hover:bg-cyan-100"
                }`}
              >
                Doctor
              </button>
              <button
                type="button"
                onClick={() => setRole("Nurse")}
                className={`p-4 rounded-lg text-center font-bold text-lg transition-all duration-300 transform hover:scale-105 ${
                  role === "Nurse"
                    ? "bg-cyan-500 text-white shadow-lg"
                    : "bg-cyan-50 text-cyan-800 hover:bg-cyan-100"
                }`}
              >
                Nurse
              </button>
            </div>

            {role && (
              <form
                onSubmit={handleSubmit}
                className="space-y-4 animate-fadeIn"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  <div className="relative">
                    <User
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={20}
                    />
                    <input
                      name="first_name"
                      placeholder="First Name"
                      onChange={handleChange}
                      className="w-full pl-10 pr-3 py-2 border rounded-lg"
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
                      className="w-full pl-10 pr-3 py-2 border rounded-lg"
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
                    placeholder="Work Email"
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-2 border rounded-lg"
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
                    className="w-full pl-10 pr-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div className="relative">
                  <Phone
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    name="contact_number"
                    placeholder="Contact Number"
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-2 border rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  <div className="relative">
                    <Award
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={20}
                    />
                    <input
                      name="license_number"
                      placeholder="License Number"
                      onChange={handleChange}
                      className="w-full pl-10 pr-3 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div className="relative">
                    <Building
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={20}
                    />
                    <input
                      name="department_name"
                      type="text"
                      placeholder="Department Name"
                      onChange={handleChange}
                      className="w-full pl-10 pr-3 py-2 border rounded-lg"
                      required
                    />
                  </div>
                </div>

                {/* ✅ 4. Conditionally render the new fields for Doctors */}
                {role === "Doctor" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t animate-fadeIn">
                    <div className="relative">
                      <Stethoscope
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        size={20}
                      />
                      <input
                        name="doctor_type_id"
                        type="number"
                        placeholder="Doctor Type ID"
                        onChange={handleChange}
                        className="w-full pl-10 pr-3 py-2 border rounded-lg"
                        required
                      />
                    </div>
                    <div className="relative">
                      <DollarSign
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        size={20}
                      />
                      <input
                        name="consultation_fee"
                        type="number"
                        placeholder="Consultation Fee"
                        onChange={handleChange}
                        className="w-full pl-10 pr-3 py-2 border rounded-lg"
                        required
                      />
                    </div>
                  </div>
                )}

                {error && (
                  <p className="text-red-500 text-sm text-center">{error}</p>
                )}
                {success && (
                  <p className="text-green-500 text-sm text-center">
                    {success}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition disabled:bg-gray-400"
                >
                  {loading ? "Registering..." : "Complete Registration"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default EmployeeSignupPage;
