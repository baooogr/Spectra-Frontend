import { useState } from "react";
import { useParams } from "react-router-dom";

import ImageGallery from "./ImageGallery";
import productList from "./data/ProductList";

export default function ProductDetail() {
  const { id } = useParams();
  const product = productList.find((p) => p.id === id);

  const [quantity, setQuantity] = useState(1);

  return (
    <>
      <div
        style={{
          maxWidth: 1100,
          margin: "40px auto",
          display: "flex",
          gap: 60,
        }}
      >
        <ImageGallery images={product.image} />

        <div style={{ flex: 1 }}>
          <h2 style={{ marginBottom: 6 }}>
            {product.name}
          </h2>


          <p style={{ margin: "10px 0 4px", color: "#666" }}>
            Starting at
          </p>

          <p
            style={{
              fontSize: 36,
              fontWeight: "bold",
              margin: "0 0 16px",
            }}
          >
            ${product.price}
          </p>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              backgroundColor: "#FFF3CD",
              padding: "6px 12px",
              borderRadius: 20,
              fontSize: 14,
              marginBottom: 24,
            }}
          >
            ⭐ {product.rating}
            <span style={{ fontWeight: 500 }}>
              {product.review} reviews
            </span>
          </div>

          <div style={{ margin: "20px 0" }}>
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>
              -
            </button>
            <span style={{ margin: "0 12px" }}>{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)}>+</button>
          </div>

          <button
            style={{
              padding: "10px 18px",
              border: "1px solid #333",
              background: "white",
              cursor: "pointer",
            }}
          >
            Thêm vào giỏ hàng
          </button>
        </div>
      </div>
    </>
  );
}
