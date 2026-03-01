import { useNavigate } from "react-router-dom";

function ProductCard({ product }) {
  const navigate = useNavigate();
  
  // Lấy link ảnh thật từ dữ liệu API, loại bỏ hoàn toàn fallbackImage
  const displayImage = product.imageUrl || product.image?.[0] || product.mediaUrls?.[0];

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
      {/* NẾU CÓ ẢNH THÌ HIỂN THỊ THẺ IMG, KHÔNG THÌ HIỆN KHUNG TRỐNG ĐỂ GIỮ BỐ CỤC */}
      {displayImage ? (
        <img
          src={displayImage}
          alt={product.frameName || "Kính"}
          // Nếu link ảnh có tồn tại nhưng bị chết (lỗi 404), tự động ẩn luôn thẻ img đi
          onError={(e) => {
            e.target.style.display = 'none';
          }}
          style={{
            width: "100%",
            height: "150px",
            objectFit: "contain",
            marginBottom: "10px"
          }}
        />
      ) : (
        // Khung trống giữ form cho thẻ kính không bị lùn xuống
        <div style={{ width: "100%", height: "150px", backgroundColor: "#f9fafb", marginBottom: "10px", borderRadius: "8px" }} />
      )}

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