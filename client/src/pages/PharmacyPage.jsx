import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { Search, Pill, Package, Check } from "lucide-react";

const MedicationCard = ({ med }) => {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const isOutOfStock = med.stock_quantity === 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart(med);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col justify-between transform hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border">
      <div>
        <img
          src={`https://placehold.co/400x300/E2E8F0/4A5568?text=${med.name.replace(
            /\s/g,
            "+"
          )}`}
          alt={med.name}
          className="w-full h-48 object-cover"
        />
        <div className="p-4">
          <h3
            className="text-lg font-bold text-gray-800 truncate"
            title={med.name}
          >
            {med.name}
          </h3>
          <p className="text-sm text-gray-500 capitalize">
            {med.type || "Medication"}
          </p>
          <p
            className={`text-sm font-semibold mt-1 ${
              isOutOfStock ? "text-red-500" : "text-green-600"
            }`}
          >
            {isOutOfStock ? "Out of Stock" : `In Stock: ${med.stock_quantity}`}
          </p>
          <p className="text-2xl font-bold text-indigo-600 my-2">
            ৳{parseFloat(med.price).toFixed(2)}
          </p>
        </div>
      </div>
      <div className="p-4 pt-0 grid grid-cols-2 gap-3">
        <Link
          to={`/medication/${med.medication_id}`}
          className="btn btn-ghost btn-sm"
        >
          See Details
        </Link>
        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock || added}
          className={`btn btn-sm text-white ${
            isOutOfStock
              ? "btn-disabled"
              : added
              ? "btn-success"
              : "btn-primary"
          }`}
        >
          {isOutOfStock ? (
            "Out of Stock"
          ) : added ? (
            <Check size={18} />
          ) : (
            "Add to Cart"
          )}
        </button>
      </div>
    </div>
  );
};

const PharmacyPage = () => {
  const [medications, setMedications] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchMeds = async (
    currentPage,
    currentSearchTerm,
    shouldRefresh = false
  ) => {
    setLoading(true);
    setError("");
    try {
      // **FIXED URL HERE**
      const response = await axios.get("/api/pharmacy/medications", {
        params: {
          page: currentPage,
          limit: 20,
          search: currentSearchTerm,
        },
      });
      const { medications: newMeds, totalCount } = response.data;
      setMedications((prevMeds) =>
        shouldRefresh ? newMeds : [...prevMeds, ...newMeds]
      );
      setHasMore(currentPage * 20 < totalCount);
    } catch (err) {
      setError("Could not fetch medications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timerId = setTimeout(() => {
      setMedications([]);
      setPage(1);
      fetchMeds(1, searchTerm, true);
    }, 500);
    return () => clearTimeout(timerId);
  }, [searchTerm]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchMeds(nextPage, searchTerm, false);
  };

  return (
    <div className="bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-extrabold text-gray-900">
            Our Pharmacy
          </h1>
          <p className="text-xl text-gray-600 mt-2">
            Browse and purchase from our wide range of medications.
          </p>
          <div className="mt-8 max-w-2xl mx-auto">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4">
                <Search className="text-gray-400" />
              </span>
              <input
                type="text"
                placeholder="Search for medications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border rounded-full bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none text-gray-900"
              />
            </div>
          </div>
        </div>
        {error && <p className="text-center py-10 text-red-500">{error}</p>}
        {medications.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {medications.map((med) => (
              <MedicationCard
                key={`${med.medication_id}-${med.name}`}
                med={med}
              />
            ))}
          </div>
        )}
        {!loading && medications.length === 0 && !error && (
          <div className="text-center py-16 border-2 border-dashed rounded-xl">
            <Pill size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-2xl font-bold text-gray-700">
              No Medications Found
            </h3>
            <p className="text-gray-500 mt-2">
              Your search for "{searchTerm}" did not return any results.
            </p>
          </div>
        )}
        {loading && <p className="text-center py-10">Loading Medications...</p>}
        {!loading && hasMore && (
          <div className="text-center mt-12">
            <button onClick={loadMore} className="btn btn-primary btn-lg">
              Load More
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PharmacyPage;
