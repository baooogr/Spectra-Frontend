import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

// TỐI ƯU HÓA: Biến global để cache API Active Campaigns
// Tránh việc 20 cái Product Card cùng render dẫn tới gọi API 20 lần
let cachedCampaignsPromise = null;
const getActiveCampaigns = () => {
  if (!cachedCampaignsPromise) {
    cachedCampaignsPromise = fetch("https://myspectra.runasp.net/api/PreorderCampaigns/active")
      .then(res => res.ok ? res.json() : [])
      .catch(() => []);
  }
  return cachedCampaignsPromise;
};

function ProductCard({ product }) {
  const navigate = useNavigate();
  const [thumbnailUrl, setThumbnailUrl] = useState(
    product.frameMedia && product.frameMedia.length > 0 
      ? product.frameMedia[0].mediaUrl 
      : null
  );
  
  // --- STATE PREORDER ---
  const [preorderInfo, setPreorderInfo] = useState(null);

  // Xác định trạng thái hết hàng cơ bản
  const isOutOfStock = product.stockQuantity <= 0 || product.status === "OutOfStock" || product.status === "outofstock";

  // Check Pre-order nếu hết hàng
  useEffect(() => {
    if (isOutOfStock) {
      getActiveCampaigns().then(campaigns => {
        for (const camp of campaigns) {
          const frameInCamp = camp.frames?.find(f => f.frameId === (product.id || product.frameId));
          if (frameInCamp) {
            setPreorderInfo({
              campaignPrice: frameInCamp.campaignPrice,
              expectedDeliveryDate: camp.estimatedDeliveryDate
            });
            break; 
          }
        }
      });
    }
  }, [product, isOutOfStock]);

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

  // Cờ chốt cuối cùng
  const isPreorder = isOutOfStock && preorderInfo !== null;

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
            position: "absolute",
            top: "10px",
            left: "10px",
            backgroundColor: "#2563eb", // Xanh dương cho Pre-order
            color: "white",
            fontSize: "11px",
            fontWeight: "bold",
            padding: "3px 8px",
            borderRadius: "20px",
            letterSpacing: "0.3px",
            zIndex: 2,
          }}
        >
          ⏱️ Pre-order
        </div>
      ) : isOutOfStock ? (
        <div
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            backgroundColor: "#ef4444", // Đỏ
            color: "white",
            fontSize: "11px",
            fontWeight: "bold",
            padding: "3px 8px",
            borderRadius: "20px",
            letterSpacing: "0.3px",
            zIndex: 2,
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
              width: "100%",
              height: "150px",
              objectFit: "contain",
              marginBottom: "10px",
              opacity: (isOutOfStock && !isPreorder) ? 0.75 : 1, // Làm mờ nếu out of stock THẬT SỰ
              transition: "opacity 0.2s",
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
        
        {/* Nếu là Pre-order, hiển thị giá gốc bị gạch ngang */}
        {isPreorder && (
          <span style={{ fontSize: "13px", textDecoration: "line-through", color: "#9ca3af" }}>
             ${product.basePrice || product.price || 0}
          </span>
        )}
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
          Giao: {new Date(preorderInfo.expectedDeliveryDate).toLocaleDateString("vi-VN")}
        </div>
      ) : isOutOfStock ? (
        <div style={{ marginTop: "6px", padding: "5px 10px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "6px", fontSize: "12px", color: "#dc2626", fontWeight: "bold", textAlign: "center" }}>
          Hết hàng (Out of Stock)
        </div>
      ) : (
        <div style={{ marginTop: "6px", fontSize: "12px", color: product.stockQuantity <= (product.reorderLevel || 5) ? "#d97706" : "#10b981", fontWeight: "500" }}>
        </div>
      )}
    </div>
  );
}

export default ProductCard;