import React, { createContext, useState, useContext } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  const addToCart = (product, quantity, selectedVariant = "Mặc định") => {
    setCartItems((prevItems) => {
    
      const existingItemIndex = prevItems.findIndex(
        (item) => item.id === product.id && item.variant === selectedVariant
      );

      if (existingItemIndex >= 0) {
       
        const newItems = [...prevItems];
        newItems[existingItemIndex] = {
          ...newItems[existingItemIndex],
          quantity: newItems[existingItemIndex].quantity + quantity
        };
        return newItems;
      } else {
    
        return [
          ...prevItems,
          {
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image[0], 
            variant: selectedVariant,
            quantity: quantity,
          },
        ];
      }
    });
     
  };

  const updateQty = (id, newQty) => {
    if (newQty < 1) return;
    setCartItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: newQty } : item))
    );
  };

 
  const removeItem = (id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  return (
    <CartContext.Provider value={{ cartItems, addToCart, updateQty, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};