import React, { useEffect, useState } from "react";
import { useEmployeeAuth } from "../context/EmployeeAuthContext";
import axios from "axios";
import { Calendar, Clock, User, FileText, Eye, Loader } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
// ✅ FIX: Import the new modal component
import PrescriptionModal from "../components/PrescriptionModal";

const AppointmentCard = ({ appointment, onSelectAppointment }) => {
  const navigate = useNavigate();

  return (
    <div
      className={`p-6 rounded-2xl shadow-md border ${
        new Date(appointment.appointment_date) < new Date()
          ? "bg-gray-100 border-gray-200"
          : "bg-white border-blue-100"
      }`}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-bold text-gray-900">
            {appointment.patient_first_name} {appointment.patient_last_name}
          </h3>
          <p className="text-md text-indigo-600 font-semibold">
            {appointment.patient_email}
          </p>
        </div>
        <div
          className="flex items-center text-xs font-semibold px-3 py-1 rounded-full"
          style={{
            background: appointment.status === "Done" ? "#d1fae5" : "#dbeafe",
            color: appointment.status === "Done" ? "#065f46" : "#1e40af",
          }}
        >
          <Clock size={14} className="mr-1.5" />
          {appointment.status}
        </div>
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
        {appointment.status !== "Done" ? (
          <button
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-semibold"
            onClick={() =>
              navigate(
                `/employee-portal/appointments/${appointment.appointment_id}/prescribe`
              )
            }
          >
            Write Prescription
          </button>
        ) : (
          <button
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold flex items-center gap-2"
            onClick={() => onSelectAppointment(appointment)}
          >
            <Eye size={18} /> View Prescription
          </button>
        )}
      </div>
    </div>
  );
};

const EmployeeSchedulePage = () => {
  const { employeeUser, loading: authLoading } = useEmployeeAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ FIX: Add state for the new modal
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({
    prescription: null,
    patient: null,
    doctor: null,
  });
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    const refreshAppointments = async () => {
      if (!employeeUser || !employeeUser.employee?.doctor_id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const response = await axios.get(
          `/api/doctors/${employeeUser.employee.doctor_id}/appointments`
        );
        setAppointments(response.data);
        setError(null);
      } catch (err) {
        setError("Could not fetch your schedule. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      refreshAppointments();
    }
  }, [employeeUser, authLoading]);

  // ✅ FIX: New function to handle viewing the prescription
  const handleViewPrescription = async (appointment) => {
    setModalLoading(true);
    setShowModal(true);
    try {
      const [presRes, patRes] = await Promise.all([
        axios.get(
          `/api/appointments/${appointment.appointment_id}/prescription`
        ),
        axios.get(`/api/patient/${appointment.patient_id}`),
      ]);

      setModalData({
        prescription: presRes.data,
        patient: patRes.data,
        doctor: employeeUser.employee, // We already have doctor data
      });
    } catch {
      alert("Could not load full prescription details.");
      setShowModal(false);
    } finally {
      setModalLoading(false);
    }
  };

  if (loading)
    return (
      <div className="text-center py-20 font-semibold text-lg">
        Loading Your Schedule...
      </div>
    );
  if (error)
    return (
      <div className="text-center py-20 text-red-600 font-semibold text-lg">
        {error}
      </div>
    );

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-6 py-12">
        <div className="flex items-center mb-10">
          <Link
            to="/employee-portal"
            className="p-2 rounded-full hover:bg-gray-200 mr-4"
          >
            <User size={24} className="text-gray-700" />
          </Link>
          <div>
            <h1 className="text-5xl font-extrabold text-gray-900">
              My Schedule
            </h1>
            <p className="text-xl text-gray-600 mt-1">
              All your upcoming and past appointments.
            </p>
          </div>
        </div>
        {appointments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {appointments.map((app) => (
              <AppointmentCard
                key={app.appointment_id}
                appointment={app}
                onSelectAppointment={handleViewPrescription}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border-2 border-dashed rounded-xl">
            <User size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-2xl font-bold text-gray-700">
              No Appointments Found
            </h3>
            <p className="text-gray-500 mt-2">
              You have no scheduled appointments yet.
            </p>
          </div>
        )}

        {/* ✅ FIX: Render the new modal */}
        {showModal &&
          (modalLoading ? (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
              <Loader className="text-white animate-spin" size={48} />
            </div>
          ) : (
            <PrescriptionModal
              prescription={modalData.prescription}
              patient={modalData.patient}
              doctor={modalData.doctor}
              onClose={() => setShowModal(false)}
            />
          ))}
      </div>
    </div>
  );
};

export default EmployeeSchedulePage;
