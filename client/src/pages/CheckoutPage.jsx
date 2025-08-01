import React, { useState, useEffect, useMemo } from "react";
import { useCart } from "../context/CartContext";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Trash2,
  User,
  MapPin,
  ShoppingCart,
  CreditCard,
  Pill,
  BedDouble,
  Stethoscope,
  Beaker,
  AlertCircle,
} from "lucide-react";
import { usePatientAuth as useAuth } from "../context/PatientAuthContext";

// A reusable component for each section of the bill
const BillSection = ({ title, icon, count, children }) => {
  if (count === 0) return null; // Don't render empty sections
  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
      <h2 className="text-2xl font-bold border-b border-gray-200 pb-4 mb-4 text-gray-800 flex items-center">
        {icon} {title} ({count} {count === 1 ? "item" : "items"})
      </h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
};

const CheckoutPage = () => {
  // --- STATE AND HOOKS ---
  const { cartItems, updateQuantity, removeFromCart, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dbBills, setDbBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");

  // --- DATA FETCHING ---
  useEffect(() => {
    if (user?.patient?.patient_id) {
      setDeliveryAddress(user.patient.address || "");
      const fetchAllBills = async () => {
        setLoading(true);
        try {
          const response = await axios.get(
            `/api/billing/${user.patient.patient_id}`
          );
          setDbBills(response.data);
        } catch (err) {
          setError("Could not fetch your outstanding bills.");
        } finally {
          setLoading(false);
        }
      };
      fetchAllBills();
    } else {
      setLoading(false);
    }
  }, [user]);

  // --- DATA PROCESSING AND CATEGORIZATION ---
  // Categorize items from the local cart (pharmacy vs. tests)
  const { pharmacyItems, localTestItems } = useMemo(() => {
    const pharmacy = [];
    const tests = [];
    // Keywords to identify a test item from the cart
    const testKeywords = [
      "scan",
      "x-ray",
      "mri",
      "test",
      "blood count",
      "ecg",
      "ultrasound",
      "cbc",
    ];

    cartItems.forEach((item) => {
      const name = item.name.toLowerCase();
      if (testKeywords.some((keyword) => name.includes(keyword))) {
        tests.push(item);
      } else {
        pharmacy.push(item);
      }
    });
    return { pharmacyItems: pharmacy, localTestItems: tests };
  }, [cartItems]);

  // Categorize bills from the database
  const { roomBills, doctorBills, dbTestBills } = useMemo(() => {
    const categorized = { roomBills: [], doctorBills: [], dbTestBills: [] };
    dbBills.forEach((bill) => {
      const desc = bill.description.toLowerCase();
      if (desc.includes("room")) categorized.roomBills.push(bill);
      else if (desc.includes("consultation"))
        categorized.doctorBills.push(bill);
      else if (desc.includes("test")) categorized.dbTestBills.push(bill);
    });
    return categorized;
  }, [dbBills]);

  // --- CALCULATIONS ---
  const pharmacySubtotal = pharmacyItems.reduce(
    (sum, item) => sum + parseFloat(item.price) * item.quantity,
    0
  );
  const pharmacyTax = pharmacySubtotal * 0.05;
  const pharmacyTotal = pharmacySubtotal + pharmacyTax;

  const localTestTotal = localTestItems.reduce(
    (sum, item) => sum + parseFloat(item.price) * item.quantity,
    0
  );

  const calculateDbBillTotal = (bills) =>
    bills.reduce((sum, bill) => sum + parseFloat(bill.total_amount), 0);
  const roomTotal = calculateDbBillTotal(roomBills);
  const doctorTotal = calculateDbBillTotal(doctorBills);
  const dbTestTotal = calculateDbBillTotal(dbTestBills);

  const grandTotal =
    pharmacyTotal + localTestTotal + roomTotal + doctorTotal + dbTestTotal;

  // --- HANDLERS ---
  const handleCheckout = async (e) => {
    e.preventDefault();
    if (pharmacyItems.length > 0 && !deliveryAddress) {
      setError("Please provide a delivery address for your pharmacy order.");
      return;
    }
    if (!user?.patient?.patient_id) {
      setError("Could not identify patient. Please log in again.");
      return;
    }

    setIsProcessing(true);
    setError("");
    try {
      if (cartItems.length > 0) {
        await axios.post("/api/pharmacy/checkout", {
          cartItems,
          patient_id: user.patient.patient_id,
          delivery_address: deliveryAddress,
        });
        clearCart();
      }
      await axios.post("/api/billing/pay", {
        patient_id: user.patient.patient_id,
      });
      alert("Payment Successful! All outstanding bills have been paid.");
      navigate("/portal");
    } catch (err) {
      const errorMessage =
        err.response?.data?.error || "An unexpected server error occurred.";
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- RENDER LOGIC ---
  if (loading) {
    return (
      <div className="text-center py-20 font-semibold text-lg text-gray-600">
        Loading Your Bills...
      </div>
    );
  }

  if (cartItems.length === 0 && dbBills.length === 0) {
    return (
      <div className="text-center container mx-auto py-20">
        <ShoppingCart size={64} className="mx-auto text-gray-400 mb-4" />
        <h1 className="text-3xl font-bold mb-4 text-gray-800">
          Your Cart is Empty
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          You have no items in your pharmacy cart and no outstanding hospital
          bills.
        </p>
        <Link
          to="/pharmacy"
          className="text-lg text-indigo-600 font-semibold hover:underline"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight">
            Review & Pay
          </h1>
          <p className="text-xl text-gray-600 mt-3">
            Final step to pay for your services and medications.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column: Bills Breakdown */}
          <div className="lg:col-span-2 space-y-6">
            <BillSection
              title="Pharmacy Cart"
              icon={<Pill className="mr-3 text-green-500" />}
              count={pharmacyItems.length}
            >
              {pharmacyItems.map((item) => (
                <div
                  key={item.medication_id}
                  className="flex items-center justify-between border-b border-gray-100 py-4"
                >
                  <div className="flex items-center gap-4 flex-grow">
                    <img
                      src={`https://placehold.co/80x80/EBF8FF/3182CE?text=${item.name.charAt(
                        0
                      )}`}
                      alt={item.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div>
                      <h3 className="font-bold text-gray-800">{item.name}</h3>
                      <p className="text-sm text-gray-500">
                        ৳{parseFloat(item.price).toFixed(2)} each
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mx-4">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        updateQuantity(
                          item.medication_id,
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-16 text-center border rounded-lg p-1 focus:ring-2 focus:ring-indigo-500"
                      min="1"
                      max={item.stock_quantity || 1}
                    />
                    <button
                      onClick={() => removeFromCart(item.medication_id)}
                      className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                  <p className="font-semibold w-24 text-right text-gray-800">
                    ৳{(parseFloat(item.price) * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </BillSection>

            <BillSection
              title="Medical Tests"
              icon={<Beaker className="mr-3 text-cyan-500" />}
              count={localTestItems.length + dbTestBills.length}
            >
              {localTestItems.map((item) => (
                <div
                  key={item.medication_id}
                  className="flex items-center justify-between border-b border-gray-100 py-4"
                >
                  <div className="flex items-center gap-4 flex-grow">
                    <div>
                      <h3 className="font-bold text-gray-800">{item.name}</h3>
                      <p className="text-sm text-gray-500">
                        ৳{parseFloat(item.price).toFixed(2)} each
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mx-4">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        updateQuantity(
                          item.medication_id,
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-16 text-center border rounded-lg p-1 focus:ring-2 focus:ring-indigo-500"
                      min="1"
                      max={item.stock_quantity || 1}
                    />
                    <button
                      onClick={() => removeFromCart(item.medication_id)}
                      className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                  <p className="font-semibold w-24 text-right text-gray-800">
                    ৳{(parseFloat(item.price) * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
              {dbTestBills.map((bill) => (
                <div
                  key={bill.bill_id}
                  className="flex items-center justify-between border-b border-gray-100 py-3"
                >
                  <div>
                    <p className="font-semibold text-gray-700">
                      {bill.description}
                    </p>
                    <p className="text-sm text-gray-500">
                      Billed on: {new Date(bill.bill_date).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="font-bold text-lg text-gray-800">
                    ৳{parseFloat(bill.total_amount).toFixed(2)}
                  </p>
                </div>
              ))}
            </BillSection>

            <BillSection
              title="Doctor Consultations"
              icon={<Stethoscope className="mr-3 text-blue-500" />}
              count={doctorBills.length}
            >
              {doctorBills.map((bill) => (
                <div
                  key={bill.bill_id}
                  className="flex items-center justify-between border-b border-gray-100 py-3"
                >
                  <div>
                    <p className="font-semibold text-gray-700">
                      {bill.description}
                    </p>
                    <p className="text-sm text-gray-500">
                      Billed on: {new Date(bill.bill_date).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="font-bold text-lg text-gray-800">
                    ৳{parseFloat(bill.total_amount).toFixed(2)}
                  </p>
                </div>
              ))}
            </BillSection>

            <BillSection
              title="Room Charges"
              icon={<BedDouble className="mr-3 text-purple-500" />}
              count={roomBills.length}
            >
              {roomBills.map((bill) => (
                <div
                  key={bill.bill_id}
                  className="flex items-center justify-between border-b border-gray-100 py-3"
                >
                  <div>
                    <p className="font-semibold text-gray-700">
                      {bill.description}
                    </p>
                    <p className="text-sm text-gray-500">
                      Billed on: {new Date(bill.bill_date).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="font-bold text-lg text-gray-800">
                    ৳{parseFloat(bill.total_amount).toFixed(2)}
                  </p>
                </div>
              ))}
            </BillSection>
          </div>

          {/* Right Column: Summary & Payment */}
          <div className="lg:col-span-1 lg:sticky top-8">
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
              <h2 className="text-2xl font-bold border-b border-gray-200 pb-4 mb-4 text-gray-800">
                Summary
              </h2>
              <div className="space-y-3 text-gray-600 mb-4">
                {pharmacySubtotal > 0 && (
                  <div className="flex justify-between">
                    <p>Pharmacy Subtotal:</p>
                    <p className="font-medium text-gray-800">
                      ৳{pharmacySubtotal.toFixed(2)}
                    </p>
                  </div>
                )}
                {pharmacyTax > 0 && (
                  <div className="flex justify-between">
                    <p>Tax (5%):</p>
                    <p className="font-medium text-gray-800">
                      ৳{pharmacyTax.toFixed(2)}
                    </p>
                  </div>
                )}
                {localTestTotal > 0 && (
                  <div className="flex justify-between">
                    <p>Test Fees:</p>
                    <p className="font-medium text-gray-800">
                      ৳{localTestTotal.toFixed(2)}
                    </p>
                  </div>
                )}
                {doctorTotal > 0 && (
                  <div className="flex justify-between">
                    <p>Doctor Fees:</p>
                    <p className="font-medium text-gray-800">
                      ৳{doctorTotal.toFixed(2)}
                    </p>
                  </div>
                )}
                {roomTotal > 0 && (
                  <div className="flex justify-between">
                    <p>Room Charges:</p>
                    <p className="font-medium text-gray-800">
                      ৳{roomTotal.toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex justify-between font-bold text-3xl border-t-2 border-gray-200 mt-4 pt-4 text-gray-900">
                <p>Total Due:</p>
                <p>৳{grandTotal.toFixed(2)}</p>
              </div>
              <form onSubmit={handleCheckout} className="mt-8">
                {pharmacyItems.length > 0 && (
                  <>
                    <h3 className="text-lg font-bold mb-3 text-gray-800">
                      Delivery Information
                    </h3>
                    <div className="relative mb-4 bg-gray-100 p-3 rounded-lg border">
                      <User
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        size={20}
                      />
                      <span className="w-full pl-8 text-gray-700 font-semibold">
                        {user?.patient?.first_name} {user?.patient?.last_name}
                      </span>
                    </div>
                    <div className="relative mb-6">
                      <MapPin
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        size={20}
                      />
                      <input
                        type="text"
                        name="address"
                        placeholder="Delivery Address"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                  </>
                )}
                <button
                  type="submit"
                  disabled={isProcessing || grandTotal === 0}
                  className="w-full bg-indigo-600 text-white font-bold py-4 rounded-lg hover:bg-indigo-700 transition-transform hover:scale-105 disabled:bg-gray-400 disabled:hover:scale-100 text-lg flex items-center justify-center"
                >
                  <CreditCard className="mr-2" size={20} />
                  {isProcessing
                    ? "Processing..."
                    : `Pay ৳${grandTotal.toFixed(2)}`}
                </button>
                {error && (
                  <p className="text-red-600 text-sm mt-4 text-center flex items-center justify-center">
                    <AlertCircle size={16} className="mr-2" />
                    {error}
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
