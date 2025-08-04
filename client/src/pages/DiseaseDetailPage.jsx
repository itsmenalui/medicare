import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "../api/axios";
import { ArrowLeft, PlusCircle, Shield, AlertTriangle } from "lucide-react";

// A reusable component for displaying lists of details
const DetailSection = ({ title, data, icon }) => {
  if (!data) return null;
  // Split the text block into a list of items
  const items = data.split("\n").filter((item) => item.trim() !== "");

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
        {icon}
        <span className="ml-3">{title}</span>
      </h2>
      <ul className="space-y-2 list-disc list-inside text-gray-700">
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
};

const DiseaseDetailPage = () => {
  const { id } = useParams();
  const [disease, setDisease] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDisease = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/diseases/${id}`);
        setDisease(response.data);
      } catch (err) {
        setError("Could not load disease details.");
      } finally {
        setLoading(false);
      }
    };
    fetchDisease();
  }, [id]);

  if (loading) {
    return <div className="text-center py-20">Loading...</div>;
  }

  if (error) {
    return <div className="text-center py-20 text-red-500">{error}</div>;
  }

  if (!disease) {
    return <div className="text-center py-20">Disease not found.</div>;
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto px-4 py-12">
        {/* Back Button */}
        <Link
          to="/diseases"
          className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-8 font-semibold"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to All Diseases
        </Link>

        {/* Header Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-1">
            <img
              src={
                disease.image_url ||
                "https://placehold.co/600x400/E2E8F0/4A5568?text=Image"
              }
              alt={disease.name}
              className="w-full h-auto object-cover rounded-lg shadow-xl"
            />
          </div>
          <div className="lg:col-span-2 bg-white p-8 rounded-lg shadow-xl flex flex-col justify-center">
            <h1 className="text-5xl font-extrabold text-gray-900">
              {disease.name}
            </h1>
            <p className="text-lg text-gray-700 mt-4">{disease.description}</p>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <DetailSection
            title="Common Causes"
            data={disease.causes}
            icon={<AlertTriangle className="text-red-500" />}
          />
          <DetailSection
            title="Preventions"
            data={disease.preventions}
            icon={<Shield className="text-blue-500" />}
          />
          <div className="md:col-span-2">
            <DetailSection
              title="Treatments & Management"
              data={disease.treatments}
              icon={<PlusCircle className="text-green-500" />}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiseaseDetailPage;
