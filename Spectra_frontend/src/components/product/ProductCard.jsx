import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

function ProductCard({ product }) {
  const navigate = useNavigate();
  const [thumbnailUrl, setThumbnailUrl] = useState(
    product.frameMedia && product.frameMedia.length > 0 
      ? product.frameMedia[0].mediaUrl 
      : null
  );

  // --- LOGIC PREORDER MỚI TỪ BACKEND ---
  const preorderInfo = product.preorderInfo || null;
  const isPreorder = preorderInfo !== null;
  const isOutOfStock = product.stockQuantity <= 0 && !isPreorder;

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

  return (
    <div
      style={{
        border: `1px solid ${isPreorder ? "#93c5fd" : isOutOfStock ? "#fecaca" : "#ddd"}`,
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
      {/* Badge trạng thái góc trên */}
      {isPreorder ? (
        <div
          style={{
            position: "absolute", top: "10px", left: "10px", backgroundColor: "#2563eb",
            color: "white", fontSize: "11px", fontWeight: "bold", padding: "3px 8px",
            borderRadius: "20px", letterSpacing: "0.3px", zIndex: 2,
          }}
        >
          Pre-order
        </div>
      ) : isOutOfStock ? (
        <div
          style={{
            position: "absolute", top: "10px", left: "10px", backgroundColor: "#ef4444",
            color: "white", fontSize: "11px", fontWeight: "bold", padding: "3px 8px",
            borderRadius: "20px", letterSpacing: "0.3px", zIndex: 2,
          }}
        >
          Out of Stock
        </div>
      ) : null}

      {/* Ảnh sản phẩm */}
      <div style={{ position: "relative" }}>
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={product.frameName || "Kính"}
            onError={(e) => { e.target.style.display = "none"; }}
            style={{
              width: "100%", height: "150px", objectFit: "contain", marginBottom: "10px",
              opacity: isOutOfStock ? 0.75 : 1, transition: "opacity 0.2s",
            }}
          />
        ) : (
          <div
            style={{
              width: "100%", height: "150px", backgroundColor: "#f9fafb",
              marginBottom: "10px", borderRadius: "8px", display: "flex",
              alignItems: "center", justifyContent: "center", color: "#ccc", fontSize: "12px",
            }}
          >
            Đang tải ảnh...
          </div>
        )}
      </div>

      {/* Giá & Rating */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
        <span style={{ fontSize: "20px", fontWeight: "bold", color: isPreorder ? "#2563eb" : "#000" }}>
          ${isPreorder ? preorderInfo.campaignPrice : (product.basePrice || product.price || 0)}
        </span>
        {/*
        {isPreorder && (
          <span style={{ fontSize: "13px", textDecoration: "line-through", color: "#9ca3af" }}>
             ${product.basePrice || product.price || 0}
          </span>
        )}
        */}
      </div>

      {/* Tên sản phẩm */}
      <p style={{ fontWeight: "500", margin: "5px 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {product.frameName || product.name || "Chưa có tên"}
      </p>

      {/* Thương hiệu & hình dáng */}
      <p style={{ margin: "0 0 6px", fontSize: "12px", color: "#6b7280" }}>
        {product.brand?.brandName || "Đang cập nhật"} {product.shape ? `- ${product.shape?.shapeName || product.shape}` : ""}
      </p>

      {/* Dòng trạng thái tồn kho */}
      {isPreorder ? (
        <div style={{ marginTop: "6px", padding: "5px 10px", backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "6px", fontSize: "11px", color: "#1d4ed8", fontWeight: "bold", textAlign: "center" }}>
          {/* ĐÃ SỬA: estimatedDeliveryDate */}
          Giao: {new Date(preorderInfo.estimatedDeliveryDate).toLocaleDateString("vi-VN")}
        </div>
      ) : isOutOfStock ? (
        <div style={{ marginTop: "6px", padding: "5px 10px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "6px", fontSize: "12px", color: "#dc2626", fontWeight: "bold", textAlign: "center" }}>
          Hết hàng (Out of Stock)
        </div>
      ) : null}
    </div>
  );
}

export default ProductCard;