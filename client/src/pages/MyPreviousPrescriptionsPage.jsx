import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useEmployeeAuth } from "../context/EmployeeAuthContext";
import api from "../api/axios"; // Use the custom api instance
import { Eye, FileText, ArrowLeft, Loader } from "lucide-react";
import PrescriptionModal from "../components/PrescriptionModal";

const MyPreviousPrescriptionsPage = () => {
  const { employeeUser } = useEmployeeAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({
    prescription: null,
    patient: null,
    doctor: null,
  });
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    const fetchDoneAppointments = async () => {
      if (!employeeUser || !employeeUser.employee?.doctor_id) {
        setError("Doctor information not found. Please log in again.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const res = await api.get(
          `/doctors/${employeeUser.employee.doctor_id}/appointments?status=Done`
        );
        setAppointments(res.data);
      } catch (err) {
        setError("Could not fetch previous prescriptions.");
      } finally {
        setLoading(false);
      }
    };
    if (employeeUser) {
      fetchDoneAppointments();
    }
  }, [employeeUser]);

  const handleViewPrescription = async (appointment) => {
    setModalLoading(true);
    setShowModal(true);
    try {
      const [presRes, patRes] = await Promise.all([
        api.get(
          `/appointments/${appointment.appointment_id}/prescription`
        ),
        api.get(`/patient/${appointment.patient_id}`),
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

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center mb-10">
          <Link
            to="/employee-portal"
            className="p-2 rounded-full hover:bg-gray-200 mr-4"
          >
            <ArrowLeft size={24} className="text-gray-700" />
          </Link>
          <div>
            <h1 className="text-5xl font-extrabold text-gray-900">
              Previous Prescriptions
            </h1>
            <p className="text-xl text-gray-600 mt-1">
              A record of all prescriptions you have written.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">Loading...</div>
        ) : error ? (
          <div className="text-center py-20 text-red-600">{error}</div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed rounded-xl">
            <FileText size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-2xl font-bold text-gray-700">
              No Prescriptions Found
            </h3>
            <p className="text-gray-500 mt-2">
              You have not written any prescriptions yet.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {appointments.map((app) => (
              <div
                key={app.appointment_id}
                className="bg-white rounded-lg shadow p-6 flex flex-col md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="font-bold text-lg text-gray-800">
                    {app.patient_first_name} {app.patient_last_name}
                  </div>
                  <div className="text-gray-600">{app.patient_email}</div>
                  <div className="text-gray-500 text-sm">
                    {/* CORRECTED: Use consistent date and time formatting */}
                    Date: {new Date(app.appointment_date).toLocaleDateString()}
                    , {new Date(app.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <button
                  className="mt-4 md:mt-0 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold flex items-center gap-2"
                  onClick={() => handleViewPrescription(app)}
                >
                  <Eye size={18} /> View Prescription
                </button>
              </div>
            ))}
          </div>
        )}

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

export default MyPreviousPrescriptionsPage;
