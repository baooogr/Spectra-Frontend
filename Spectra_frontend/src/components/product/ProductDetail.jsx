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

  // STATE MỚI: Lưu màu sắc hiện tại khách đang chọn
  const [selectedColor, setSelectedColor] = useState(null);

  const [isLensModalOpen, setIsLensModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  useEffect(() => {
    const fetchProductDetails = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`https://myspectra.runasp.net/api/Frames/${id}`);
        if (!res.ok) throw new Error("Không thể tải thông tin sản phẩm");
        const data = await res.json();
        setProduct(data);

        let fetchedImages = [];
        if (data.frameMedia && data.frameMedia.length > 0) {
          fetchedImages = data.frameMedia.map(m => m.mediaUrl).filter(Boolean);
        }

        if (fetchedImages.length > 0) {
          setImages(fetchedImages);
        } else {
          setImages([fallbackImage]);
        }

        // Tự động chọn màu sắc đầu tiên (nếu có) thay vì dùng [0] cứng ngắc
        if (data.frameColors && data.frameColors.length > 0) {
          setSelectedColor(data.frameColors[0]);
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
    setIsLensModalOpen(true);
  };

  const handleConfirmAddToCart = (cartDataOptions) => {
    const tPrice = cartDataOptions.lensDetails?.lensType?.basePrice || 0;
    const fPrice = cartDataOptions.lensDetails?.lensFeature?.extraPrice || 0;

    // SỬA: Lấy thông tin màu sắc từ selectedColor (do người dùng click chọn trên UI)
    const colorObj = selectedColor?.color || selectedColor || {};
    const itemColor = colorObj.colorName || "Mặc định";
    const itemColorId = colorObj.id || colorObj.colorId || selectedColor?.colorId || null;

    const itemData = {
      id: product.id || product.frameId,
      name: product.frameName,
      price: cartDataOptions.finalPrice,
      image: images[0],
      color: itemColor, 
      colorId: itemColorId, 
      quantity: quantity,
      lensInfo: cartDataOptions.lensIncluded ? {
        type: cartDataOptions.lensDetails.lensType?.typeName || cartDataOptions.lensDetails.lensType?.lensSpecification || "N/A",
        typePrice: tPrice, 
        feature: cartDataOptions.lensDetails.lensFeature?.featureSpecification || cartDataOptions.lensDetails.lensFeature?.featureName || "N/A",
        featureId: cartDataOptions.lensDetails.lensFeature?.id || cartDataOptions.lensDetails.lensFeature?.featureId,
        typeId: cartDataOptions.lensDetails.lensType?.id || cartDataOptions.lensDetails.lensType?.lensTypeId,
        featurePrice: fPrice, 
        prescriptionId: cartDataOptions.lensDetails?.prescriptionId || cartDataOptions.prescriptionId || null
      } : null
    };

    addToCart(itemData, quantity);
    setIsLensModalOpen(false);
    setIsSuccessModalOpen(true);
  };

  if (isLoading) return <p className="center-msg" style={{ color: "#666", textAlign: "center", padding: "50px" }}>⏳ Đang tải thông tin sản phẩm...</p>;
  if (error || !product) return (
    <div className="center-msg" style={{ textAlign: "center", padding: "50px" }}>
      <h2 className="error-text" style={{ color: "red" }}>❌ {error}</h2>
      <button onClick={() => navigate("/")} className="btn-back-home" style={{ padding: "10px 20px", marginTop: "20px" }}>Quay lại Trang chủ</button>
    </div>
  );

  // SỬA: Tính toán tồn kho dựa trên MÀU đang được chọn
  const currentStock = selectedColor ? (selectedColor.stockQuantity || 0) : (product.stockQuantity || 0);
  const inStock = currentStock > 0;

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

          {/* SỬA: Vòng lặp màu sắc nội bộ product.frameColors thay vì siblingFrames */}
          {product.frameColors && product.frameColors.length > 0 && (
            <div className="product-color-selector" style={{ margin: '15px 0' }}>
              <h4 style={{ marginBottom: '10px', fontSize: '15px' }}>Màu sắc có sẵn:</h4>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {product.frameColors.map(fc => {
                  const colorObj = fc.color || {};
                  const fcId = fc.colorId || colorObj.colorId;
                  const isCurrentActive = selectedColor && (selectedColor.colorId === fcId);
                  
                  return (
                    <button
                      key={fcId}
                      onClick={() => {
                        setSelectedColor(fc);
                        setQuantity(1); // Reset số lượng về 1 khi chuyển màu
                      }}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        cursor: isCurrentActive ? 'default' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        border: isCurrentActive ? '2px solid #2563eb' : '1px solid #d1d5db',
                        backgroundColor: isCurrentActive ? '#eff6ff' : '#ffffff',
                        fontWeight: isCurrentActive ? 'bold' : 'normal',
                        transition: 'all 0.2s',
                        opacity: fc.stockQuantity <= 0 ? 0.6 : 1 // Làm mờ nhẹ nếu hết hàng
                      }}
                      onMouseEnter={(e) => { if (!isCurrentActive) e.currentTarget.style.borderColor = '#9ca3af'; }}
                      onMouseLeave={(e) => { if (!isCurrentActive) e.currentTarget.style.borderColor = '#d1d5db'; }}
                    >
                      <span style={{
                        width: '16px',
                        height: '16px',
                        backgroundColor: colorObj.hexCode || '#ccc',
                        borderRadius: '50%',
                        display: 'inline-block',
                        border: '1px solid #9ca3af'
                      }}></span>
                      {colorObj.colorName || 'Màu sắc'} 
                      {fc.stockQuantity <= 0 && <span style={{fontSize: '11px', color: '#ef4444'}}> (Hết hàng)</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* DÒNG TRẠNG THÁI SẢN PHẨM THEO MÀU ĐANG CHỌN */}
          <div className="product-status">
            Trạng thái: <span className={inStock ? "status-in-stock" : "status-out-stock"} style={{ color: inStock ? 'inherit' : '#ef4444', fontWeight: 'bold' }}>
              {inStock ? `Còn hàng (${currentStock})` : "Hết hàng (Out of Stock)"}
            </span>
          </div>

          <div className="quantity-wrapper">
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="btn-qty" disabled={!inStock}>-</button>
            <span className="qty-value">{quantity}</span>
            {/* Chặn không cho thêm vào giỏ hàng quá số lượng tồn kho của màu */}
            <button onClick={() => setQuantity(quantity + 1)} className="btn-qty" disabled={!inStock || quantity >= currentStock}>+</button>
          </div>

          {/* NÚT THÊM VÀO GIỎ HÀNG VÀ OUT OF STOCK */}
          {inStock ? (
            <button onClick={handleOpenLensSelection} className="btn-add-cart active">
              🛒 Thêm vào giỏ hàng
            </button>
          ) : (
            <div style={{ marginTop: '20px' }}>
              <button disabled className="btn-add-cart disabled" style={{ opacity: 0.5, cursor: 'not-allowed', backgroundColor: '#9ca3af', width: '100%', padding: '15px', borderRadius: '8px', color: 'white', fontWeight: 'bold', border: 'none' }}>
                🚫 Out of Stock (Hết hàng)
              </button>
            </div>
          )}

          <div className="product-description-box">
            <h3>Chi tiết sản phẩm</h3>
            <ul style={{ listStyleType: 'none', padding: 0, lineHeight: '1.8' }}>
              <li><strong>Chất liệu:</strong> {product.material?.materialName || "Chưa cập nhật"}</li>
              <li><strong>Kiểu dáng:</strong> {product.shape?.shapeName || product.shape || "Chưa cập nhật"}</li>
              <li><strong>Kích cỡ (Size):</strong> <span style={{ textTransform: 'capitalize' }}>{product.size || "Chưa cập nhật"}</span></li>

              <li style={{ marginTop: '15px' }}><strong>Thông số kỹ thuật:</strong></li>
              <ul style={{ listStyleType: 'square', paddingLeft: '20px', marginTop: '5px' }}>
                <li><strong>Rộng tròng (Lens Width):</strong> {product.lensWidth} mm</li>
                <li><strong>Cầu kính (Bridge Width):</strong> {product.bridgeWidth} mm</li>
                <li><strong>Càng kính (Temple Length):</strong> {product.templeLength} mm</li>
                <li><strong>Rộng khung (Frame Width):</strong> {product.frameWidth} mm</li>
              </ul>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}