
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import LensSelectionModal from "../ui/LensSelectionModal";
import Modal from "../ui/Modal";
import "./ProductDetail.css";

const fallbackImage = "https://placehold.co/600x400/eeeeee/999999?text=No+Image";

const ImageGallery = ({ images }) => {
  const [mainImg, setMainImg] = useState(images[0] || fallbackImage);
  const [isZoomed, setIsZoomed] = useState(false); 
  
  useEffect(() => {
    setMainImg(images[0] || fallbackImage);
  }, [images]);

  return (
    <div className="product-gallery">
      <div className="main-image-container" onClick={() => setIsZoomed(true)}>
        <img src={mainImg} alt="Main Product" className="main-image" />
        <div className="zoom-hint">🔍 Nhấp để phóng to</div>
      </div>
      
      <div className="thumbnail-row">
        {images.map((img, idx) => (
          <div 
            key={idx} 
            className={`thumbnail-wrapper ${mainImg === img ? "active" : ""}`}
            onClick={() => setMainImg(img)}
          >
            <img src={img} alt={`Thumb ${idx}`} className="thumbnail" />
          </div>
        ))}
      </div>

      {isZoomed && (
        <div className="image-zoom-overlay" onClick={() => setIsZoomed(false)}>
          <button className="close-zoom-btn" onClick={() => setIsZoomed(false)}>✕</button>
          <img src={mainImg} alt="Zoomed Product" className="zoomed-image" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
};

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState(null);
  const [images, setImages] = useState([fallbackImage]);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [isLensModalOpen, setIsLensModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  
  // ⚡ BIẾN QUẢN LÝ TRẠNG THÁI KHÁCH BẤM NÚT NÀO
  const [isPreordering, setIsPreordering] = useState(false);

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        const res = await fetch(`https://myspectra.runasp.net/api/Frames/${id}`);
        if (!res.ok) throw new Error("Không thể tải thông tin sản phẩm");
        const data = await res.json();
        setProduct(data);
        
        let fetchedImages = [];
        if (data.mediaUrl) {
          fetchedImages.push(data.mediaUrl);
        } else if (data.imageUrl) {
          fetchedImages.push(data.imageUrl);
        } else if (data.imageUrls && data.imageUrls.length > 0) {
          fetchedImages = data.imageUrls;
        } else if (data.frameMedia && data.frameMedia.length > 0) {
          fetchedImages = data.frameMedia.map(m => m.mediaUrl).filter(Boolean);
        }
        
        if (fetchedImages.length > 0) {
          setImages(fetchedImages);
        } else {
          setImages([fallbackImage]);
        }
      } catch (err) { 
        setError(err.message); 
      } finally { 
        setIsLoading(false); 
      }
    };
    fetchProductDetails();
  }, [id]);

  const handleOpenLensSelection = () => {
    setIsPreordering(false); // ⚡ KHÔNG PHẢI PREORDER
    setIsLensModalOpen(true);
  };

  const handleOpenPreorderSelection = () => {
    setIsPreordering(true); // ⚡ LÀ PREORDER
    setIsLensModalOpen(true);
  };

 const handleConfirmAddToCart = (cartDataOptions) => {
    const itemData = { 
      id: product.id || product.frameId, 
      name: product.frameName, 
      price: cartDataOptions.finalPrice, 
      image: [images[0]],
      color: product.color || "Default",
      quantity: quantity,
      lensInfo: cartDataOptions.lensIncluded ? cartDataOptions.lensDetails : null
    };

    if (isPreordering) {
      // Đóng modal
      setIsLensModalOpen(false); 
      
      // KIỂM TRA ĐĂNG NHẬP TRƯỚC KHI CHO ĐI TỚI PREORDER
      const token = JSON.parse(localStorage.getItem("user"))?.token;
      if (!token) {
        alert("Bạn cần đăng nhập để thực hiện Đặt Trước (Pre-order).");
        navigate("/login");
        return;
      }

      // ĐIỀU HƯỚNG THẲNG SANG TRANG THANH TOÁN PRE-ORDER VÀ TRUYỀN DỮ LIỆU SẢN PHẨM QUA STATE
      navigate("/checkout-preorder", { state: { preorderItem: itemData } });

    } else {
      // NẾU MUA THƯỜNG -> BỎ VÀO GIỎ HÀNG
      addToCart(itemData, quantity); 
      setIsLensModalOpen(false); 
      setIsSuccessModalOpen(true); 
    }
  };

  if (isLoading) return <p className="center-msg" style={{color: "#666", textAlign: "center", padding: "50px"}}>⏳ Đang tải thông tin sản phẩm...</p>;
  if (error || !product) return (
    <div className="center-msg" style={{textAlign: "center", padding: "50px"}}>
      <h2 className="error-text" style={{color: "red"}}>❌ {error}</h2>
      <button onClick={() => navigate("/")} className="btn-back-home" style={{padding: "10px 20px", marginTop: "20px"}}>Quay lại Trang chủ</button>
    </div>
  );

  const inStock = product.stockQuantity > 0;

  return (
    <>
      <LensSelectionModal 
        isOpen={isLensModalOpen} 
        onClose={() => setIsLensModalOpen(false)}
        product={product}
        onConfirmAddToCart={handleConfirmAddToCart}
      />

      <Modal isOpen={isSuccessModalOpen} onClose={() => setIsSuccessModalOpen(false)} />

      <div className="product-detail-container">
        <ImageGallery images={images} />

        <div className="product-info-col">
          <h2 className="product-title">{product.frameName}</h2>
          
          <p className="product-brand">Thương hiệu: <strong>{product.brand?.brandName || "Đang cập nhật"}</strong></p>
          <p className="product-price">${product.basePrice}</p>

          <div className="product-status">
            Trạng thái: <span className={inStock ? "status-in-stock" : "status-out-stock"}>
              {inStock ? `Còn hàng (${product.stockQuantity})` : "Hết hàng (Hỗ trợ Đặt trước)"}
            </span>
          </div>

          <div className="quantity-wrapper">
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="btn-qty">-</button>
            <span className="qty-value">{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)} className="btn-qty" disabled={inStock && quantity >= product.stockQuantity}>+</button>
          </div>

          {inStock ? (
             <button onClick={handleOpenLensSelection} className="btn-add-cart active">
               🛒 Thêm vào giỏ hàng
             </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
              <button disabled className="btn-add-cart disabled" style={{ opacity: 0.5, cursor: 'not-allowed', backgroundColor: '#9ca3af' }}>
                🚫 Out of Stock
              </button>
              <button onClick={handleOpenPreorderSelection} className="btn-add-cart active" style={{ backgroundColor: '#2563eb' }}>
                🚀 Đặt Trước (Pre-Order)
              </button>
            </div>
          )}

          <div className="product-description-box">
            <h3>Chi tiết sản phẩm</h3>
            <ul>
              {/* SỬA CHẤT LIỆU */}
              <li><strong>Chất liệu:</strong> {product.material?.materialName || "Chưa cập nhật"}</li>
              
              {/* SỬA MÀU SẮC (API mới trả về mảng frameColors) */}
              <li>
                <strong>Màu sắc:</strong> {
                  product.frameColors?.length > 0 
                    ? product.frameColors.map(c => c.color?.colorName || c.colorName).join(", ") 
                    : product.color || "Chưa cập nhật"
                }
              </li>
              
              <li><strong>Kích thước (Rộng - Cầu - Càng):</strong> {product.lensWidth} - {product.bridgeWidth} - {product.templeLength} mm</li>
              <li><strong>Kiểu dáng:</strong> {product.shape || "Chưa cập nhật"}</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

