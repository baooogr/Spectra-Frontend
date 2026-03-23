import React, { createContext, useState, useContext, useEffect } from "react";

const CartContext = createContext();
const CART_STORAGE_KEY = "spectra_cart";

export const useCart = () => useContext(CartContext);

// Generate a unique key for each cart item based on id, color, and lens configuration
const generateCartItemKey = (item) => {
  return `${item.id}-${item.colorId || "default"}-${JSON.stringify(item.lensInfo || {})}`;
};

export const CartProvider = ({ children }) => {
  // Initialize cart from localStorage
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Add unique keys to items if not present
        return parsed.map((item, idx) => ({
          ...item,
          cartKey: item.cartKey || generateCartItemKey(item) + "-" + idx,
        }));
      }
    } catch (e) {
      console.error("Failed to load cart from localStorage:", e);
    }
    return [];
  });

  // Persist cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (e) {
      console.error("Failed to save cart to localStorage:", e);
    }
  }, [cartItems]);

  const addToCart = (product, quantity) => {
    setCartItems((prevItems) => {
      const productKey = generateCartItemKey(product);
      const existingItemIndex = prevItems.findIndex(
        (item) =>
          item.id === product.id &&
          item.colorId === product.colorId &&
          JSON.stringify(item.lensInfo) === JSON.stringify(product.lensInfo),
      );

      if (existingItemIndex >= 0) {
        const newItems = [...prevItems];
        newItems[existingItemIndex].quantity += quantity;
        return newItems;
      } else {
        // Add unique key for new item
        const newItem = {
          ...product,
          cartKey: productKey + "-" + Date.now(),
        };
        return [...prevItems, newItem];
      }
    });

  };

  // Update quantity using unique cart key
  const updateQty = (cartKey, newQty) => {
    if (newQty < 1) return;
    setCartItems((prev) =>
      prev.map((item) =>
        item.cartKey === cartKey ? { ...item, quantity: newQty } : item,
      ),
    );
  };

  // Remove item using unique cart key (fixes bug where same product with different colors got removed)
  const removeItem = (cartKey) => {
    setCartItems((prev) => prev.filter((item) => item.cartKey !== cartKey));
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem(CART_STORAGE_KEY);
  };

  return (
    <CartContext.Provider
      value={{ cartItems, addToCart, updateQty, removeItem, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
};
