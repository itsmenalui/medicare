import React, { createContext, useState, useContext, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    // Load initial state from localStorage, or start with an empty array
    const [cartItems, setCartItems] = useState(() => {
        try {
            const localData = localStorage.getItem('cartItems');
            return localData ? JSON.parse(localData) : [];
        } catch (error) {
            console.error("Could not parse cart data from localStorage", error);
            return [];
        }
    });

    // Save state to localStorage whenever it changes
    useEffect(() => {
        try {
            localStorage.setItem('cartItems', JSON.stringify(cartItems));
        } catch (error) {
            console.error("Could not save cart data to localStorage", error);
        }
    }, [cartItems]);


    const addToCart = (product) => {
        if (!product || typeof product.medication_id === 'undefined') {
            console.error("Attempted to add an invalid product to cart.");
            return;
        }

        setCartItems(prevItems => {
            const existingItem = prevItems.find(item => item.medication_id === product.medication_id);
            
            if (existingItem) {
                const newQuantity = existingItem.quantity + 1;
                if (newQuantity > existingItem.stock_quantity) {
                    alert(`Cannot add more of ${existingItem.name}. Only ${existingItem.stock_quantity} in stock.`);
                    return prevItems;
                }
                return prevItems.map(item =>
                    item.medication_id === product.medication_id
                        ? { ...item, quantity: newQuantity }
                        : item
                );
            }
            
            if (product.stock_quantity > 0) {
                return [...prevItems, { ...product, quantity: 1 }];
            }

            alert(`Sorry, ${product.name} is out of stock.`);
            return prevItems;
        });
    };

    const updateQuantity = (productId, newQuantity) => {
        const quantity = Math.max(0, newQuantity); 

        setCartItems(prevItems => {
            if (quantity === 0) {
                return prevItems.filter(item => item.medication_id !== productId);
            }

            return prevItems.map(item => {
                if (item.medication_id === productId) {
                    const clampedQuantity = Math.min(quantity, item.stock_quantity);
                    if (quantity > item.stock_quantity) {
                        alert(`Only ${item.stock_quantity} of ${item.name} available.`);
                    }
                    return { ...item, quantity: clampedQuantity };
                }
                return item;
            });
        });
    };

    const removeFromCart = (productId) => {
        setCartItems(prevItems => prevItems.filter(item => item.medication_id !== productId));
    };
    
    const clearCart = () => {
        setCartItems([]);
    };

    const value = {
        cartItems,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};