import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import ImageGallery from "./ImageGallery";
import Section from "./Section";
import Tabs from "./Tabs";
import TabButton from "./TabButton";
import Modal from "../ui/Modal";
import './ProductDetail.css'; // IMPORT CSS

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

  const fallbackImage = "https://via.placeholder.com/600x400?text=Chua+Co+Anh";

  useEffect(() => {
    const fetchProductDetails = async () => {
      setIsLoading(true); setError("");
      try {
        const frameRes = await fetch(`https://myspectra.runasp.net/api/Frames/${id}`);
        if (!frameRes.ok) throw new Error("Không tìm thấy sản phẩm này trên hệ thống.");
        setProduct(await frameRes.json());

        const mediaRes = await fetch(`https://myspectra.runasp.net/api/FrameMedia/frame/${id}`);
        if (mediaRes.ok) {
          const mediaData = await mediaRes.json();
          const imageUrls = mediaData.map(m => m.mediaUrl);
          const validImages = [];
          for (let url of imageUrls) {
            try {
               const check = await fetch(url, { method: 'HEAD' });
               if(check.ok) validImages.push(url);
            } catch (e) { /* Bỏ qua ảnh lỗi */ }
          }
          setImages(validImages.length > 0 ? validImages : [fallbackImage]);
        } else setImages([fallbackImage]);
      } catch (err) { setError(err.message); } 
      finally { setIsLoading(false); }
    };
    fetchProductDetails();
  }, [id]);

  const handleAddToCart = () => {
    const cartItem = { id: product.id || product.frameId, name: product.frameName, price: product.basePrice, image: [images[0]] };
    addToCart(cartItem, quantity); 
    setIsModalOpen(true); 
  };

  if (isLoading) return <p className="center-msg" style={{color: "#666"}}>⏳ Đang tải thông tin sản phẩm...</p>;
  if (error || !product) return (
    <div className="center-msg">
      <h2 className="error-text">❌ {error}</h2>
      <button onClick={() => navigate("/")} className="btn-back-home">Quay lại Trang chủ</button>
    </div>
  );

  const inStock = product.stockQuantity > 0;

  return (
    <>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      <div className="product-detail-layout">
        <ImageGallery images={images} />

        <div className="product-info-col">
          <h2 className="product-title">{product.frameName}</h2>
          <p className="product-brand">Thương hiệu: <strong>{product.brand}</strong></p>
          <p className="product-price">${product.basePrice}</p>

          <div className="product-rating">⭐ 5.0 <span>Đánh giá</span></div>

          <div className="product-status">
            Trạng thái: <span className={inStock ? "status-in-stock" : "status-out-stock"}>
              {inStock ? `Còn hàng (${product.stockQuantity})` : "Hết hàng"}
            </span>
          </div>

          <div className="quantity-wrapper">
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="btn-qty">-</button>
            <span className="qty-value">{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)} className="btn-qty" disabled={quantity >= product.stockQuantity}>+</button>
          </div>

          <button onClick={handleAddToCart} disabled={!inStock} className={`btn-add-cart ${inStock ? "active" : "disabled"}`}>
            {inStock ? "🛒 Thêm vào giỏ hàng" : "Hết hàng tạm thời"}
          </button>
        </div>
      </div>

      <div className="specs-container">
        <Section title="Chi tiết sản phẩm">
          <Tabs button={<TabButton isSelected={selectedTab === "description"} onClick={() => setSelectedTab("description")}>Thông số Kỹ thuật</TabButton>}>
            {selectedTab === "description" && (
              <div className="specs-box">
                <div className="specs-grid">
                  <p><strong>Màu sắc:</strong> {product.color || "Không xác định"}</p>
                  <p><strong>Chất liệu:</strong> {product.material || "Không xác định"}</p>
                  <p><strong>Hình dáng:</strong> {product.shape || "Không xác định"}</p>
                  <p><strong>Kích cỡ:</strong> {product.size || "Không xác định"}</p>
                  <p><strong>Độ rộng tròng kính:</strong> {product.lensWidth} mm</p>
                  <p><strong>Cầu kính:</strong> {product.bridgeWidth} mm</p>
                  <p><strong>Độ rộng gọng:</strong> {product.frameWidth} mm</p>
                  <p><strong>Càng kính:</strong> {product.templeLength} mm</p>
                </div>
              </div>
            )}
          </Tabs>
        </Section>
      </div>
    </>
  );
}