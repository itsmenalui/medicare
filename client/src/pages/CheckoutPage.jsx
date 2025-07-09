import React, { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Trash2, User, MapPin, ShoppingCart as CartIcon } from "lucide-react";
import { usePatientAuth as useAuth } from "../context/PatientAuthContext";
const CheckoutPage = () => {
  const { cartItems, updateQuantity, removeFromCart, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");

  useEffect(() => {
    if (user?.patient?.address) {
      // Use optional chaining here
      setDeliveryAddress(user.patient.address);
    }
  }, [user]);

  const subtotal = Array.isArray(cartItems)
    ? cartItems.reduce((sum, item) => {
        const price = item && item.price ? parseFloat(item.price) : 0;
        const quantity = item && item.quantity ? parseInt(item.quantity) : 0;
        return sum + price * quantity;
      }, 0)
    : 0;

  const tax = subtotal * 0.05;
  const total = subtotal + tax;

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!deliveryAddress) {
      setError("Please provide a delivery address.");
      return;
    }
    setIsProcessing(true);
    setError("");
    try {
      await axios.post("/api/checkout", { cartItems });
      alert("Payment Successful! Your order has been placed.");
      clearCart();
      navigate("/pharmacy");
    } catch (err) {
      setError(
        "Checkout failed. Some items may be out of stock or there was a server error. Please review your cart."
      );
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return (
      <div className="text-center container mx-auto py-20">
        <CartIcon size={64} className="mx-auto text-gray-400 mb-4" />
        <h1 className="text-3xl font-bold mb-4 text-gray-800">
          Your Cart is Empty
        </h1>
        <Link
          to="/pharmacy"
          className="text-lg text-blue-600 font-semibold hover:underline"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-extrabold text-gray-900">
            Review Your Order
          </h1>
          <p className="text-xl text-gray-600 mt-2">
            Final step to get your medications delivered.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items List */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-lg">
            <h2 className="text-2xl font-bold border-b pb-4 mb-4 text-gray-800">
              Your Cart ({cartItems.length} items)
            </h2>
            <div className="space-y-4">
              {cartItems.map((item) => {
                if (!item || typeof item.medication_id === "undefined") {
                  return null;
                }
                const itemPrice = parseFloat(item.price) || 0;
                const itemQuantity = parseInt(item.quantity) || 0;
                const itemTotal = itemPrice * itemQuantity;

                return (
                  <div
                    key={item.medication_id}
                    className="flex items-center justify-between border-b py-4"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={`https://placehold.co/80x80/E2E8F0/4A5568?text=${item.name.charAt(
                          0
                        )}`}
                        alt={item.name}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                      <div>
                        <h3 className="font-bold text-gray-800">
                          {item.name || "Unknown Item"}
                        </h3>
                        <p className="text-sm text-gray-500">
                          ৳{itemPrice.toFixed(2)} each
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* UPDATED: Changed to dark background with white text */}
                      <input
                        type="number"
                        value={itemQuantity}
                        onChange={(e) =>
                          updateQuantity(
                            item.medication_id,
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="w-16 text-center border rounded-lg p-1 bg-gray-700 text-white"
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
                      ৳{itemTotal.toFixed(2)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
          {/* Order Summary & Payment */}
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-lg h-fit">
            <h2 className="text-2xl font-bold border-b pb-4 mb-4 text-gray-800">
              Order Summary
            </h2>
            <div className="space-y-2 text-gray-600">
              <div className="flex justify-between">
                <p>Subtotal:</p>{" "}
                <p className="font-medium text-gray-800">
                  ৳{subtotal.toFixed(2)}
                </p>
              </div>
              <div className="flex justify-between">
                <p>Tax (5%):</p>{" "}
                <p className="font-medium text-gray-800">৳{tax.toFixed(2)}</p>
              </div>
            </div>
            <div className="flex justify-between font-bold text-2xl border-t mt-4 pt-4 text-gray-900">
              <p>Total:</p> <p>৳{total.toFixed(2)}</p>
            </div>

            <form onSubmit={handleCheckout} className="mt-8">
              <h3 className="text-xl font-bold mb-4 text-gray-800">
                Delivery Information
              </h3>
              <div className="relative mb-4 bg-gray-100 p-3 rounded-lg">
                <User
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <span className="w-full pl-8 text-gray-700">
                  {user?.patient?.first_name} {user?.patient?.last_name}
                </span>
              </div>
              <div className="relative mb-6">
                <MapPin
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                {/* UPDATED: Changed to dark background with white text */}
                <input
                  type="text"
                  name="address"
                  placeholder="Delivery Address"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full p-2 pl-10 border border-gray-600 rounded-lg text-white bg-gray-700 placeholder:text-gray-400"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isProcessing || total === 0}
                className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 text-lg"
              >
                {isProcessing
                  ? "Processing..."
                  : `Confirm & Pay ৳${total.toFixed(2)}`}
              </button>
              {error && (
                <p className="text-red-500 text-sm mt-3 text-center">{error}</p>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
