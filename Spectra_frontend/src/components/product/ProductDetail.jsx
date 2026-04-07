import React, { useState, useEffect, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import LensSelectionModal from "../ui/LensSelectionModal";
import Modal from "../ui/Modal";
import ProductReviews from "./ProductReviews";
import "./ProductDetail.css";
import { useFrame, useFrameLensTypes } from "../../api";

const fallbackImage =
  "https://placehold.co/600x400/eeeeee/999999?text=No+Image";

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
          <button className="close-zoom-btn" onClick={() => setIsZoomed(false)}>
            ✕
          </button>
          <img
            src={mainImg}
            alt="Zoomed Product"
            className="zoomed-image"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  // Use cached hooks for frame data
  const {
    frame: product,
    isLoading: productLoading,
    isError: productError,
  } = useFrame(id);
  const { lensTypes: lensData } = useFrameLensTypes(id);
  const supportedLensTypes = lensData?.supportedLensTypes || [];

  const [allMedia, setAllMedia] = useState([]);
  const [images, setImages] = useState([fallbackImage]);
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState(null);

  const [isLensModalOpen, setIsLensModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  const isLoading = productLoading;
  const error = productError ? "Unable to load product information" : "";

  // Process media when product loads
  useEffect(() => {
    if (!product) return;

    const media = product.frameMedia || [];
    setAllMedia(media);

    if (product.frameColors?.length > 0) {
      const firstColor = product.frameColors[0];
      setSelectedColor(firstColor);
      applyColorImages(media, firstColor.colorId);
    } else if (media.length > 0) {
      setImages(media.map((m) => m.mediaUrl).filter(Boolean));
    }
  }, [product]);

  const applyColorImages = (media, colorId) => {
    const colorSpecificImages = media
      .filter((m) => m.colorId === colorId)
      .map((m) => m.mediaUrl)
      .filter(Boolean);

    if (colorSpecificImages.length > 0) {
      setImages(colorSpecificImages);
    } else {
      const noColorImages = media
        .filter((m) => !m.colorId)
        .map((m) => m.mediaUrl)
        .filter(Boolean);
      setImages(
        noColorImages.length > 0
          ? noColorImages
          : media.map((m) => m.mediaUrl).filter(Boolean),
      );
    }
  };

  const handleColorSelect = (fc) => {
    setSelectedColor(fc);
    setQuantity(1);
    applyColorImages(allMedia, fc.colorId);

  };

  if (isLoading)
    return <p className="center-msg">Loading product information...</p>;
  if (error || !product)
    return (
      <div className="center-msg">
        <h2>{error}</h2>
      </div>
    );

  const preorderInfo = product.preorderInfo || null;
  const isPreorder = preorderInfo !== null;
  const currentStock = selectedColor ? selectedColor.stockQuantity || 0 : 0;
  const inStock = currentStock > 0;
  const canBuy = inStock || isPreorder;
  const maxAllowedQuantity = isPreorder
    ? preorderInfo.maxQuantityPerOrder
    : currentStock;
  const colorExtraCost = selectedColor?.colorExtraCost || 0;
  const displayPrice = isPreorder
    ? preorderInfo.campaignPrice
    : product.basePrice + colorExtraCost;
  const productForModal = { ...product, basePrice: displayPrice };

  const handleConfirmAddToCart = (cartDataOptions) => {
    const colorObj = selectedColor?.color || selectedColor || {};
    const itemData = {
      id: product.id || product.frameId,
      name: product.frameName,
      price: cartDataOptions.finalPrice,
      image: images[0],
      color: colorObj.colorName || "Default",
      colorId: colorObj.id || colorObj.colorId || null,
      quantity: quantity,
      maxStock: maxAllowedQuantity,
      isPreorder: isPreorder,
      campaignId: isPreorder ? preorderInfo.campaignId : null,
      estimatedDeliveryDate: isPreorder
        ? preorderInfo.estimatedDeliveryDate
        : null,
      lensInfo: cartDataOptions.lensIncluded
        ? {
          typeId: cartDataOptions.lensDetails.typeId,
          lensIndexId: cartDataOptions.lensDetails.lensIndexId || null,
          featureId: cartDataOptions.lensDetails.featureId,
          prescriptionId: cartDataOptions.lensDetails?.prescriptionId || null,
          type:
            cartDataOptions.lensDetails.lensType?.lensSpecification || "N/A",
          lensIndex:
            cartDataOptions.lensDetails.lensIndex?.indexValue || null,
          feature:
            cartDataOptions.lensDetails.lensFeature?.featureSpecification ||
            "None",
          typePrice: cartDataOptions.lensDetails.lensType?.basePrice || 0,
          indexPrice:
            cartDataOptions.lensDetails.lensIndex?.additionalPrice || 0,
          featurePrice:
            cartDataOptions.lensDetails.lensFeature?.extraPrice || 0,
        }
        : null,
    };
    addToCart(itemData, quantity);
    setIsLensModalOpen(false);
    setIsSuccessModalOpen(true);
  };

  // Kiểm tra kính có thông số Rx/PD không
  const hasRxInfo =
    product.minRx != null ||
    product.maxRx != null ||
    product.minPd != null ||
    product.maxPd != null;

  return (
    <>
      <LensSelectionModal
        isOpen={isLensModalOpen}
        onClose={() => setIsLensModalOpen(false)}
        product={productForModal}
        supportedLensTypes={supportedLensTypes}
        onConfirmAddToCart={handleConfirmAddToCart}
      />
      <Modal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
      />

      <div className="product-detail-container">
        <div className="product-top-row">
          <ImageGallery images={images} />

          <div className="product-info-col">
            <h2 className="product-title">{product.frameName}</h2>
            <p className="product-brand">
              Brand: <strong>{product.brand?.brandName || "N/A"}</strong>
            </p>

            <p
              className="product-price"
              style={{ color: isPreorder ? "#2563eb" : "#000000" }}
            >
              ${displayPrice}
            </p>

            {colorExtraCost > 0 && (
              <p
                style={{
                  fontSize: "13px",
                  color: "#6b7280",
                  margin: "-8px 0 10px",
                }}
              >
                (Base Price: ${product.basePrice} + Color Surcharge: ${colorExtraCost})
              </p>
            )}

            {isPreorder && (
              <div
                style={{
                  display: "inline-block",
                  backgroundColor: "#dbeafe",
                  color: "#1d4ed8",
                  padding: "4px 12px",
                  borderRadius: "20px",
                  fontSize: "13px",
                  fontWeight: "bold",
                  marginBottom: "15px",
                }}
              >
                Pre-order Benefit
              </div>
            )}

            {/* Màu sắc */}
            <div
              className="product-color-selector"
              style={{ margin: "15px 0" }}
            >
              <h4 style={{ marginBottom: "10px", fontSize: "15px" }}>
                Colors available:
              </h4>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {product.frameColors?.map((fc) => {
                  const hasColorImages = allMedia.some(
                    (m) => m.colorId === fc.colorId,
                  );
                  return (
                    <button
                      key={fc.colorId}
                      onClick={() => handleColorSelect(fc)}
                      className={
                        selectedColor?.colorId === fc.colorId
                          ? "color-btn active"
                          : "color-btn"
                      }
                      style={{
                        padding: "8px 16px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        border:
                          selectedColor?.colorId === fc.colorId
                            ? "2px solid #2563eb"
                            : "1px solid #d1d5db",
                        backgroundColor:
                          selectedColor?.colorId === fc.colorId
                            ? "#eff6ff"
                            : "#ffffff",
                        position: "relative",
                      }}
                    >
                      <span
                        style={{
                          width: "16px",
                          height: "16px",
                          backgroundColor: fc.color?.hexCode || "#ccc",
                          borderRadius: "50%",
                          border: "1px solid #999",
                        }}
                      ></span>
                      {fc.color?.colorName}
                      {hasColorImages && (
                        <span
                          style={{
                            fontSize: "10px",
                            color: "#10b981",
                            marginLeft: "2px",
                          }}
                          title="Unique images available for this color"
                        ></span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Trạng thái */}
            <div className="product-status">
              Status:
              {isPreorder ? (
                <span
                  style={{
                    color: "#2563eb",
                    fontWeight: "bold",
                    marginLeft: "8px",
                  }}
                >
                  Pre-orders open (Max {maxAllowedQuantity} items/order)
                  <div
                    style={{
                      fontSize: "13px",
                      marginTop: "5px",
                      color: "#4b5563",
                    }}
                  >
                    Estimated delivery date:{" "}
                    {new Date(
                      preorderInfo.estimatedDeliveryDate,
                    ).toLocaleDateString("en-US")}
                  </div>
                </span>
              ) : (
                <span
                  className={inStock ? "status-in-stock" : "status-out-stock"}
                  style={{ marginLeft: "8px" }}
                >
                  {inStock ? `In stock (${currentStock})` : "Out of stock"}
                </span>
              )}
            </div>

            {/* Số lượng */}
            <div className="quantity-wrapper">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="btn-qty"
                disabled={!canBuy}
              >
                -
              </button>
              <span className="qty-value">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="btn-qty"
                disabled={!canBuy || quantity >= maxAllowedQuantity}
              >
                +
              </button>
            </div>

            {/* Nút mua */}
            <button
              onClick={() => setIsLensModalOpen(true)}
              className={`btn-add-cart ${canBuy ? "active" : ""}`}
              disabled={!canBuy}
              style={
                !canBuy
                  ? {
                    backgroundColor: "#e5e7eb",
                    color: "#9ca3af",
                    cursor: "not-allowed",
                    boxShadow: "none",
                    border: "1px solid #d1d5db",
                  }
                  : isPreorder
                    ? { backgroundColor: "#2563eb" }
                    : {}
              }
            >
              {isPreorder
                ? "Pre-order now"
                : inStock
                  ? "Add to cart"
                  : "Out of stock"}
            </button>

            {/* Thẻ thông tin */}
            <div className="product-info-grid">
              {/* Thẻ 1: Chi tiết sản phẩm */}
              <div className="info-card">
                <div className="info-card-header">
                  <h3>Product details</h3>
                </div>
                <div className="info-card-body">
                  <div className="info-row">
                    <span className="info-label">Material:</span>
                    <span className="info-value">
                      {product.material?.materialName}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Style:</span>
                    <span className="info-value">
                      {product.shape?.shapeName}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Size:</span>
                    <span className="info-value text-capitalize">
                      {product.size}
                    </span>
                  </div>

                  {supportedLensTypes.length > 0 && (
                    <div
                      className="lens-types-section"
                      style={{
                        marginTop: "20px",
                        borderTop: "1px solid #eee",
                        paddingTop: "15px",
                      }}
                    >
                      <h4
                        style={{
                          fontSize: "13px",
                          marginBottom: "10px",
                          color: "#111827",
                          fontWeight: "700",
                        }}
                      >
                        SUPPORTED LENS TYPES:
                      </h4>
                      {supportedLensTypes.map((lt) => (
                        <div
                          className="info-row"
                          key={lt.id || lt.lensTypeId}
                          style={{ padding: "8px 0" }}
                        >
                          <span
                            style={{
                              fontWeight: "700",
                              textDecoration: "underline",
                              fontSize: "14px",
                            }}
                          >
                            {lt.lensSpecification || lt.typeName}
                          </span>
                          <span className="info-value">Yes</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Thẻ 2: Thông số kỹ thuật + Yêu cầu đơn thuốc */}
              <div className="info-card">
                <div className="info-card-header">
                  <h3>Specifications</h3>
                </div>
                <div className="info-card-body">
                  <div className="info-row">
                    <span className="info-label">Size:</span>
                    <span className="info-value text-capitalize">
                      {product.size}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Lens Width:</span>
                    <span className="info-value">{product.lensWidth} mm</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Bridge Width:</span>
                    <span className="info-value">{product.bridgeWidth} mm</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Temple Length:</span>
                    <span className="info-value">
                      {product.templeLength} mm
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Frame Width:</span>
                    <span className="info-value">{product.frameWidth} mm</span>
                  </div>

                  {/* Yêu cầu đơn thuốc — chỉ hiện nếu kính có set thông số */}
                  {hasRxInfo && (
                    <div
                      style={{
                        marginTop: "16px",
                        borderTop: "1px solid #eee",
                        paddingTop: "14px",
                      }}
                    >
                      <h4
                        style={{
                          fontSize: "13px",
                          marginBottom: "10px",
                          color: "#111827",
                          fontWeight: "700",
                        }}
                      >
                        SUPPORTED Rx RANGE:
                      </h4>

                      {(product.minRx != null || product.maxRx != null) && (
                        <div className="info-row">
                          <span className="info-label">Rx Range:</span>
                          <span className="info-value">
                            {product.minRx ?? "—"} ~ {product.maxRx ?? "—"}
                          </span>
                        </div>
                      )}

                      {(product.minPd != null || product.maxPd != null) && (
                        <div className="info-row">
                          <span className="info-label">PD Range:</span>
                          <span className="info-value">
                            {product.minPd ?? "—"} - {product.maxPd ?? "—"} mm
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Reviews Section */}
        <ProductReviews frameId={product.frameId || product.id} />
      </div>
    </>
  );
}