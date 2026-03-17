import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";

const API = "https://myspectra.runasp.net/api/Complaints";

const requestTypes = [
  { value: "complaint", label: "Khiếu nại" },
  { value: "return", label: "Trả hàng" },
  { value: "exchange", label: "Đổi hàng" },
  { value: "refund", label: "Hoàn tiền" },
  { value: "warranty", label: "Bảo hành" },
];

export default function ComplaintEdit() {
  const { id } = useParams();
  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  const [requestType, setRequestType] = useState("");
  const [reason, setReason] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const token = user?.token || JSON.parse(localStorage.getItem("user"))?.token;

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    const fetchComplaint = async () => {
      try {
        const res = await fetch(`${API}/${id}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (!(data.canModify || data.CanModify)) {
            navigate(`/complaints/${id}`);
            return;
          }
          setRequestType(data.requestType || data.RequestType || "");
          setReason(data.reason || data.Reason || "");
          setMediaUrl(data.mediaUrl || data.MediaUrl || "");
        } else {
          setError("Không thể tải dữ liệu.");
        }
      } catch {
        setError("Lỗi kết nối.");
      }
      setLoading(false);
    };
    fetchComplaint();
  }, [id, token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          requestType: requestType || undefined,
          reason: reason.trim() || undefined,
          mediaUrl: mediaUrl.trim() || undefined,
        }),
      });
      if (res.ok) {
        navigate(`/complaints/${id}`);
      } else {
        const err = await res.json();
        setError(err.message || err.Message || "Cập nhật thất bại.");
      }
    } catch {
      setError("Lỗi kết nối.");
    }
    setSubmitting(false);
  };

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: "60px", color: "#666" }}>
        Đang tải...
      </div>
    );

  return (
    <div
      style={{
        maxWidth: "700px",
        margin: "40px auto",
        padding: "20px",
        fontFamily: "sans-serif",
      }}
    >
      <h2 style={{ marginBottom: "24px" }}>Chỉnh sửa khiếu nại</h2>
      <form
        onSubmit={handleSubmit}
        style={{
          backgroundColor: "#fff",
          padding: "30px",
          borderRadius: "12px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
        }}
      >
        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              fontWeight: "600",
              marginBottom: "6px",
              fontSize: "14px",
            }}
          >
            Loại yêu cầu
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

        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              fontWeight: "600",
              marginBottom: "6px",
              fontSize: "14px",
            }}
          >
            Lý do
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
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

        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              fontWeight: "600",
              marginBottom: "6px",
              fontSize: "14px",
            }}
          >
            Link hình ảnh/video
          </label>
          <input
            value={mediaUrl}
            onChange={(e) => setMediaUrl(e.target.value)}
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
            disabled={submitting}
            style={{
              padding: "12px 24px",
              backgroundColor: "#3b82f6",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontWeight: "600",
              cursor: submitting ? "not-allowed" : "pointer",
            }}
          >
            {submitting ? "Đang lưu..." : "Cập nhật"}
          </button>
          <button
            type="button"
            onClick={() => navigate(`/complaints/${id}`)}
            style={{
              padding: "12px 24px",
              backgroundColor: "#f3f4f6",
              color: "#374151",
              border: "none",
              borderRadius: "8px",
              fontWeight: "600",
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
