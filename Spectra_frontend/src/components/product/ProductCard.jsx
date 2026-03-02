import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

function ProductCard({ product }) {
  const navigate = useNavigate();
  

  const [thumbnailUrl, setThumbnailUrl] = useState(
    product.imageUrl || product.image?.[0] || product.mediaUrls?.[0] || null
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
        console.error("Lỗi lấy ảnh đại diện", error);
      }
    };

    fetchThumbnail();
  }, [product, thumbnailUrl]);

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
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt={product.frameName || "Kính"}
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
        <div style={{ width: "100%", height: "150px", backgroundColor: "#f9fafb", marginBottom: "10px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "#ccc", fontSize: "12px" }}>
          Đang tải ảnh...
        </div>
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