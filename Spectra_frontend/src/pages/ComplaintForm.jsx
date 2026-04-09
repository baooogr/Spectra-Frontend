import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { UserContext } from "../context/UserContext";
//import "./MyComplaints.css";

const API_BASE = "https://myspectra.runasp.net/api";

const requestTypes = [
  // Only showing exchange for now — other types hidden per business decision
  // { value: "complaint", label: "Complaint (Light feedback)" },
  // { value: "return", label: "Return" },
  { value: "exchange", label: "Exchange" },
  // { value: "refund", label: "Refund" },
  // { value: "warranty", label: "Warranty" },
];

// Business rules: predefined reasons per complaint type
const COMPLAINT_REASONS = {
  return: [
    "The product color is not as expected",
    "The product does not suit the face",
    "Frame size is not suitable",
    "Lens prescription is incorrect",
    "Product is defective / damaged upon arrival",
    "Received the wrong product",
    "Changed mind about the purchase",
  ],
  exchange: [
    "Received the wrong product color",
    "Received the wrong frame size",
    "Product has a manufacturing defect",
    "Want to exchange for another model",
    "Lens is scratched upon arrival",
    "Received the wrong lens type",
  ],
  refund: [
    "Product does not match the description",
    "Product is severely damaged",
    "Returned the product but have not received a refund",
    "Incorrect charge applied",
    "Order was delivered too late",
  ],
  warranty: [
    "Frame is broken/cracked during warranty period",
    "Lens coating is peeling off",
    "Frame hinge is loose/damaged",
    "Frame paint is peeling",
    "Screw is loose/missing",
  ],
  complaint: [
    "Product quality is not as expected",
    "Service attitude is not good",
    "Delivery is delayed",
    "Packaging is not careful",
    "Product information on the website is inaccurate",
    "Other (please specify below)",
  ],
};

