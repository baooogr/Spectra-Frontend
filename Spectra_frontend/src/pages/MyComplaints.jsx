import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import "./MyComplaints.css";

const API = "https://myspectra.runasp.net/api/Complaints";

const statusMap = {
  pending: { text: "Chờ xử lý", color: "#d97706", bg: "#fef3c7" },
  under_review: { text: "Đang xem xét", color: "#6366f1", bg: "#e0e7ff" },
  approved: { text: "Đã duyệt", color: "#059669", bg: "#d1fae5" },
  rejected: { text: "Từ chối", color: "#dc2626", bg: "#fee2e2" },
  in_progress: { text: "Đang xử lý", color: "#3b82f6", bg: "#dbeafe" },
  resolved: { text: "Đã giải quyết", color: "#10b981", bg: "#d1fae5" },
  cancelled: { text: "Đã huỷ", color: "#6b7280", bg: "#f3f4f6" },
  customer_cancelled: { text: "Bạn đã rút", color: "#9333ea", bg: "#f3e8ff" },
};

const typeMap = {
  return: "Trả hàng",
  exchange: "Đổi hàng",
  refund: "Hoàn tiền",
  complaint: "Khiếu nại",
  warranty: "Bảo hành",
};

export default function MyComplaints() {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    const token =
      user?.token || JSON.parse(localStorage.getItem("user"))?.token;
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchComplaints = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API}/my?page=1&pageSize=100`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setComplaints(data.items || data.Items || []);
        } else {
          setError("Không thể tải danh sách khiếu nại.");
        }
      } catch {
        setError("Lỗi kết nối. Vui lòng thử lại.");
      }
      setLoading(false);
    };
    fetchComplaints();
  }, [user, navigate]);

  const filtered =
    activeFilter === "all"
      ? complaints
      : complaints.filter(
          (c) => (c.status || c.Status || "").toLowerCase() === activeFilter,
        );

  const getStatusBadge = (status, cancelledByCustomer) => {
    let s = (status || "").toLowerCase();
    if (s === "cancelled" && cancelledByCustomer) s = "customer_cancelled";
    const info = statusMap[s] || {
      text: status || "?",
      color: "#6b7280",
      bg: "#f3f4f6",
    };
    return (
      <span
        style={{
          fontWeight: "600",
          color: info.color,
          backgroundColor: info.bg,
          padding: "3px 12px",
          borderRadius: "20px",
          fontSize: "13px",
        }}
      >
        {info.text}
      </span>
    );
  };

  if (loading) return <div className="mc-loading">Đang tải khiếu nại...</div>;
  if (error) return <div className="mc-error">{error}</div>;

  return (
    <div className="mc-container">
      <div className="mc-header">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div>
            <h2 style={{ margin: 0 }}>Yêu cầu đổi hàng</h2>
            <p style={{ color: "#6b7280", fontSize: "14px", marginTop: "4px" }}>
              Quản lý các yêu cầu đổi hàng của bạn
            </p>
          </div>
          <Link
            to="/orders"
            style={{
              padding: "10px 20px",
              background: "#111827",
              color: "#fff",
              borderRadius: "6px",
              textDecoration: "none",
              fontWeight: "bold",
              fontSize: "14px",
            }}
          >
            Xem đơn hàng để đổi hàng
          </Link>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="mc-filters">
        {[
          { key: "all", label: "Tất cả" },
          { key: "pending", label: "Chờ xử lý" },
          { key: "under_review", label: "Đang xem xét" },
          { key: "approved", label: "Đã duyệt" },
          { key: "in_progress", label: "Đang xử lý" },
          { key: "resolved", label: "Đã giải quyết" },
          { key: "cancelled", label: "Đã huỷ" },
        ].map((f) => (
          <button
            key={f.key}
            className={`mc-filter-btn ${activeFilter === f.key ? "active" : ""}`}
            onClick={() => setActiveFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Complaint list */}
      {filtered.length === 0 ? (
        <div className="mc-empty">
          <p>Chưa có khiếu nại nào.</p>
          <Link to="/orders" style={{ color: "#3b82f6" }}>
            Xem đơn hàng →
          </Link>
        </div>
      ) : (
        <div className="mc-list">
          {filtered.map((c) => {
            const id = c.requestId || c.RequestId;
            const type = c.requestType || c.RequestType || "";
            const status = c.status || c.Status || "";
            const reason = c.reason || c.Reason || "";
            const date = c.createdAt || c.CreatedAt;
            const canModify = c.canModify || c.CanModify;
            const staffNote = c.staffNote || c.StaffNote;

            return (
              <div key={id} className="mc-card">
                <div className="mc-card-top">
                  <div>
                    <span className="mc-type-badge">
                      {typeMap[type.toLowerCase()] || type}
                    </span>
                    {getStatusBadge(
                      status,
                      c.cancelledByCustomer || c.CancelledByCustomer,
                    )}
                  </div>
                  <span className="mc-date">
                    {date ? new Date(date).toLocaleDateString("vi-VN") : ""}
                  </span>
                </div>

                <p className="mc-reason">
                  {reason.length > 120 ? reason.slice(0, 120) + "..." : reason}
                </p>

                {staffNote && (
                  <div className="mc-staff-note">
                    <strong>Ghi chú nhân viên:</strong> {staffNote}
                  </div>
                )}

                <div className="mc-card-actions">
                  <Link to={`/complaints/${id}`} className="mc-detail-link">
                    Xem chi tiết →
                  </Link>
                  {canModify && (
                    <Link
                      to={`/complaints/${id}/edit`}
                      className="mc-edit-link"
                    >
                      Chỉnh sửa
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
