import React, { useEffect, useState, useMemo } from "react";
import { useEmployeeAuth } from "../context/EmployeeAuthContext";
import api from "../api/axios"; // Use the custom api instance
import {
  Calendar,
  Clock,
  User,
  FileText,
  Eye,
  Loader,
  ArrowLeft,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import PrescriptionModal from "../components/PrescriptionModal";

// --- Reusable Appointment Card Component ---
const AppointmentCard = ({ appointment, onSelectAppointment }) => {
  const navigate = useNavigate();
  const appointmentDate = new Date(appointment.appointment_date);

  return (
    <div
      className={`p-6 rounded-2xl shadow-md border ${
        appointmentDate < new Date()
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
            {appointmentDate.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>
        <div className="flex items-center">
          <Clock size={16} className="mr-3 text-gray-500" />
          <span>
            {appointmentDate.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })}
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

// --- Main Page Component ---
const EmployeeSchedulePage = () => {
  const { employeeUser, loading: authLoading } = useEmployeeAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({
    prescription: null,
    patient: null,
    doctor: null,
  });
  const [modalLoading, setModalLoading] = useState(false);

  const [availability, setAvailability] = useState([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(true);

  // Fetch appointments
  useEffect(() => {
    const refreshAppointments = async () => {
      if (!employeeUser || !employeeUser.employee?.doctor_id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const response = await api.get(
          `/doctors/${employeeUser.employee.doctor_id}/appointments`
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

  // Function to fetch availability
  const fetchAvailability = async () => {
    if (!employeeUser || !employeeUser.employee?.doctor_id) return;
    setAvailabilityLoading(true);
    try {
      const res = await api.get(
        `/doctors/${employeeUser.employee.doctor_id}/availability`
      );
      setAvailability(res.data);
    } catch (error) {
      console.error("Could not fetch availability", error);
    } finally {
      setAvailabilityLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && employeeUser) {
      fetchAvailability();
    }
  }, [employeeUser, authLoading]);

  // Handle viewing a prescription
  const handleViewPrescription = async (appointment) => {
    setModalLoading(true);
    setShowModal(true);
    try {
      const [presRes, patRes] = await Promise.all([
        api.get(`/appointments/${appointment.appointment_id}/prescription`),
        api.get(`/patients/${appointment.patient_id}`),
      ]);

      setModalData({
        prescription: presRes.data,
        patient: patRes.data,
        doctor: employeeUser.employee,
      });
    } catch {
      alert("Could not load full prescription details.");
      setShowModal(false);
    } finally {
      setModalLoading(false);
    }
  };

  // Group schedule by day for a better UI
  const groupedSchedule = useMemo(() => {
    return availability.reduce((acc, slot) => {
      const date = new Date(slot.time).toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      });
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(slot);
      return acc;
    }, {});
  }, [availability]);

  // Function to mark a slot as unavailable
  const handleMarkSlotUnavailable = async (timeSlot) => {
    if (!confirm("Are you sure you want to make this time slot unavailable?"))
      return;

    try {
      await api.post(
        `/doctors/${employeeUser.employee.doctor_id}/availability/unavailable`,
        { time_slot: timeSlot }
      );
      fetchAvailability();
      alert("Slot successfully marked as unavailable!");
    } catch (error) {
      console.error("Failed to mark slot unavailable:", error);
      alert("Failed to mark slot as unavailable. Please try again.");
    }
  };

  if (loading || authLoading)
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
            <ArrowLeft size={24} className="text-gray-700" />
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

        {/* --- Availability Management Section --- */}
        <div className="mt-16">
          <h2 className="text-4xl font-bold text-gray-900 border-b pb-4 mb-8">
            Manage My Availability
          </h2>
          {availabilityLoading ? (
            <div className="text-center">Loading availability...</div>
          ) : (
            <div className="space-y-6">
              {Object.keys(groupedSchedule).length > 0 ? (
                Object.keys(groupedSchedule).map((date) => (
                  <div
                    key={date}
                    className="bg-white p-6 rounded-2xl shadow-md"
                  >
                    <h3 className="text-xl font-bold text-gray-800 mb-4">
                      {date}
                    </h3>
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-8 gap-3">
                      {/* ✅ FIX: Refined button rendering logic for clarity */}
                      {groupedSchedule[date].map((slot) => {
                        const isAvailable = slot.status === "available";
                        const capitalStatus =
                          slot.status.charAt(0).toUpperCase() +
                          slot.status.slice(1);

                        return (
                          <button
                            key={slot.time}
                            disabled={!isAvailable}
                            onClick={() => handleMarkSlotUnavailable(slot.time)}
                            className={`py-2 px-1 rounded-lg text-sm font-semibold border transition text-center shadow-sm ${
                              isAvailable
                                ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-200 hover:shadow-md"
                                : "bg-gray-200 text-gray-400 cursor-not-allowed line-through"
                            }`}
                            title={
                              isAvailable
                                ? "Click to mark as unavailable"
                                : `Slot is ${capitalStatus}`
                            }
                          >
                            {new Date(slot.time).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-gray-500">
                  No upcoming availability slots found in your schedule.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Prescription Modal */}
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
