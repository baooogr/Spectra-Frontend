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
          mediaUrl: mediaUrl.trim() || null,
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

  // Flatten all order items from delivered orders
  const orderItems = orders.flatMap((o) => {
    const items = o.items || o.orderItems || o.OrderItems || [];
    return items.map((item) => ({
      ...item,
      orderId: o.orderId || o.OrderId,
      orderDate: o.createdAt || o.CreatedAt || o.orderDate || o.OrderDate,
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
        Chọn sản phẩm từ đơn hàng đã giao và mô tả vấn đề của bạn.
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
              hàng đã giao.
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
                return (
                  <option key={itemId} value={itemId}>
                    {name} {color ? `(${color})` : ""} — Đơn #
                    {String(item.orderId).slice(0, 8)}
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

        {/* Media URL */}
        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              fontWeight: "600",
              marginBottom: "6px",
              fontSize: "14px",
            }}
          >
            Link hình ảnh/video (tuỳ chọn)
          </label>
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
          <p style={{ fontSize: "12px", color: "#9ca3af", marginTop: "4px" }}>
            Đính kèm link ảnh hoặc video để nhân viên hỗ trợ tốt hơn.
          </p>
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
