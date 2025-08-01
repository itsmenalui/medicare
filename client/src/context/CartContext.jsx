import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";
import { usePatientAuth } from "./PatientAuthContext"; // We need this to know who is logged in

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const { user } = usePatientAuth(); // Get the current patient's auth state

  // State for local cart items (pharmacy, tests) from localStorage
  const [cartItems, setCartItems] = useState(() => {
    try {
      const localData = localStorage.getItem("cartItems");
      return localData ? JSON.parse(localData) : [];
    } catch (error) {
      return [];
    }
  });

  // ✨ NEW STATE: To hold the count of bills from the database
  const [dbBillCount, setDbBillCount] = useState(0);

  // Persist local cart items to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
  }, [cartItems]);

  // ✨ NEW EFFECT: Fetch the count of database bills when the user logs in or out
  useEffect(() => {
    const fetchDbBillCount = async () => {
      if (user?.patient?.patient_id) {
        try {
          const response = await axios.get(
            `/api/billing/count/${user.patient.patient_id}`
          );
          setDbBillCount(response.data.count || 0);
        } catch (error) {
          console.error("Failed to fetch DB bill count", error);
          setDbBillCount(0); // Reset on error
        }
      } else {
        // If no user is logged in, there are no database bills to count
        setDbBillCount(0);
      }
    };

    fetchDbBillCount();
  }, [user]); // This effect re-runs whenever the `user` object changes

  // Combine local cart items and DB bills for a total count
  const totalItemCount = cartItems.length + dbBillCount;

  const addToCart = (product) => {
    if (!product || typeof product.medication_id === "undefined") {
      return;
    }
    setCartItems((prevItems) => {
      const existingItem = prevItems.find(
        (item) => item.medication_id === product.medication_id
      );
      if (existingItem) {
        return prevItems.map((item) =>
          item.medication_id === product.medication_id
            ? { ...item, quantity: existingItem.quantity + 1 }
            : item
        );
      }
      return [...prevItems, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId, newQuantity) => {
    const quantity = Math.max(0, newQuantity);
    setCartItems((prevItems) => {
      if (quantity === 0) {
        return prevItems.filter((item) => item.medication_id !== productId);
      }
      return prevItems.map((item) =>
        item.medication_id === productId ? { ...item, quantity } : item
      );
    });
  };

  const removeFromCart = (productId) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.medication_id !== productId)
    );
  };

  const clearCart = () => {
    setCartItems([]);
    // After payment, we also reset the DB bill count until the next fetch
    setDbBillCount(0);
  };

  const value = {
    cartItems,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    totalItemCount, // ✨ Expose the new combined total
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
