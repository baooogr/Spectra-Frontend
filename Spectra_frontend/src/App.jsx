import React from "react";
import AppRouter from "./routes/AppRouter";
import { CartProvider } from "./context/CartContext";
import { OrderProvider } from "./context/OrderContext"; 
import { UserProvider } from "./context/UserContext"; 

function App() {
  return (
    <UserProvider>  
      <OrderProvider>
        <CartProvider>
          <AppRouter />
        </CartProvider>
      </OrderProvider>
    </UserProvider>
  );
}

export default App;