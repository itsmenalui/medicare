import React, { useState, useEffect } from "react";
import axios from "../api/axios";
import { usePatientAuth } from "../context/PatientAuthContext";
import { useAdminAuth } from "../context/AdminAuthContext";
import { useCart } from "../context/CartContext"; // ✅ FIX: Import useCart
import { Phone, CheckCircle, XCircle, Wrench } from "lucide-react";

const AmbulancePage = () => {
  const { isAdminAuthenticated } = useAdminAuth();
  const [ambulances, setAmbulances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { user: patientUser } = usePatientAuth();
  const { refreshDbBillCount } = useCart(); // ✅ FIX: Get the refresh function
  const isUserLoggedIn = !!patientUser;

  useEffect(() => {
    const fetchAmbulances = async () => {
      setLoading(true);
      try {
        const url = isAdminAuthenticated
          ? "/api/admin/ambulances/details"
          : "/api/ambulances";
        const response = await axios.get(url);
        setAmbulances(response.data);
        setError(null);
      } catch (err) {
        setError("Failed to fetch ambulance data. Please try again later.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAmbulances();
  }, [isAdminAuthenticated]);

  const handleBookAmbulance = async (ambulanceId) => {
    if (!patientUser || !patientUser.patient?.patient_id) {
      alert("Only logged-in patients can book an ambulance.");
      return;
    }
    try {
      await axios.post("/api/ambulances/book", {
        ambulance_id: ambulanceId,
        patient_id: patientUser.patient.patient_id,
      });
      
      // Refresh the list to show the updated status
      const response = await axios.get("/api/ambulances");
      setAmbulances(response.data);
      
      refreshDbBillCount(); // ✅ FIX: Refresh the cart count immediately
      alert("Ambulance booked successfully!");

    } catch (err) {
      alert(err.response?.data?.error || "An error occurred while booking.");
    }
  };

  return isAdminAuthenticated ? (
    <AdminAmbulanceView
      ambulances={ambulances}
      loading={loading}
      error={error}
    />
  ) : (
    <PatientAmbulanceView
      ambulances={ambulances.filter((a) => a.status === "Available")}
      loading={loading}
      error={error}
      onBook={handleBookAmbulance}
      isUserLoggedIn={isUserLoggedIn}
    />
  );
};

// --- Admin-Specific View Component ---
const AdminAmbulanceView = ({ ambulances, loading, error }) => (
  <div className="bg-gray-100 min-h-screen p-8">
    <div className="container mx-auto">
      <h1 className="text-4xl font-bold mb-6 text-gray-800">
        Ambulance Fleet Management
      </h1>
      {loading && <p className="text-center">Loading fleet data...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}
      <div className="bg-white p-6 rounded-2xl shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="p-4 font-semibold text-gray-600">
                  Ambulance ID
                </th>
                <th className="p-4 font-semibold text-gray-600">Contact</th>
                <th className="p-4 font-semibold text-gray-600">Status</th>
                <th className="p-4 font-semibold text-gray-600">Booked By</th>
              </tr>
            </thead>
            <tbody>
              {ambulances.map((amb) => (
                <tr
                  key={amb.ambulance_id}
                  className="border-b hover:bg-gray-50"
                >
                  <td className="p-4 font-mono font-semibold text-gray-800">
                    {amb.ambulance_id}
                  </td>
                  <td className="p-4 text-gray-700">{amb.contact_number}</td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center gap-2 px-2.5 py-1 text-xs font-semibold rounded-full ${
                        amb.status === "Available"
                          ? "bg-green-100 text-green-800"
                          : amb.status === "Booked"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {amb.status === "Available" && <CheckCircle size={14} />}
                      {amb.status === "Booked" && <XCircle size={14} />}
                      {amb.status === "Maintenance" && <Wrench size={14} />}
                      {amb.status}
                    </span>
                  </td>
                  <td className="p-4 font-semibold text-gray-700">
                    {amb.booked_by_patient || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
);

// --- Patient-Facing View Component ---
const PatientAmbulanceView = ({
  ambulances,
  loading,
  error,
  onBook,
  isUserLoggedIn,
}) => (
  <div className="bg-gray-900 min-h-screen p-8">
    <div className="container mx-auto">
      <div className="text-center text-white mb-12">
        <h1 className="text-5xl font-bold text-blue-400 mb-2">
          Ambulance Service
        </h1>
        <p className="text-xl text-gray-400">
          Showing available ambulances near you.
        </p>
      </div>
      {loading && <p className="text-center text-white">Loading...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {ambulances.map((ambulance) => (
          <AmbulanceCard
            key={ambulance.ambulance_id}
            ambulance={ambulance}
            onBook={onBook}
            isUserLoggedIn={isUserLoggedIn}
          />
        ))}
      </div>
    </div>
  </div>
);

const AmbulanceCard = ({ ambulance, onBook, isUserLoggedIn }) => (
  <div className="text-white p-6 rounded-lg shadow-lg flex flex-col items-center text-center bg-gray-800">
    <div className="font-bold px-3 py-1 rounded-full mb-4 text-sm bg-green-500 text-gray-900">
      ID: {ambulance.ambulance_id}
    </div>
    <p className="text-lg mb-2">
      Arrival:{" "}
      <span className="font-bold text-blue-400">
        {ambulance.estimated_arrival_mins} mins
      </span>
    </p>
    <p className="text-lg mb-2 font-mono">{ambulance.contact_number}</p>
    <p className="text-2xl font-bold text-cyan-400 my-4">
      ৳{parseFloat(ambulance.booking_fee || 0).toFixed(2)}
    </p>
    <div className="mb-6">
      <span className="mr-2">Status:</span>
      <span className="font-semibold px-4 py-1 rounded-md bg-green-200 text-green-800">
        {ambulance.status}
      </span>
    </div>
    <button
      onClick={() => onBook(ambulance.ambulance_id)}
      disabled={!isUserLoggedIn}
      className="btn w-full btn-primary disabled:bg-gray-400 disabled:cursor-not-allowed"
    >
      {isUserLoggedIn ? "Book Now" : "Login to Book"}
    </button>
  </div>
);

export default AmbulancePage;
