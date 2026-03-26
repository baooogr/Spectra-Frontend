import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import "./MyComplaints.css";

const API_BASE = "https://myspectra.runasp.net/api";

const requestTypes = [
  { value: "complaint", label: "Khiếu nại (Phản hồi nhẹ)" },
  { value: "return", label: "Trả hàng" },
  { value: "exchange", label: "Đổi hàng" },
  { value: "refund", label: "Hoàn tiền" },
  { value: "warranty", label: "Bảo hành" },
];

export default function ComplaintForm() {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedOrderItemId = searchParams.get("orderItemId") || "";

  const [orders, setOrders] = useState([]);
  const [selectedOrderItemId, setSelectedOrderItemId] = useState(
    preselectedOrderItemId,
  );
  const [requestType, setRequestType] = useState("complaint");
  const [reason, setReason] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);

  const token = user?.token || JSON.parse(localStorage.getItem("user"))?.token;

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
      setError("Vui lòng chọn sản phẩm cần khiếu nại.");
      return;
    }
    if (!reason.trim()) {
      setError("Vui lòng nhập lý do.");
      return;
    }

    setSubmitting(true);
    try {
      // Combine uploaded image URLs with manually entered URL
      const allUrls = [...uploadedImages];
      if (mediaUrl.trim()) allUrls.push(mediaUrl.trim());
      const combinedMediaUrl = allUrls.length > 0 ? allUrls.join(",") : null;

      const res = await fetch(`${API_BASE}/Complaints`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderItemId: selectedOrderItemId,
          requestType,
          reason: reason.trim(),
          mediaUrl: combinedMediaUrl,
        }),
      });

      if (res.ok || res.status === 201) {
        const data = await res.json();
        navigate(`/complaints/${data.requestId || data.RequestId}`);
      } else {
        const err = await res.json();
        setError(err.message || err.Message || "Không thể tạo khiếu nại.");
      }
    } catch {
      setError("Lỗi kết nối. Vui lòng thử lại.");
    }
    setSubmitting(false);
  };

  if (loading) return <div className="mc-loading">Đang tải...</div>;

  // Flatten all order items from delivered orders (including preorder-converted)
  const orderItems = orders.flatMap((o) => {
    const items = o.items || o.orderItems || o.OrderItems || [];
    const isFromPreorder = !!(
      o.convertedFromPreorderId || o.ConvertedFromPreorderId
    );
    const preorderId =
      o.convertedFromPreorderId || o.ConvertedFromPreorderId || null;
    return items.map((item) => ({
      ...item,
      orderId: o.orderId || o.OrderId,
      orderDate: o.createdAt || o.CreatedAt || o.orderDate || o.OrderDate,
      isFromPreorder,
      preorderId,
    }));
  });

  return (
    <div
      style={{
        maxWidth: "700px",
        margin: "40px auto",
        padding: "20px",
        fontFamily: "sans-serif",
      }}
    >
      <h2 style={{ marginBottom: "8px" }}>Tạo khiếu nại mới</h2>
      <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "24px" }}>
        Chọn sản phẩm từ đơn hàng hoặc đơn đặt trước đã giao và mô tả vấn đề của
        bạn.
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
            Sản phẩm cần khiếu nại <span style={{ color: "#dc2626" }}>*</span>
          </label>
          {orderItems.length === 0 ? (
            <p
              style={{
                color: "#d97706",
                fontSize: "14px",
                backgroundColor: "#fef3c7",
                padding: "12px",
                borderRadius: "8px",
              }}
            >
              Bạn chưa có đơn hàng đã giao nào. Chỉ có thể khiếu nại với đơn
              hàng hoặc đơn đặt trước đã giao.
            </p>
          ) : (
            <select
              value={selectedOrderItemId}
              onChange={(e) => setSelectedOrderItemId(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            >
              <option value="">-- Chọn sản phẩm --</option>
              {orderItems.map((item) => {
                const itemId = item.orderItemId || item.OrderItemId;
                const name =
                  item.frameName || item.productName || item.name || "Sản phẩm";
                const color = item.colorName || item.color || "";
                const orderLabel =
                  item.isFromPreorder && item.preorderId
                    ? `Đặt trước #${String(item.preorderId).slice(0, 8)}`
                    : `Đơn #${String(item.orderId).slice(0, 8)}`;
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
            Loại yêu cầu <span style={{ color: "#dc2626" }}>*</span>
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

        {/* Reason */}
        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              fontWeight: "600",
              marginBottom: "6px",
              fontSize: "14px",
            }}
          >
            Lý do <span style={{ color: "#dc2626" }}>*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            placeholder="Mô tả chi tiết vấn đề bạn gặp phải..."
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
            Hình ảnh minh chứng (tuỳ chọn)
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
              Tải ảnh trực tiếp từ thiết bị (tối đa 10MB mỗi ảnh)
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
                Đang tải ảnh lên...
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
            Hoặc nhập link ảnh/video bên ngoài:
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
            {submitting ? "Đang gửi..." : "Gửi khiếu nại"}
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
            Huỷ
          </button>
        </div>
      </form>
    </div>
  );
}
