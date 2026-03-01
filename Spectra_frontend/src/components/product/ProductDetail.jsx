import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import ImageGallery from "./ImageGallery";
import Section from "./Section";
import Tabs from "./Tabs";
import TabButton from "./TabButton";
import Modal from "../ui/Modal";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  
  const [product, setProduct] = useState(null);
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [quantity, setQuantity] = useState(1);
  const [selectedTab, setSelectedTab] = useState("description");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchProductDetails = async () => {
      setIsLoading(true);
      setError("");
      try {
        
        const frameRes = await fetch(`https://myspectra.runasp.net/api/Frames/${id}`);
        if (!frameRes.ok) throw new Error("Không tìm thấy sản phẩm này trên hệ thống.");
        const frameData = await frameRes.json();
        setProduct(frameData);

       
        const mediaRes = await fetch(`https://myspectra.runasp.net/api/FrameMedia/frame/${id}`);
        if (mediaRes.ok) {
          const mediaData = await mediaRes.json();
          
          const imageUrls = mediaData.map(m => m.mediaUrl);
          
          setImages(imageUrls.length > 0 ? imageUrls : ["https://via.placeholder.com/600x400?text=Chua+Co+Anh"]);
        } else {
          setImages(["https://via.placeholder.com/600x400?text=Chua+Co+Anh"]);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductDetails();
  }, [id]);

  const handleAddToCart = () => {
    
    const cartItem = {
      id: product.id || product.frameId,
      name: product.frameName,
      price: product.basePrice,
      image: [images[0]], 
    };
    addToCart(cartItem, quantity); 
    setIsModalOpen(true); 
  };

  if (isLoading) return <p style={{ textAlign: "center", marginTop: "50px", fontSize: "18px", color: "#666" }}>⏳ Đang tải thông tin sản phẩm...</p>;
  
  if (error || !product) return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2 style={{ color: "#d32f2f" }}>❌ {error}</h2>
      <button onClick={() => navigate("/")} style={{ padding: "10px 20px", marginTop: "15px", cursor: "pointer", background: "#111", color: "white", borderRadius: "6px", border: "none" }}>Quay lại Trang chủ</button>
    </div>
  );

  return (
    <>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      <div style={{ maxWidth: 1100, margin: "40px auto", display: "flex", gap: 60, padding: "0 20px" }}>
        
       
        <ImageGallery images={images} />

        
        <div style={{ flex: 1 }}>
          <h2 style={{ marginBottom: 6 }}>{product.frameName}</h2>
          <p style={{ margin: "10px 0 4px", color: "#666" }}>Thương hiệu: <strong>{product.brand}</strong></p>

          <p style={{ fontSize: 36, fontWeight: "bold", margin: "15px 0 16px", color: "#10b981" }}>
            ${product.basePrice}
          </p>

          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, backgroundColor: "#FFF3CD", padding: "6px 12px", borderRadius: 20, fontSize: 14, marginBottom: 24 }}>
            ⭐ 5.0 <span style={{ fontWeight: 500 }}>Đánh giá</span>
          </div>

          <div style={{ margin: "10px 0" }}>
            <p>Trạng thái: <span style={{ color: product.stockQuantity > 0 ? "green" : "red", fontWeight: "bold" }}>
              {product.stockQuantity > 0 ? `Còn hàng (${product.stockQuantity})` : "Hết hàng"}
            </span></p>
          </div>

          <div style={{ margin: "20px 0", display: "flex", alignItems: "center" }}>
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} style={{ width: '34px', height: '34px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc', background: '#f3f4f6' }}>-</button>
            <span style={{ margin: "0 20px", fontSize: "18px", fontWeight: "bold" }}>{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)} style={{ width: '34px', height: '34px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc', background: '#f3f4f6' }} disabled={quantity >= product.stockQuantity}>+</button>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={product.stockQuantity <= 0}
            style={{
              padding: "14px 24px",
              backgroundColor: product.stockQuantity > 0 ? "#000" : "#ccc",
              color: "white",
              fontWeight: "bold",
              border: "none",
              borderRadius: "8px",
              cursor: product.stockQuantity > 0 ? "pointer" : "not-allowed",
              width: "100%",
              fontSize: "16px",
              marginTop: "10px"
            }}
          >
            {product.stockQuantity > 0 ? "🛒 Thêm vào giỏ hàng" : "Hết hàng tạm thời"}
          </button>
        </div>
      </div>

      
      <div className="product-detail-under-image" style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px 50px" }}>
        <Section title="Chi tiết sản phẩm">
          <Tabs
            button={
              <>
                <TabButton isSelected={selectedTab === "description"} onClick={() => setSelectedTab("description")}>
                  Thông số Kỹ thuật
                </TabButton>
              </>
            }
          >
            {selectedTab === "description" && (
              <div style={{ lineHeight: "1.8", color: "#444", backgroundColor: "#f9fafb", padding: "20px", borderRadius: "10px", border: "1px solid #eee" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <p><strong>Màu sắc:</strong> {product.color || "Không xác định"}</p>
                  <p><strong>Chất liệu:</strong> {product.material || "Không xác định"}</p>
                  <p><strong>Hình dáng:</strong> {product.shape || "Không xác định"}</p>
                  <p><strong>Kích cỡ:</strong> {product.size || "Không xác định"}</p>
                  <p><strong>Độ rộng tròng kính (Lens Width):</strong> {product.lensWidth} mm</p>
                  <p><strong>Cầu kính (Bridge Width):</strong> {product.bridgeWidth} mm</p>
                  <p><strong>Độ rộng gọng (Frame Width):</strong> {product.frameWidth} mm</p>
                  <p><strong>Càng kính (Temple Length):</strong> {product.templeLength} mm</p>
                </div>
              </div>
            )}
          </Tabs>
        </Section>
      </div>
    </>
  );
}