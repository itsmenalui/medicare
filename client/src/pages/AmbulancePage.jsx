import React, { useState, useEffect } from "react";
import axios from "axios";
import { usePatientAuth } from "../context/PatientAuthContext";
import { useEmployeeAuth } from "../context/EmployeeAuthContext";

// A reusable component for each ambulance card
const AmbulanceCard = ({ ambulance, onBook, isUserLoggedIn }) => {
  const isAvailable = ambulance.status === "Available";

  return (
    <div
      className={`text-white p-6 rounded-lg shadow-lg flex flex-col items-center text-center ${
        isAvailable ? "bg-gray-800" : "bg-gray-700"
      }`}
    >
      <div
        className={`font-bold px-3 py-1 rounded-full mb-4 text-sm ${
          isAvailable ? "bg-green-500 text-gray-900" : "bg-red-500 text-white"
        }`}
      >
        ID: {ambulance.ambulance_id}
      </div>
      <p className="text-lg mb-2">
        Estimated Arrival:{" "}
        <span className="font-bold text-blue-400">
          {ambulance.estimated_arrival_mins} minutes
        </span>
      </p>
      <p className="text-lg mb-4 font-mono">{ambulance.contact_number}</p>
      <div className="mb-6">
        <span className="mr-2">Status:</span>
        <span
          className={`font-semibold px-4 py-1 rounded-md ${
            isAvailable
              ? "bg-green-200 text-green-800"
              : "bg-red-200 text-red-800"
          }`}
        >
          {ambulance.status}
        </span>
      </div>
      {/* UPDATED: The button is now disabled if the user is not logged in */}
      <button
        onClick={() => onBook(ambulance.ambulance_id)}
        disabled={!isAvailable || !isUserLoggedIn}
        className={`btn w-full ${
          isAvailable ? "btn-primary" : "btn-disabled"
        } disabled:bg-gray-400 disabled:cursor-not-allowed`}
      >
        {isAvailable
          ? isUserLoggedIn
            ? "Book Now"
            : "Login to Book"
          : "Unavailable"}
      </button>
    </div>
  );
};

const AmbulancePage = () => {
  const [ambulances, setAmbulances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get authentication status from both patient and employee contexts
  const { isAuthenticated: isPatientAuthenticated } = usePatientAuth();
  const { isEmployeeAuthenticated } = useEmployeeAuth();

  // A user is considered logged in if either context returns true
  const isUserLoggedIn = isPatientAuthenticated || isEmployeeAuthenticated;

  useEffect(() => {
    const fetchAmbulances = async () => {
      try {
        const response = await axios.get("/api/ambulances");
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
  }, []);

  const handleBookAmbulance = async (ambulanceId) => {
    // You would typically send the logged-in user's ID here
    try {
      await axios.post("/api/ambulances/book", { ambulance_id: ambulanceId });
      setAmbulances((currentAmbulances) =>
        currentAmbulances.map((amb) =>
          amb.ambulance_id === ambulanceId ? { ...amb, status: "Booked" } : amb
        )
      );
      alert("Ambulance booked successfully!");
    } catch (err) {
      if (err.response && err.response.status === 409) {
        alert(err.response.data.error);
      } else {
        console.error("Failed to book ambulance:", err);
        alert("An error occurred while booking. Please try again.");
      }
    }
  };

  return (
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

        {loading && (
          <p className="text-center text-white text-lg">
            Loading available ambulances...
          </p>
        )}
        {error && <p className="text-center text-red-500 text-lg">{error}</p>}

        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {ambulances.map((ambulance) => (
              <AmbulanceCard
                key={ambulance.ambulance_id}
                ambulance={ambulance}
                onBook={handleBookAmbulance}
                isUserLoggedIn={isUserLoggedIn} // Pass the login status to the card
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AmbulancePage;
