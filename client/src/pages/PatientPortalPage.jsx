import React from "react";
import { Link } from "react-router-dom";
import { usePatientAuth } from "../context/PatientAuthContext.jsx";
import {
  Calendar,
  Pill,
  MessageSquare,
  ArrowRight,
  BedDouble,
  User,
  Mail,
  Phone,
  Droplets,
} from "lucide-react";

const PortalCard = ({ to, title, description, icon, color }) => (
  <Link
    to={to}
    className="group block bg-white p-6 rounded-2xl shadow-md hover:shadow-2xl hover:-translate-y-2 transition-transform duration-300"
  >
    <div className="flex items-start justify-between">
      <div className={`p-4 rounded-full ${color}`}>{icon}</div>
      <ArrowRight className="text-gray-300 group-hover:text-gray-500 transition-colors" />
    </div>
    <div className="mt-4">
      <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
      <p className="text-gray-600 mt-1">{description}</p>
    </div>
  </Link>
);

const PatientProfileCard = ({ patient }) => (
  <div className="bg-white p-6 rounded-2xl shadow-md h-full">
    <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">
      My Profile
    </h2>
    <div className="space-y-4">
      <div className="flex items-center">
        <User className="w-5 h-5 text-gray-500 mr-3" />
        <span className="text-gray-700">
          {patient?.first_name} {patient?.last_name}
        </span>
      </div>
      <div className="flex items-center">
        <Mail className="w-5 h-5 text-gray-500 mr-3" />
        <span className="text-gray-700">{patient?.email}</span>
      </div>
      <div className="flex items-center">
        <Phone className="w-5 h-5 text-gray-500 mr-3" />
        <span className="text-gray-700">{patient?.contact_number}</span>
      </div>
      <div className="flex items-center">
        <Droplets className="w-5 h-5 text-gray-500 mr-3" />
        <span className="text-gray-700">Blood Type: {patient?.blood_type}</span>
      </div>
    </div>
  </div>
);

const PatientPortalPage = () => {
  const { user, loading } = usePatientAuth();

  if (loading) {
    return (
      <div className="text-center py-20 font-semibold text-lg">
        Loading Patient Portal...
      </div>
    );
  }

  // ✅ FIX: This defensive logic handles different user object structures.
  // It checks for the nested 'patient' object first, then falls back to the top-level 'user' object.
  const patientData = user?.patient ? user.patient : user;

  // Now, check if the resolved patient data is valid.
  if (!patientData || !patientData.patient_id) {
    return (
      <div className="text-center py-20 text-red-600 font-semibold text-lg">
        Could not load patient data. Please try logging in again.
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-6 py-12">
        <div className="mb-10">
          {/* ✅ FIX: Use the safe 'patientData' variable */}
          <h1 className="text-5xl font-extrabold text-gray-900">
            Welcome back, {patientData.first_name || "Patient"}!
          </h1>
          <p className="text-xl text-gray-600 mt-2">
            This is your personal health dashboard. Manage your healthcare with
            ease.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            {/* ✅ FIX: Pass the safe 'patientData' variable */}
            <PatientProfileCard patient={patientData} />
          </div>
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
            <PortalCard
              to="/portal/appointments"
              title="My Appointments"
              description="View past and upcoming appointments."
              icon={<Calendar size={28} className="text-blue-800" />}
              color="bg-blue-100"
            />
            <PortalCard
              to="/portal/my-bookings"
              title="My Room Bookings"
              description="View your room booking history."
              icon={<BedDouble size={28} className="text-teal-800" />}
              color="bg-teal-100"
            />
            <PortalCard
              to="/portal/prescriptions"
              title="My Prescriptions"
              description="Check your current and past medication."
              icon={<Pill size={28} className="text-indigo-800" />}
              color="bg-indigo-100"
            />
            <div className="md:col-span-2">
              <PortalCard
                to="/portal/chat"
                title="Chat with Staff"
                description="Directly message doctors and other hospital staff."
                icon={<MessageSquare size={28} className="text-pink-800" />}
                color="bg-pink-100"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientPortalPage;
