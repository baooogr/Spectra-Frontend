
import { useNavigate } from "react-router-dom";

function ProductCard({ product }) {
  const navigate = useNavigate();

  return (
    <div
      style={{
        border: "1px solid #ddd",
        padding: "14px",
        width: "230px",
        borderRadius: "12px",
        cursor: "pointer",
        backgroundColor: "#fff"
      }}
      onClick={() => navigate(`/products/${product.id}`)}
    >

      <img
        src={product.image}
        alt={product.name}
        style={{
          width: "100%",
          height: "150px",
          objectFit: "contain",
          marginBottom: "10px"
        }}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "6px"
        }}
      >
        <span style={{ fontSize: "20px", fontWeight: "bold" }}>
          ${product.price}
        </span>

        <span style={{ fontSize: "18px", fontWeight: "bold" }}>
          ⭐ {product.rating}
        </span>
      </div>

      <p style={{ fontWeight: "500" }}>{product.name}</p>
    </div>
  );
}

export default ProductCard;
