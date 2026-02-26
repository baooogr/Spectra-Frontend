// <<<<<<< HEAD
// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
// import './App.css'

// function App() {
//   const [count, setCount] = useState(0)

//   return (
//     <>
    
//     </>
//   )
// }

// export default App
// =======
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import ProductCard from "./components/product/ProductCard";
import ProductDetail from "./components/product/ProductDetail";
import productList from "./components/product/data/ProductList";
import OrderHistory from "./components/product/OrderHistory";
import OrderDetail from "./components/product/OrderDetail";

function App() {
  return (
    <BrowserRouter>
      <div className="container">
        <Routes>
          <Route
            path="/"
            element={
              <div className="product-list">
                {productList.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            }
          />

          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/orders" element={<OrderHistory />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
// >>>>>>> anhncnse192324
