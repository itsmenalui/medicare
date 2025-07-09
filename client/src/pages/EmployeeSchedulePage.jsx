import React, { useEffect, useState } from "react";
import { useEmployeeAuth } from "../context/EmployeeAuthContext";
import axios from "axios";
import { Calendar, Clock, User, FileText, Eye } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const AppointmentCard = ({ appointment, onPrescriptionCreated }) => {
  const isPast = new Date(appointment.appointment_date) < new Date();
  const cardClass = isPast
    ? "bg-gray-100 border-gray-200"
    : "bg-white border-blue-100";
  const navigate = useNavigate();
  const [prescription, setPrescription] = useState(null);
  const [loadingPrescription, setLoadingPrescription] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const handlePrescriptionCreated = () => {
    setPrescription(null); // force refetch
    if (onPrescriptionCreated) onPrescriptionCreated();
  };

  useEffect(() => {
    const fetchPrescription = async () => {
      setLoadingPrescription(true);
      try {
        const res = await axios.get(`/api/appointments/${appointment.appointment_id}/prescription`);
        setPrescription(res.data);
      } catch (err) {
        setPrescription(null);
      } finally {
        setLoadingPrescription(false);
      }
    };
    fetchPrescription();
  }, [appointment.appointment_id]);

  return (
    <div className={`p-6 rounded-2xl shadow-md border ${cardClass}`}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-bold text-gray-900">
            {appointment.patient_first_name} {appointment.patient_last_name}
          </h3>
          <p className="text-md text-indigo-600 font-semibold">
            {appointment.patient_email}
          </p>
        </div>
        <div className="flex items-center text-xs font-semibold px-3 py-1 rounded-full"
          style={{ background: appointment.status === 'Done' ? '#d1fae5' : '#dbeafe', color: appointment.status === 'Done' ? '#065f46' : '#1e40af' }}>
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
        {/* Prescription Buttons */}
        {loadingPrescription ? (
          <span className="text-gray-400">Checking prescription...</span>
        ) : prescription ? (
          <>
            <button
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold flex items-center gap-2"
              onClick={() => setShowModal(true)}
            >
              <Eye size={18} /> View Prescription
            </button>
            {showModal && (
              <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                <div className="bg-white p-8 rounded-lg max-w-lg w-full relative">
                  <button className="absolute top-2 right-2 text-gray-500" onClick={() => setShowModal(false)}>&times;</button>
                  <h2 className="text-2xl font-bold mb-4">Prescription Details</h2>
                  <div className="mb-2"><b>Date:</b> {prescription.prescription_date ? new Date(prescription.prescription_date).toLocaleString() : ""}</div>
                  <div className="mb-2"><b>Instructions:</b> {prescription.instructions}</div>
                  <div className="mb-2"><b>Medicines:</b>
                    <ul className="list-disc ml-6">
                      {prescription.medicines.map((med, idx) => (
                        <li key={idx}>
                          {(med.medication_name || med.custom_name || med.medication_id)} ({med.type}) - {med.dosage}, {med.times_per_day}x/day, {med.days} days, Qty: {med.quantity}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mb-2"><b>Checkups:</b>
                    <ul className="list-disc ml-6">
                      {prescription.checkups.map((c, idx) => (
                        <li key={idx}>{c.description}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <button
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-semibold"
            onClick={() => navigate(`/employee-portal/appointments/${appointment.appointment_id}/prescribe`)}
          >
            Write Prescription
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

  const refreshAppointments = async () => {
    if (!employeeUser || !employeeUser.employee) return;
    setLoading(true);
    try {
      const response = await axios.get(
        `/api/doctor/${employeeUser.employee.doctor_id}/appointments`
      );
      setAppointments(response.data);
      setError(null);
    } catch (err) {
      setError("Could not fetch your schedule. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    refreshAppointments();
  }, [employeeUser, authLoading]);

  if (loading) {
    return (
      <div className="text-center py-20 font-semibold text-lg">
        Loading Your Schedule...
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
              <AppointmentCard key={app.appointment_id} appointment={app} onPrescriptionCreated={refreshAppointments} />
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
      </div>
    </div>
  );
};

export default EmployeeSchedulePage; 