import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { usePatientAuth as useAuth } from "../context/PatientAuthContext";
import axios from "axios";
import {
  Calendar,
  Clock,
  Stethoscope,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  FileText,
} from "lucide-react";

// A reusable card component to display individual appointment details
const AppointmentCard = ({ appointment }) => {
  // Determine if the appointment is in the past for styling
  const isPast = new Date(appointment.appointment_date) < new Date();

  const cardClass = isPast
    ? "bg-gray-100 border-gray-200"
    : "bg-white border-blue-100";

  const getStatusChip = (status) => {
    switch (status) {
      case "Scheduled":
        return (
          <div className="flex items-center text-xs font-semibold text-blue-800 bg-blue-100 px-3 py-1 rounded-full">
            <Clock size={14} className="mr-1.5" /> {status}
          </div>
        );
      case "Completed":
        return (
          <div className="flex items-center text-xs font-semibold text-green-800 bg-green-100 px-3 py-1 rounded-full">
            <CheckCircle2 size={14} className="mr-1.5" /> {status}
          </div>
        );
      case "Cancelled":
        return (
          <div className="flex items-center text-xs font-semibold text-red-800 bg-red-100 px-3 py-1 rounded-full">
            <XCircle size={14} className="mr-1.5" /> {status}
          </div>
        );
      default:
        return (
          <div className="text-xs font-semibold text-gray-800 bg-gray-100 px-3 py-1 rounded-full">
            {status}
          </div>
        );
    }
  };

  return (
    <div className={`p-6 rounded-2xl shadow-md border ${cardClass}`}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-bold text-gray-900">
            Dr. {appointment.doc_first_name} {appointment.doc_last_name}
          </h3>
          <p className="text-md text-indigo-600 font-semibold">
            {appointment.specialization}
          </p>
        </div>
        {getStatusChip(appointment.status)}
      </div>
      <div className="border-t my-4"></div>
      <div className="space-y-3 text-gray-700">
        <div className="flex items-center">
          <Calendar size={16} className="mr-3 text-gray-500" />
          <span>
            {new Date(appointment.appointment_date).toLocaleDateString(
              "en-US",
              {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              }
            )}
          </span>
        </div>
        <div className="flex items-center">
          <Clock size={16} className="mr-3 text-gray-500" />
          <span>
            {new Date(appointment.appointment_date).toLocaleTimeString(
              "en-US",
              { hour: "2-digit", minute: "2-digit", hour12: true }
            )}
          </span>
        </div>
        <div className="flex items-start">
          <FileText size={16} className="mr-3 text-gray-500 mt-1" />
          <div>
            <p className="font-semibold text-gray-600">Reason for visit:</p>
            <p className="text-gray-800">{appointment.reason}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// The main page component
const MyAppointmentPage = () => {
  const { user, loading: authLoading } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !user.patient) {
      setError("You must be logged in to view appointments.");
      setLoading(false);
      return;
    }

    const fetchAppointments = async () => {
      try {
        const response = await axios.get(
          `/api/patient/${user.patient.patient_id}/appointments`
        );
        setAppointments(response.data);
      } catch (err) {
        console.error("Error fetching appointments:", err);
        setError("Could not fetch your appointments. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [user, authLoading]);

  if (loading) {
    return (
      <div className="text-center py-20 font-semibold text-lg">
        Loading Your Appointments...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 text-red-600 font-semibold text-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-6 py-12">
        <div className="flex items-center mb-10">
          <Link
            to="/portal"
            className="p-2 rounded-full hover:bg-gray-200 mr-4"
          >
            <ArrowLeft size={24} className="text-gray-700" />
          </Link>
          <div>
            <h1 className="text-5xl font-extrabold text-gray-900">
              My Appointments
            </h1>
            <p className="text-xl text-gray-600 mt-1">
              A summary of all your medical consultations.
            </p>
          </div>
        </div>

        {/* UPDATED: A single unified list for all appointments */}
        {appointments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {appointments.map((app) => (
              <AppointmentCard key={app.appointment_id} appointment={app} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border-2 border-dashed rounded-xl">
            <Stethoscope size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-2xl font-bold text-gray-700">
              No Appointments Found
            </h3>
            <p className="text-gray-500 mt-2">
              You haven't booked any appointments yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyAppointmentPage;
