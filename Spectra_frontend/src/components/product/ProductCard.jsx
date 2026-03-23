import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "./ProductCard.css";

function ProductCard({ product }) {
  const navigate = useNavigate();
  const [thumbnailUrl, setThumbnailUrl] = useState(
    product.frameMedia && product.frameMedia.length > 0
      ? product.frameMedia[0].mediaUrl
      : null,
  );

  const preorderInfo = product.preorderInfo || null;
  const isPreorder = preorderInfo !== null;
  const isOutOfStock = product.stockQuantity <= 0 && !isPreorder;

  useEffect(() => {
    if (thumbnailUrl) return;
    const fetchThumbnail = async () => {
      try {
        const id = product.id || product.frameId;
        if (!id) return;
        const res = await fetch(
          `https://myspectra.runasp.net/api/FrameMedia/frame/${id}`,
        );
        if (res.ok) {
          const mediaData = await res.json();
          if (mediaData && mediaData.length > 0) {
            setThumbnailUrl(mediaData[0].mediaUrl);
          }
        }
      } catch (error) {
        console.error("Error loading image:", error);
      }
    };
    fetchThumbnail();
  }, [product, thumbnailUrl]);

  return (
    <div

      className="product-card"

      onClick={() => navigate(`/products/${product.id || product.frameId}`)}
    >
      {/* Badge */}
      {isPreorder && (
        <div className="product-card__badge product-card__badge--preorder">
          Pre-order
        </div>
      )}
      {isOutOfStock && (
        <div className="product-card__badge product-card__badge--outofstock">
          Sold Out
        </div>
      )}


      {/* Image */}
      <div className="product-card__image-wrapper">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}

            alt={product.frameName || "Eyewear"}
            onError={(e) => {
              e.target.style.display = "none";
            }}
            className={`product-card__image ${isOutOfStock ? "product-card__image--faded" : ""}`}
          />
        ) : (

          <div className="product-card__image-placeholder">Loading...</div>
        )}
      </div>

      {/* Content */}
      <div className="product-card__content">
        <div className="product-card__price-row">
          <span
            className={`product-card__price ${isPreorder ? "product-card__price--preorder" : ""}`}

          >
            $
            {isPreorder
              ? preorderInfo.campaignPrice
              : product.basePrice || product.price || 0}
          </span>
        </div>

        <p className="product-card__name">
          {product.frameName || product.name || "Unnamed"}
        </p>

        <p className="product-card__meta">
          {product.brand?.brandName || "Updating"}{" "}
          {product.shape
            ? `• ${product.shape?.shapeName || product.shape}`
            : ""}
        </p>

        {isPreorder && (
          <div className="product-card__status product-card__status--preorder">
            Est. delivery:{" "}
            {new Date(preorderInfo.estimatedDeliveryDate).toLocaleDateString(
              "en-US",
            )}
          </div>
        )}
        {isOutOfStock && (
          <div className="product-card__status product-card__status--outofstock">
            Out of Stock
          </div>
        )}
      </div>

      {/* Quick view overlay */}
      <div className="product-card__quickview">View Details →</div>
    </div>
  );
}

export default ProductCard;