export default function ComplaintForm() {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedOrderItemId = searchParams.get("orderItemId") || "";

  const [orders, setOrders] = useState([]);
  const [selectedOrderItemId, setSelectedOrderItemId] = useState(
    preselectedOrderItemId,
  );
  const [requestType, setRequestType] = useState("exchange");
  const [selectedReason, setSelectedReason] = useState("");
  const [reason, setReason] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);

  const token = user?.token || JSON.parse(localStorage.getItem("user"))?.token;

  // Reset selected reason when request type changes
  useEffect(() => {
    setSelectedReason("");
  }, [requestType]);

  // Fetch delivered orders so user can pick an order item
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    const fetchOrders = async () => {
      try {
        const res = await fetch(`${API_BASE}/Orders/my?page=1&pageSize=100`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          const allOrders = data.items || data.Items || [];
          // Only show delivered orders
          const delivered = allOrders.filter(
            (o) => (o.status || o.Status || "").toLowerCase() === "delivered",
          );
          setOrders(delivered);
        }
      } catch {
        /* ignore */
      }
      setLoading(false);
    };
    fetchOrders();
  }, [token, navigate]);

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setUploadingImage(true);
    const newUrls = [];
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch(`${API_BASE}/Complaints/upload-image`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          if (data.url) newUrls.push(data.url);
        }
      } catch {
        /* ignore individual failures */
      }
    }
    if (newUrls.length > 0) {
      setUploadedImages((prev) => [...prev, ...newUrls]);
    }
    setUploadingImage(false);
    e.target.value = null;
  };

  const handleRemoveImage = (index) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!selectedOrderItemId) {
      setError("Please select the product to complain about.");
      return;
    }
    if (!reason.trim() && !selectedReason) {
      setError("Please select or enter a reason.");
      return;
    }

    // Require at least one image or link
    const hasImages = uploadedImages.length > 0;
    const hasLink = mediaUrl.trim().length > 0;
    if (!hasImages && !hasLink) {
      setError(
        "Please upload at least 1 image or enter a proof link so staff can verify the issue.",
      );
      return;
    }

    setSubmitting(true);
    try {
      // Combine uploaded image URLs with manually entered URL
      const allUrls = [...uploadedImages];
      if (mediaUrl.trim()) allUrls.push(mediaUrl.trim());
      const combinedMediaUrl = allUrls.length > 0 ? allUrls.join(",") : null;

      // Use selected reason from dropdown, or free text for "complaint" type
      const finalReason = selectedReason
        ? reason.trim()
          ? `${selectedReason} - ${reason.trim()}`
          : selectedReason
        : reason.trim();

      const res = await fetch(`${API_BASE}/Complaints`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderItemId: selectedOrderItemId,
          requestType,
          reason: finalReason,
          mediaUrl: combinedMediaUrl,
        }),
      });

      if (res.ok || res.status === 201) {
        const data = await res.json();
        navigate(`/complaints/${data.requestId || data.RequestId}`);
      } else {
        const err = await res.json();
        setError(err.message || err.Message || "Unable to create complaint.");
      }
    } catch {
      setError("Connection error. Please try again.");
    }
    setSubmitting(false);
  };

  if (loading) return <div className="mc-loading">Loading...</div>;

  // Flatten all order items from delivered orders (including preorder-converted)
  // Filter by 7-day complaint window
  const orderItems = orders.flatMap((o) => {
    const items = o.items || o.orderItems || o.OrderItems || [];
    const isFromPreorder = !!(
      o.convertedFromPreorderId || o.ConvertedFromPreorderId
    );
    const preorderId =
      o.convertedFromPreorderId || o.ConvertedFromPreorderId || null;

    // Check 7-day window from delivery
    const deliveredDate =
      o.deliveredAt || o.deliveryConfirmedAt || o.arrivalDate;
    if (deliveredDate) {
      const daysSince =
        (Date.now() - new Date(deliveredDate).getTime()) /
        (1000 * 60 * 60 * 24);
      if (daysSince > 7) return [];
    }

    return items.map((item) => ({
      ...item,
      orderId: o.orderId || o.OrderId,
      orderDate: o.createdAt || o.CreatedAt || o.orderDate || o.OrderDate,
      isFromPreorder,
      preorderId,
    }));
  });

  // If orderItemId is preselected, find which order it belongs to and only show items from that order
  const preselectedItem = preselectedOrderItemId
    ? orderItems.find(
        (item) =>
          (item.orderItemId || item.OrderItemId) === preselectedOrderItemId,
      )
    : null;
  const filteredOrderItems = preselectedItem
    ? orderItems.filter((item) => item.orderId === preselectedItem.orderId)
    : orderItems;

  return (
    <div
      style={{
        maxWidth: "700px",
        margin: "40px auto",
        padding: "20px",
        fontFamily: "sans-serif",
      }}
    >
      <h2 style={{ marginBottom: "8px" }}>Exchange Request</h2>
      <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "24px" }}>
        {preselectedItem
          ? "Exchange the product from the selected order."
          : "Select a product from a delivered order and describe your issue."}
      </p>

      <form
        onSubmit={handleSubmit}
        style={{
          backgroundColor: "#fff",
          padding: "30px",
          borderRadius: "12px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
        }}
      >
        {/* Order item selector */}
        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              fontWeight: "600",
              marginBottom: "6px",
              fontSize: "14px",
            }}
          >
            Product to complain about <span style={{ color: "#dc2626" }}>*</span>
          </label>
          {filteredOrderItems.length === 0 ? (
            <p
              style={{
                color: "#d97706",
                fontSize: "14px",
                backgroundColor: "#fef3c7",
                padding: "12px",
                borderRadius: "8px",
              }}
            >
              You do not have any delivered orders within the complaint period (7
              days).
            </p>
          ) : (
            <select
              value={selectedOrderItemId}
              onChange={(e) => setSelectedOrderItemId(e.target.value)}
              disabled={Boolean(preselectedOrderItemId)}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "14px",
                boxSizing: "border-box",
                backgroundColor: preselectedOrderItemId ? "#f3f4f6" : "#fff",
              }}
            >
              <option value="">-- Select product --</option>
              {filteredOrderItems.map((item) => {
                const itemId = item.orderItemId || item.OrderItemId;
                const name =
                  item.frameName || item.productName || item.name || "Product";
                const color = item.colorName || item.color || "";
                const orderLabel =
                  item.isFromPreorder && item.preorderId
                    ? `Preorder #${String(item.preorderId).slice(0, 8)}`
                    : `Order #${String(item.orderId).slice(0, 8)}`;
                return (
                  <option key={itemId} value={itemId}>
                    {name} {color ? `(${color})` : ""} — {orderLabel}
                  </option>
                );
              })}
            </select>
          )}
        </div>

        {/* Request type */}
        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              fontWeight: "600",
              marginBottom: "6px",
              fontSize: "14px",
            }}
          >
            Request Type <span style={{ color: "#dc2626" }}>*</span>
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {requestTypes.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setRequestType(t.value)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "20px",
                  border:
                    requestType === t.value
                      ? "2px solid #3b82f6"
                      : "1px solid #d1d5db",
                  backgroundColor: requestType === t.value ? "#dbeafe" : "#fff",
                  color: requestType === t.value ? "#1d4ed8" : "#374151",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: requestType === t.value ? "600" : "400",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Reason dropdown */}
        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              fontWeight: "600",
              marginBottom: "6px",
              fontSize: "14px",
            }}
          >
            Reason <span style={{ color: "#dc2626" }}>*</span>
          </label>
          {requestType && COMPLAINT_REASONS[requestType] ? (
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "14px",
                boxSizing: "border-box",
                marginBottom: "10px",
                backgroundColor: "#fff",
              }}
            >
              <option value="">-- Select reason --</option>
              {COMPLAINT_REASONS[requestType].map((r, idx) => (
                <option key={idx} value={r}>
                  {r}
                </option>
              ))}
            </select>
          ) : (
            <p
              style={{
                fontSize: "13px",
                color: "#6b7280",
                marginBottom: "10px",
              }}
            >
              Please select a request type first
            </p>
          )}
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Add more details (optional)..."
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "14px",
              resize: "vertical",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Image upload */}
        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              fontWeight: "600",
              marginBottom: "6px",
              fontSize: "14px",
            }}
          >
            Images / Proof Link{" "}
            <span style={{ color: "#dc2626" }}>*</span>
          </label>

          {/* File upload */}
          <div
            style={{
              border: "2px dashed #d1d5db",
              borderRadius: "8px",
              padding: "16px",
              textAlign: "center",
              marginBottom: "12px",
              backgroundColor: "#f9fafb",
            }}
          >
            <p
              style={{
                fontSize: "13px",
                color: "#6b7280",
                margin: "0 0 8px 0",
              }}
            >
              Upload images directly from your device (maximum 10MB per image)
            </p>
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              multiple
              onChange={handleImageUpload}
              disabled={uploadingImage}
              style={{ fontSize: "13px" }}
            />
            {uploadingImage && (
              <p
                style={{ fontSize: "13px", color: "#3b82f6", marginTop: "8px" }}
              >
                Uploading images...
              </p>
            )}
          </div>

          {/* Preview uploaded images */}
          {uploadedImages.length > 0 && (
            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                marginBottom: "12px",
              }}
            >
              {uploadedImages.map((url, idx) => (
                <div
                  key={idx}
                  style={{
                    position: "relative",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    overflow: "hidden",
                  }}
                >
                  <img
                    src={url}
                    alt={`Upload ${idx + 1}`}
                    style={{
                      width: "80px",
                      height: "80px",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    style={{
                      position: "absolute",
                      top: "-4px",
                      right: "-4px",
                      background: "#ef4444",
                      color: "#fff",
                      border: "none",
                      borderRadius: "50%",
                      width: "20px",
                      height: "20px",
                      cursor: "pointer",
                      fontSize: "12px",
                      lineHeight: "20px",
                      textAlign: "center",
                      padding: 0,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Manual URL fallback */}
          <p
            style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}
          >
            Or enter an external image/video link:
          </p>
          <input
            value={mediaUrl}
            onChange={(e) => setMediaUrl(e.target.value)}
            placeholder="https://..."
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "14px",
              boxSizing: "border-box",
            }}
          />
        </div>

        {error && (
          <div
            style={{
              color: "#dc2626",
              backgroundColor: "#fee2e2",
              padding: "10px 14px",
              borderRadius: "8px",
              marginBottom: "16px",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: "12px" }}>
          <button
            type="submit"
            disabled={submitting || orderItems.length === 0}
            style={{
              padding: "12px 24px",
              backgroundColor: submitting ? "#9ca3af" : "#3b82f6",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontWeight: "600",
              fontSize: "15px",
              cursor: submitting ? "not-allowed" : "pointer",
            }}
          >
            {submitting ? "Submitting..." : "Submit Complaint"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/complaints")}
            style={{
              padding: "12px 24px",
              backgroundColor: "#f3f4f6",
              color: "#374151",
              border: "none",
              borderRadius: "8px",
              fontWeight: "600",
              fontSize: "15px",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}