import React, { useState, useEffect } from "react";
import axios from "../api/axios";
import { useCart } from "../context/CartContext";
import { usePatientAuth } from "../context/PatientAuthContext";
import { useEmployeeAuth } from "../context/EmployeeAuthContext";
import { Beaker, DollarSign, PlusSquare, Upload, FileUp } from "lucide-react";

const CheckupsPage = () => {
  const { isEmployeeAuthenticated, employeeUser } = useEmployeeAuth();

  const isNurse =
    isEmployeeAuthenticated && employeeUser?.employee?.role === "Nurse";

  if (isNurse) {
    return <NurseCheckupsView />;
  } else {
    return <PatientCheckupsView />;
  }
};

// ==================================================================
// --- Nurse-Specific View Component (Redesigned) ---
// ==================================================================
const NurseCheckupsView = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [reportFile, setReportFile] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/checkups/orders");
      setOrders(response.data);
    } catch (err) {
      setError("Could not load pending test orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUploadClick = (order) => {
    setSelectedOrder(order);
    setReportFile(null);
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!reportFile) {
      alert("Please select a PDF file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("reportPdf", reportFile);

    try {
      await axios.post(
        `/api/checkups/orders/${selectedOrder.order_id}/result`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      alert("Report submitted successfully!");
      setSelectedOrder(null);
      fetchOrders();
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Failed to submit report. Please try again.");
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8 text-gray-800">
          Pending Medical Tests
        </h1>
        <div className="bg-white p-6 rounded-2xl shadow-lg">
          {loading && <p className="text-center py-8">Loading...</p>}
          {error && <p className="text-center py-8 text-red-500">{error}</p>}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="p-4 font-semibold text-gray-600">
                    Patient Name
                  </th>
                  <th className="p-4 font-semibold text-gray-600">Test Name</th>
                  <th className="p-4 font-semibold text-gray-600">
                    Order Date
                  </th>
                  <th className="p-4 font-semibold text-gray-600 text-center">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 && !loading && (
                  <tr>
                    <td colSpan="4" className="text-center p-8 text-gray-500">
                      No pending tests found.
                    </td>
                  </tr>
                )}
                {orders.map((order) => (
                  <tr
                    key={order.order_id}
                    className="border-b hover:bg-gray-50 transition-colors"
                  >
                    <td className="p-4 font-semibold text-gray-800">
                      {order.first_name} {order.last_name}
                    </td>
                    <td className="p-4 text-gray-700">{order.test_name}</td>
                    <td className="p-4 text-gray-600">
                      {new Date(order.order_date).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleUploadClick(order)}
                        className="btn btn-sm btn-primary flex items-center gap-2 mx-auto"
                      >
                        <Upload size={16} /> Upload Report
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upload Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
              {/* ✅ FIX: Improved text visibility */}
              <h2 className="text-2xl font-bold mb-4 text-gray-900">
                Upload Report for {selectedOrder.test_name}
              </h2>
              <p className="mb-4 text-gray-600">
                Patient:{" "}
                <span className="font-semibold text-gray-800">
                  {selectedOrder.first_name} {selectedOrder.last_name}
                </span>
              </p>
              <form onSubmit={handleSubmitReport}>
                <label className="block mb-2 font-semibold text-gray-700">
                  Select Report PDF
                </label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center mb-6">
                  <FileUp size={40} className="mx-auto text-gray-400 mb-2" />
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setReportFile(e.target.files[0])}
                    className="text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    required
                  />
                  {reportFile && (
                    <p className="text-sm mt-2 text-gray-500">
                      Selected: {reportFile.name}
                    </p>
                  )}
                </div>
                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(null)}
                    className="btn"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Submit
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ==================================================================
// --- Patient-Facing View Component (Unchanged) ---
// ==================================================================
const PatientCheckupsView = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchTests = async () => {
      setLoading(true);
      try {
        const response = await axios.get("/api/checkups");
        setTests(response.data);
      } catch (err) {
        setError("Could not load medical tests. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchTests();
  }, []);

  const handleAddToCart = (test) => {
    const cartItem = {
      medication_id: `test_${test.test_id}`,
      name: test.name,
      price: test.cost,
      stock_quantity: 999,
      quantity: 1,
    };
    addToCart(cartItem);
    alert(`${test.name} has been added to your cart.`);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-extrabold text-gray-900">
            Medical Tests & Checkups
          </h1>
          <p className="text-xl text-gray-600 mt-2">
            Browse and select from our wide range of diagnostic services.
          </p>
        </div>

        {loading ? (
          <p className="text-center text-lg">Loading available tests...</p>
        ) : error ? (
          <p className="text-center text-red-500 text-lg">{error}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tests.map((test) => (
              <TestCard
                key={test.test_id}
                test={test}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const TestCard = ({ test, onAddToCart }) => {
  const getTestImagePath = (testName) => {
    const name = testName.toLowerCase();
    if (name.includes("electrocardiogram")) return "/images/tests/ecardio.jpg";
    if (name.includes("mri")) return "/images/tests/mri.jpg";
    if (name.includes("complete blood count")) return "/images/tests/cbc.jpg";
    if (name.includes("x-ray")) return "/images/tests/xray.jpg";
    if (name.includes("endoscopy")) return "/images/tests/endoscopy.jpg";
    if (name.includes("biopsy")) return "/images/tests/biopsy.jpg";
    if (name.includes("ct scan")) return "/images/tests/ctscan.jpg";
    return `https://placehold.co/600x400/e2e8f0/4a5568?text=${testName}`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden group transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      <img
        src={getTestImagePath(test.name)}
        alt={test.name}
        className="w-full h-48 object-cover"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = `https://placehold.co/600x400/e2e8f0/4a5568?text=${test.name}`;
        }}
      />
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-800">{test.name}</h3>
        <p className="text-gray-600 mt-2 min-h-[4.5rem]">{test.description}</p>
        <div className="flex justify-between items-center mt-4">
          <p className="text-2xl font-bold text-indigo-600">
            ৳{parseFloat(test.cost).toFixed(2)}
          </p>
          <button
            onClick={() => onAddToCart(test)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <PlusSquare size={18} />
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckupsPage;
