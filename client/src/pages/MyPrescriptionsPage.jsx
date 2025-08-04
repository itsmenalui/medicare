import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { usePatientAuth } from "../context/PatientAuthContext";
import { useCart } from "../context/CartContext"; // Using your existing CartContext
import axios from "../api/axios";
import { Eye, FileText, ArrowLeft, Loader } from "lucide-react";
import PrescriptionModal from "/src/components/PrescriptionModal.jsx";

const MyPrescriptionsPage = () => {
  const { user, loading: authLoading } = usePatientAuth();
  const { addToCart } = useCart(); // Get the addToCart function from your context
  const navigate = useNavigate();
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
    if (authLoading) return;
    const patientId = user?.patient?.patient_id;
    if (!patientId) {
      setError("Patient information not found. Please log in again.");
      setLoading(false);
      return;
    }
    setLoading(true);
    axios
      .get(`/api/patient/${patientId}/appointments`)
      .then((res) =>
        setAppointments(res.data.filter((a) => a.status === "Done"))
      )
      .catch(() => setError("Could not fetch your prescriptions."))
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  const handleViewPrescription = async (appointment) => {
    setModalLoading(true);
    setShowModal(true);
    try {
      const presRes = await axios.get(
        `/api/appointments/${appointment.appointment_id}/prescription`
      );
      const doctorData = {
        first_name: appointment.doc_first_name,
        last_name: appointment.doc_last_name,
        specialization: appointment.specialization,
      };
      setModalData({
        prescription: presRes.data,
        doctor: doctorData,
        patient: user.patient,
      });
    } catch (err) {
      alert("Could not load full prescription details.");
      setShowModal(false);
    } finally {
      setModalLoading(false);
    }
  };

  const handleBuyNow = async () => {
    try {
      const allMedsResponse = await axios.get(
        "/api/pharmacy/medications?limit=2000"
      );
      const availableMeds = allMedsResponse.data.medications;
      const medsMap = new Map(availableMeds.map((m) => [m.medication_id, m]));

      const prescribedMeds = modalData.prescription.medicines;
      let itemsAddedCount = 0;

      for (const prescribedMed of prescribedMeds) {
        if (
          prescribedMed.medication_id &&
          medsMap.has(prescribedMed.medication_id)
        ) {
          const fullMedDetails = medsMap.get(prescribedMed.medication_id);

          for (let i = 0; i < prescribedMed.quantity; i++) {
            addToCart(fullMedDetails);
          }
          itemsAddedCount++;
        }
      }

      if (itemsAddedCount > 0) {
        alert(
          `${itemsAddedCount} type(s) of medicine have been added to your cart.`
        );
        navigate("/checkout");
      } else {
        alert(
          "None of the prescribed items are available in the pharmacy at this time."
        );
      }
      setShowModal(false);
    } catch (error) {
      console.error("Failed to add items to cart", error);
      alert("There was an issue adding items to the cart.");
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center mb-10">
          <Link
            to="/portal"
            className="p-2 rounded-full hover:bg-gray-200 mr-4"
          >
            <ArrowLeft size={24} className="text-gray-700" />
          </Link>
          <div>
            <h1 className="text-5xl font-extrabold text-gray-900">
              My Prescriptions
            </h1>
            <p className="text-xl text-gray-600 mt-1">
              A record of all prescriptions from your doctors.
            </p>
          </div>
        </div>

        {loading || authLoading ? (
          <div className="text-center py-20 font-semibold">Loading...</div>
        ) : error ? (
          <div className="text-center py-20 text-red-600 font-semibold">
            {error}
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed rounded-xl">
            <FileText size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-2xl font-bold text-gray-700">
              No Prescriptions Found
            </h3>
            <p className="text-gray-500 mt-2">
              You do not have any prescriptions yet.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {appointments.map((app) => (
              // ✅ FIX: Improved styling for better visibility
              <div
                key={app.appointment_id}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 flex items-center justify-between"
              >
                <div>
                  <h3 className="font-bold text-xl text-gray-800">
                    Dr. {app.doc_first_name} {app.doc_last_name}
                  </h3>
                  <p className="text-indigo-600 font-semibold">
                    {app.specialization}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Date: {new Date(app.appointment_date).toLocaleString()}
                  </p>
                </div>
                <button
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold flex items-center gap-2 shadow hover:shadow-md transition-all"
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
              onBuyNow={handleBuyNow}
            />
          ))}
      </div>
    </div>
  );
};

export default MyPrescriptionsPage;
