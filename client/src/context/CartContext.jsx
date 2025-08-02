<<<<<<< HEAD
import React, { createContext, useState, useContext, useEffect, useCallback } from "react";
import axios from "axios";
import { usePatientAuth } from "./PatientAuthContext";
=======
import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";
import { usePatientAuth } from "./PatientAuthContext"; // We need this to know who is logged in
>>>>>>> 0016227f2920aba7b94106773f8b559c31a0f683

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
<<<<<<< HEAD
  const { user } = usePatientAuth();

=======
  const { user } = usePatientAuth(); // Get the current patient's auth state

  // State for local cart items (pharmacy, tests) from localStorage
>>>>>>> 0016227f2920aba7b94106773f8b559c31a0f683
  const [cartItems, setCartItems] = useState(() => {
    try {
      const localData = localStorage.getItem("cartItems");
      return localData ? JSON.parse(localData) : [];
    } catch (error) {
      return [];
    }
  });

<<<<<<< HEAD
  const [dbBillCount, setDbBillCount] = useState(0);

=======
  // ✨ NEW STATE: To hold the count of bills from the database
  const [dbBillCount, setDbBillCount] = useState(0);

  // Persist local cart items to localStorage whenever they change
>>>>>>> 0016227f2920aba7b94106773f8b559c31a0f683
  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
  }, [cartItems]);

<<<<<<< HEAD
  // ✅ FIX: Extracted the fetching logic into a reusable function
  const refreshDbBillCount = useCallback(async () => {
    if (user?.patient?.patient_id) {
      try {
        const response = await axios.get(
          `/api/billing/count/${user.patient.patient_id}`
        );
        setDbBillCount(response.data.count || 0);
      } catch (error) {
        console.error("Failed to fetch DB bill count", error);
        setDbBillCount(0);
      }
    } else {
      setDbBillCount(0);
    }
  }, [user]); // Dependency on user ensures it's up-to-date

  // This effect now calls the reusable function on user change
  useEffect(() => {
    refreshDbBillCount();
  }, [refreshDbBillCount]);

=======
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
>>>>>>> 0016227f2920aba7b94106773f8b559c31a0f683
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
<<<<<<< HEAD
=======
    // After payment, we also reset the DB bill count until the next fetch
>>>>>>> 0016227f2920aba7b94106773f8b559c31a0f683
    setDbBillCount(0);
  };

  const value = {
    cartItems,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
<<<<<<< HEAD
    totalItemCount,
    refreshDbBillCount, // ✅ FIX: Expose the new function to the rest of the app
=======
    totalItemCount, // ✨ Expose the new combined total
>>>>>>> 0016227f2920aba7b94106773f8b559c31a0f683
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};