import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

function ProductCard({ product }) {
  const navigate = useNavigate();
  const [thumbnailUrl, setThumbnailUrl] = useState(
    product.frameMedia?.[0]?.mediaUrl || product.imageUrl || product.image?.[0] || product.mediaUrls?.[0] || null
  );

  useEffect(() => {
    if (thumbnailUrl) return;
    const fetchThumbnail = async () => {
      try {
        const id = product.id || product.frameId;
        if (!id) return;
        const res = await fetch(`https://myspectra.runasp.net/api/FrameMedia/frame/${id}`);
        if (res.ok) {
          const mediaData = await res.json();
          if (mediaData && mediaData.length > 0) {
            setThumbnailUrl(mediaData[0].mediaUrl);
          }
        }
      } catch (error) {
        console.error("Lỗi tải ảnh:", error);
      }
    };
    fetchThumbnail();
  }, [product, thumbnailUrl]);

  // ✅ Xác định trạng thái hàng
  const isOutOfStock =
    product.stockQuantity <= 0 ||
    product.status === "OutOfStock" ||
    product.status === "outofstock";

  return (
    <div
      style={{
        border: `1px solid ${isOutOfStock ? "#bfdbfe" : "#ddd"}`,
        padding: "14px",
        width: "230px",
        borderRadius: "12px",
        cursor: "pointer",
        backgroundColor: "#fff",
        transition: "transform 0.2s, box-shadow 0.2s",
        position: "relative",
      }}
      onClick={() => navigate(`/products/${product.id || product.frameId}`)}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-5px)";
        e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* ✅ Badge trạng thái góc trên */}
      {isOutOfStock && (
        <div
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            backgroundColor: "#2563eb",
            color: "white",
            fontSize: "11px",
            fontWeight: "bold",
            padding: "3px 8px",
            borderRadius: "20px",
            letterSpacing: "0.3px",
            zIndex: 2,
          }}
        >
          Đặt Trước
        </div>
      )}

      {/* Ảnh sản phẩm */}
      <div style={{ position: "relative" }}>
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={product.frameName || "Kính"}
            onError={(e) => { e.target.style.display = "none"; }}
            style={{
              width: "100%",
              height: "150px",
              objectFit: "contain",
              marginBottom: "10px",
              opacity: isOutOfStock ? 0.75 : 1,
              transition: "opacity 0.2s",
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "150px",
              backgroundColor: "#f9fafb",
              marginBottom: "10px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ccc",
              fontSize: "12px",
            }}
          >
            Đang tải ảnh...
          </div>
        )}
      </div>

      {/* Giá & Rating */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "6px",
        }}
      >
        <span style={{ fontSize: "20px", fontWeight: "bold" }}>
          ${product.basePrice || product.price || 0}
        </span>
        <span style={{ fontSize: "18px", fontWeight: "bold", color: "#f59e0b" }}>
          ⭐ 5.0
        </span>
      </div>

      {/* Tên sản phẩm */}
      <p
        style={{
          fontWeight: "500",
          margin: "5px 0",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {product.frameName || product.name || "Chưa có tên"}
      </p>

      {/* Thương hiệu & hình dáng */}
      <p style={{ margin: "0 0 6px", fontSize: "12px", color: "#6b7280" }}>
        {product.brand?.brandName || "Đang cập nhật"} {product.shape ? `- ${product.shape}` : ""}
      </p>

      {/* ✅ Dòng trạng thái tồn kho */}
      {isOutOfStock ? (
        <div
          style={{
            marginTop: "6px",
            padding: "5px 10px",
            backgroundColor: "#eff6ff",
            border: "1px solid #bfdbfe",
            borderRadius: "6px",
            fontSize: "12px",
            color: "#1d4ed8",
            fontWeight: "bold",
            textAlign: "center",
          }}
        >
          Hết hàng · Có thể Đặt Trước
        </div>
      ) : (
        <div
          style={{
            marginTop: "6px",
            fontSize: "12px",
            color: product.stockQuantity <= (product.reorderLevel || 5) ? "#d97706" : "#10b981",
            fontWeight: "500",
          }}
        >
          
        </div>
      )}
    </div>
  );
}

export default ProductCard;