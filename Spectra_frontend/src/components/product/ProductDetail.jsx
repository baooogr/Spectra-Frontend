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
  const [supportedLensTypes, setSupportedLensTypes] = useState([]);
  const [images, setImages] = useState([fallbackImage]);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedColor, setSelectedColor] = useState(null);
  const [isLensModalOpen, setIsLensModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // --- STATE PREORDER ---
  const [preorderInfo, setPreorderInfo] = useState(null);

  useEffect(() => {
    const fetchProductData = async () => {
      setIsLoading(true);
      try {
        // GỌI SONG SONG 3 API
        const [productRes, lensRes, campaignsRes] = await Promise.all([
          fetch(`https://myspectra.runasp.net/api/Frames/${id}`),
          fetch(`https://myspectra.runasp.net/api/Frames/${id}/lens-types`),
          fetch(`https://myspectra.runasp.net/api/PreorderCampaigns/active`)
        ]);

        if (!productRes.ok) throw new Error("Không thể tải thông tin sản phẩm");

        const productData = await productRes.json();
        setProduct(productData);

        if (lensRes.ok) {
          const lensData = await lensRes.json();
          setSupportedLensTypes(lensData.supportedLensTypes || []);
        }

        // KIỂM TRA LOGIC PRE-ORDER 
        if (campaignsRes.ok) {
           const campaignsData = await campaignsRes.json();
           for (const camp of campaignsData) {
               const frameInCamp = camp.frames?.find(f => f.frameId === id);
               // Chỉ hiển thị trạng thái Preorder nếu thực sự hết hàng
               if (frameInCamp && productData.stockQuantity <= 0) {
                   setPreorderInfo({
                       campaignId: camp.campaignId || camp.id,
                       campaignName: camp.campaignName,
                       expectedDeliveryDate: camp.estimatedDeliveryDate,
                       campaignPrice: frameInCamp.campaignPrice,
                       maxQuantityPerOrder: frameInCamp.maxQuantityPerOrder
                   });
                   break;
               }
           }
        }

        if (productData.frameMedia?.length > 0) {
          setImages(productData.frameMedia.map(m => m.mediaUrl).filter(Boolean));
        }
        if (productData.frameColors?.length > 0) {
          setSelectedColor(productData.frameColors[0]);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProductData();
  }, [id]);

  const handleConfirmAddToCart = (cartDataOptions) => {
    const colorObj = selectedColor?.color || selectedColor || {};

    const itemData = {
      id: product.id || product.frameId,
      name: product.frameName,
      price: cartDataOptions.finalPrice, // Đã bao gồm Giá Preorder + Tròng
      image: images[0],
      color: colorObj.colorName || "Mặc định",
      colorId: colorObj.id || colorObj.colorId || null,
      quantity: quantity,
      
      // --- DỮ LIỆU ĐỂ GIỎ HÀNG NHẬN DIỆN PREORDER ---
      isPreorder: isPreorder,
      campaignId: isPreorder ? preorderInfo.campaignId : null,
      expectedDeliveryDate: isPreorder ? preorderInfo.expectedDeliveryDate : null,

      lensInfo: cartDataOptions.lensIncluded ? {
        typeId: cartDataOptions.lensDetails.typeId,
        featureId: cartDataOptions.lensDetails.featureId,
        prescriptionId: cartDataOptions.lensDetails?.prescriptionId || null,
        type: cartDataOptions.lensDetails.lensType?.lensSpecification || "N/A",
        feature: cartDataOptions.lensDetails.lensFeature?.featureSpecification || "Không có",
        typePrice: cartDataOptions.lensDetails.lensType?.basePrice || 0,
        featurePrice: cartDataOptions.lensDetails.lensFeature?.extraPrice || 0
      } : null
    };

    addToCart(itemData, quantity);
    setIsLensModalOpen(false);
    setIsSuccessModalOpen(true);
  };

  if (isLoading) return <p className="center-msg">⏳ Đang tải thông tin sản phẩm...</p>;
  if (error || !product) return <div className="center-msg"><h2>❌ {error}</h2></div>;

  const currentStock = selectedColor ? (selectedColor.stockQuantity || 0) : 0;
  const inStock = currentStock > 0;
  
  // TÍNH TOÁN BIẾN QUYẾT ĐỊNH
  const isPreorder = !inStock && preorderInfo !== null;
  const canBuy = inStock || isPreorder;
  const maxAllowedQuantity = isPreorder ? preorderInfo.maxQuantityPerOrder : currentStock;
  const displayPrice = isPreorder ? preorderInfo.campaignPrice : product.basePrice;
  
  // Đè lại giá basePrice truyền vào Modal Kính để tính tổng tiền đúng
  const productForModal = { ...product, basePrice: displayPrice };

  return (
    <>
      <LensSelectionModal
        isOpen={isLensModalOpen}
        onClose={() => setIsLensModalOpen(false)}
        product={productForModal} // TRUYỀN GIÁ CẬP NHẬT VÀO MODAL
        supportedLensTypes={supportedLensTypes}
        onConfirmAddToCart={handleConfirmAddToCart}
      />
      <Modal isOpen={isSuccessModalOpen} onClose={() => setIsSuccessModalOpen(false)} />

      <div className="product-detail-container">
         <ImageGallery images={images} />

        <div className="product-info-col">
          <h2 className="product-title">{product.frameName}</h2>
          <p className="product-brand">Thương hiệu: <strong>{product.brand?.brandName || "N/A"}</strong></p>
          
          {/* HIỂN THỊ GIÁ BÁN (GẠCH NGANG NẾU LÀ PREORDER) */}
          <p className="product-price" style={{ color: isPreorder ? "#2563eb" : "#000000" }}>
            ${displayPrice}
            {isPreorder && (
                <span style={{ fontSize: "20px", textDecoration: "line-through", color: "#9ca3af", marginLeft: "15px" }}>
                  ${product.basePrice}
                </span>
            )}
          </p>
          {isPreorder && (
             <div style={{ display: 'inline-block', backgroundColor: '#dbeafe', color: '#1d4ed8', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', marginBottom: '15px' }}>
                🔥 Ưu đãi đặt trước
             </div>
          )}

          <div className="product-color-selector" style={{ margin: '15px 0' }}>
            <h4 style={{ marginBottom: '10px', fontSize: '15px' }}>Màu sắc có sẵn:</h4>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {product.frameColors?.map(fc => (
                <button
                  key={fc.colorId}
                  onClick={() => { setSelectedColor(fc); setQuantity(1); }}
                  className={selectedColor?.colorId === fc.colorId ? "color-btn active" : "color-btn"}
                  style={{
                    padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                    border: selectedColor?.colorId === fc.colorId ? '2px solid #2563eb' : '1px solid #d1d5db',
                    backgroundColor: selectedColor?.colorId === fc.colorId ? '#eff6ff' : '#ffffff'
                  }}
                >
                  <span style={{ width: '16px', height: '16px', backgroundColor: fc.color?.hexCode || '#ccc', borderRadius: '50%', border: '1px solid #999' }}></span>
                  {fc.color?.colorName}
                </button>
              ))}
            </div>
          </div>

          {/* DÒNG TRẠNG THÁI HIỂN THỊ TỒN KHO HOẶC THÔNG TIN PREORDER */}
          <div className="product-status">
            Trạng thái: 
            {isPreorder ? (
               <span style={{ color: '#2563eb', fontWeight: 'bold', marginLeft: '8px' }}>
                 ⏱️ Đang mở đặt trước (Tối đa {maxAllowedQuantity} cái/đơn)
                 <div style={{ fontSize: '13px', marginTop: '5px', color: '#4b5563' }}>
                    📦 Dự kiến giao hàng: {new Date(preorderInfo.expectedDeliveryDate).toLocaleDateString('vi-VN')}
                 </div>
               </span>
            ) : (
               <span className={inStock ? "status-in-stock" : "status-out-stock"} style={{ marginLeft: '8px' }}>
                 {inStock ? `Còn hàng (${currentStock})` : "Hết hàng"}
               </span>
            )}
          </div>

          <div className="quantity-wrapper">
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="btn-qty" disabled={!canBuy}>-</button>
            <span className="qty-value">{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)} className="btn-qty" disabled={!canBuy || quantity >= maxAllowedQuantity}>+</button>
          </div>

          {/* NÚT THÊM VÀO GIỎ / ĐẶT TRƯỚC */}
          <button
            onClick={() => setIsLensModalOpen(true)}
            className={`btn-add-cart ${canBuy ? 'active' : ''}`}
            disabled={!canBuy}
            style={!canBuy ? {
              backgroundColor: '#e5e7eb',
              color: '#9ca3af',
              cursor: 'not-allowed',
              boxShadow: 'none',
              border: '1px solid #d1d5db'
            } : isPreorder ? {
              backgroundColor: '#2563eb', // Đổi màu xanh cho nổi bật
            } : {}}
          >
            {isPreorder ? "⏱️ Đặt trước ngay (Pre-order)" : inStock ? "🛒 Thêm vào giỏ hàng" : "🚫 Out of stock"}
          </button>

          <div className="product-info-grid">
            <div className="info-card">
              <div className="info-card-header">
                <span className="info-icon">📋</span>
                <h3>Chi tiết sản phẩm</h3>
              </div>
              <div className="info-card-body">
                <div className="info-row">
                  <span className="info-label">Chất liệu:</span>
                  <span className="info-value">{product.material?.materialName}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Kiểu dáng:</span>
                  <span className="info-value">{product.shape?.shapeName}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Kích cỡ (Size):</span>
                  <span className="info-value text-capitalize">{product.size}</span>
                </div>

                {supportedLensTypes.length > 0 && (
                  <div className="lens-types-section" style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                    <h4 style={{ fontSize: '13px', marginBottom: '10px', color: '#111827', fontWeight: '700' }}>
                      LOẠI TRÒNG KÍNH HỖ TRỢ:
                    </h4>
                    {supportedLensTypes.map((lt) => (
                      <div className="info-row" key={lt.id || lt.lensTypeId} style={{ padding: '8px 0' }}>
                        <span style={{ fontWeight: '700', textDecoration: 'underline', fontSize: '14px' }}>
                          {lt.lensSpecification || lt.typeName}
                        </span>
                        <span className="info-value">Yes</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="info-card">
              <div className="info-card-header">
                <span className="info-icon">📐</span>
                <h3>Thông số kỹ thuật</h3>
              </div>
              <div className="info-card-body">
                <div className="info-row"><span className="info-label">Rộng tròng:</span><span className="info-value">{product.lensWidth} mm</span></div>
                <div className="info-row"><span className="info-label">Cầu kính:</span><span className="info-value">{product.bridgeWidth} mm</span></div>
                <div className="info-row"><span className="info-label">Càng kính:</span><span className="info-value">{product.templeLength} mm</span></div>
                <div className="info-row"><span className="info-label">Rộng khung:</span><span className="info-value">{product.frameWidth} mm</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}