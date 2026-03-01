import { useNavigate } from "react-router-dom";

function ProductCard({ product }) {
  const navigate = useNavigate();

  // Link ảnh dự phòng khi lỗi
  const fallbackImage = "https://via.placeholder.com/230x150?text=Chua+Co+Anh";
  
  // Lấy link ảnh từ BE (tùy BE thiết kế biến là gì, mình rào sẵn các trường hợp)
  const initialImage = product.imageUrl || product.image?.[0] || product.mediaUrls?.[0] || fallbackImage;

  return (
    <div
      style={{
        border: "1px solid #ddd",
        padding: "14px",
        width: "230px",
        borderRadius: "12px",
        cursor: "pointer",
        backgroundColor: "#fff",
        transition: "transform 0.2s"
      }}
      onClick={() => navigate(`/products/${product.id || product.frameId}`)}
      onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-5px)"}
      onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
    >
      <img
        src={initialImage}
        alt={product.frameName || "Kính"}
        // ĐÂY LÀ PHÉP MÀU: Bắt lỗi nếu URL ảnh bị hỏng thì tự động thay bằng ảnh dự phòng
        onError={(e) => {
          e.target.onerror = null; 
          e.target.src = fallbackImage; 
        }}
        style={{
          width: "100%",
          height: "150px",
          objectFit: "contain",
          marginBottom: "10px"
        }}
      />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
        <span style={{ fontSize: "20px", fontWeight: "bold" }}>
          ${product.basePrice || product.price || 0}
        </span>
        <span style={{ fontSize: "18px", fontWeight: "bold", color: "#f59e0b" }}>
          ⭐ 5.0
        </span>
      </div>

      <p style={{ fontWeight: "500", margin: "5px 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {product.frameName || product.name || "Chưa có tên"}
      </p>
      
      <p style={{ margin: 0, fontSize: "12px", color: "#6b7280" }}>
        {product.brand} - {product.shape}
      </p>
    </div>
  );
}

export default ProductCard;