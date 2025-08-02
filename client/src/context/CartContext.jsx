import React, { createContext, useState, useContext, useEffect, useCallback } from "react";
import axios from "axios";
import { usePatientAuth } from "./PatientAuthContext";

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const { user } = usePatientAuth();

  const [cartItems, setCartItems] = useState(() => {
    try {
      const localData = localStorage.getItem("cartItems");
      return localData ? JSON.parse(localData) : [];
    } catch (error) {
      return [];
    }
  });

  const [dbBillCount, setDbBillCount] = useState(0);

  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
  }, [cartItems]);

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
    setDbBillCount(0);
  };

  const value = {
    cartItems,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    totalItemCount,
    refreshDbBillCount, // ✅ FIX: Expose the new function to the rest of the app
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};