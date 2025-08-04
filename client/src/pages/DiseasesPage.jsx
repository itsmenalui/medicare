import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "../api/axios";
import { Search, Stethoscope, ChevronRight } from "lucide-react";

const DiseaseCard = ({ disease, color }) => (
  <Link
    to={`/diseases/${disease.disease_id}`}
    className="group flex flex-col bg-white rounded-lg shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-transform duration-300"
  >
    <div className={`p-5 rounded-t-lg ${color}`}>
      <h3 className="text-2xl font-bold text-white truncate">{disease.name}</h3>
    </div>

    <div className="p-6 flex flex-col flex-grow">
      <p className="text-sm font-semibold text-gray-500 mb-2">
        Common Symptoms:
      </p>
      <div className="flex-grow min-h-[50px]">
        {/* Final, most robust check for symptoms data */}
        {disease.symptoms && disease.symptoms.trim() ? (
          <div className="flex flex-wrap gap-2">
            {disease.symptoms.split(",").map((symptom, index) => (
              <span
                key={index}
                className="bg-gray-200 text-black px-2 py-1 rounded-full text-xs font-medium"
              >
                {symptom.trim()}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">
            No common symptoms listed.
          </p>
        )}
      </div>
      <div className="mt-4 text-right">
        <span className="text-indigo-500 font-semibold group-hover:text-indigo-700 inline-flex items-center">
          Learn More <ChevronRight size={18} className="ml-1" />
        </span>
      </div>
    </div>
  </Link>
);

const DiseasesPage = () => {
  const [diseases, setDiseases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const themeColors = [
    "bg-gradient-to-r from-blue-500 to-blue-600",
    "bg-gradient-to-r from-green-500 to-green-600",
    "bg-gradient-to-r from-purple-500 to-purple-600",
    "bg-gradient-to-r from-red-500 to-red-600",
    "bg-gradient-to-r from-yellow-500 to-yellow-600",
    "bg-gradient-to-r from-pink-500 to-pink-600",
  ];

  useEffect(() => {
    const fetchDiseases = async () => {
      setLoading(true);
      try {
        const response = await axios.get("/api/diseases", {
          params: { search: searchTerm },
        });
        setDiseases(response.data);
      } catch (err) {
        setError(
          "Could not fetch disease information. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    };

    const timerId = setTimeout(() => {
      fetchDiseases();
    }, 300);

    return () => clearTimeout(timerId);
  }, [searchTerm]);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-extrabold text-gray-900">
            Know more about Diseases
          </h1>
          <p className="text-xl text-gray-600 mt-2">
            An encyclopedia of common diseases and conditions.
          </p>
          <div className="mt-8 max-w-2xl mx-auto">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4">
                <Search className="text-gray-400" />
              </span>
              <input
                type="text"
                placeholder="Search for a disease (e.g., 'Hypertension')"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border rounded-full bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none text-gray-900"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <p className="text-center text-lg">Loading...</p>
        ) : error ? (
          <p className="text-center text-lg text-red-500">{error}</p>
        ) : diseases.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {diseases.map((disease, index) => (
              <DiseaseCard
                key={disease.disease_id}
                disease={disease}
                color={themeColors[index % themeColors.length]}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border-2 border-dashed rounded-xl">
            <Stethoscope size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-2xl font-bold text-gray-700">
              No Diseases Found
            </h3>
            <p className="text-gray-500 mt-2">
              Your search for "{searchTerm}" did not match any entries.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiseasesPage;
