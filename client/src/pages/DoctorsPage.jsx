import React, { useState, useEffect } from "react";
import axios from "../api/axios";
import { Link } from "react-router-dom";
import { Search, Stethoscope, User } from "lucide-react";

const DoctorCard = ({ doctor }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border">
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-800">
          Dr. {doctor.first_name} {doctor.last_name}
        </h3>
        <p className="text-md text-indigo-600 font-semibold">
          {doctor.specialization}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          {doctor.department_name} Department
        </p>
        <Link
          to={`/doctor/${doctor.doctor_id}`}
          className="btn btn-primary btn-sm mt-4 w-full"
        >
          View Profile & Book
        </Link>
      </div>
    </div>
  );
};

const DoctorsPage = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchDoctors = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await axios.get("/doctors", {
          params: { search: searchTerm },
        });
        setDoctors(response.data);
      } catch (err) {
        setError("Could not fetch doctors.");
      } finally {
        setLoading(false);
      }
    };

    const timerId = setTimeout(() => {
      fetchDoctors();
    }, 300); // Debounce search

    return () => clearTimeout(timerId);
  }, [searchTerm]);

  return (
    <div className="bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-extrabold text-gray-900">
            Find Your Doctor
          </h1>
          <p className="text-xl text-gray-600 mt-2">
            Search by name, specialty, or department.
          </p>
          <div className="mt-8 max-w-2xl mx-auto">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4">
                <Search className="text-gray-400" />
              </span>
              <input
                type="text"
                placeholder="e.g., 'Dr. Smith', 'Cardiology', or 'Pediatrics'"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border rounded-full bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none text-gray-900"
              />
            </div>
          </div>
        </div>

        {error && <p className="text-center py-10 text-red-500">{error}</p>}

        {loading && <p className="text-center py-10">Loading Doctors...</p>}

        {!loading && doctors.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {doctors.map((doc) => (
              <DoctorCard key={doc.doctor_id} doctor={doc} />
            ))}
          </div>
        )}

        {!loading && doctors.length === 0 && !error && (
          <div className="text-center py-16 border-2 border-dashed rounded-xl">
            <User size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-2xl font-bold text-gray-700">
              No Doctors Found
            </h3>
            <p className="text-gray-500 mt-2">
              Your search for "{searchTerm}" did not match any of our doctors.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorsPage;
