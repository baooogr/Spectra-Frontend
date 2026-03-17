import React, { useState, useEffect, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
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
};

const typeMap = {
  return: "Trả hàng",
  exchange: "Đổi hàng",
  refund: "Hoàn tiền",
  complaint: "Khiếu nại",
  warranty: "Bảo hành",
};

const statusFlow = [
  "pending",
  "under_review",
  "approved",
  "in_progress",
  "resolved",
];

const flowDescriptions = {
  exchange: [
    "Gửi yêu cầu đổi hàng",
    "Nhân viên xem xét yêu cầu",
    "Yêu cầu được duyệt — Chọn sản phẩm thay thế",
    "Đang xử lý đổi hàng — Gửi trả sản phẩm cũ",
    "Hoàn tất đổi hàng",
  ],
  return: [
    "Gửi yêu cầu trả hàng",
    "Nhân viên xem xét yêu cầu",
    "Yêu cầu được duyệt — Chờ hướng dẫn trả hàng",
    "Gửi trả sản phẩm — Chờ hoàn tiền",
    "Hoàn tất trả hàng & hoàn tiền",
  ],
  refund: [
    "Gửi yêu cầu hoàn tiền",
    "Nhân viên xem xét yêu cầu",
    "Yêu cầu được duyệt",
    "Đang xử lý hoàn tiền",
    "Hoàn tiền thành công",
  ],
  warranty: [
    "Gửi yêu cầu bảo hành",
    "Nhân viên xem xét yêu cầu",
    "Yêu cầu được duyệt — Chờ hướng dẫn gửi hàng",
    "Đang sửa chữa / thay thế sản phẩm",
    "Hoàn tất bảo hành",
  ],
  complaint: [
    "Gửi khiếu nại",
    "Nhân viên xem xét",
    "Khiếu nại được duyệt",
    "Đang xử lý",
    "Đã giải quyết",
  ],
};

const fmt = (n) => n?.toLocaleString("vi-VN") ?? "—";

export default function ComplaintDetail() {
  const { id } = useParams();
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = user?.token || JSON.parse(localStorage.getItem("user"))?.token;

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchDetail();
  }, [id, token]);

  const fetchDetail = async () => {
    try {
      const res = await fetch(`${API}/${id}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) setComplaint(await res.json());
      else if (res.status === 404) setError("Không tìm thấy khiếu nại này.");
      else if (res.status === 403)
        setError("Bạn không có quyền xem khiếu nại này.");
      else setError("Có lỗi xảy ra khi tải dữ liệu.");
    } catch {
      setError("Lỗi kết nối. Vui lòng thử lại.");
    }
    setLoading(false);
  };

  if (loading) return <div className="mc-loading">Đang tải...</div>;
  if (error)
    return (
      <div style={{ textAlign: "center", padding: "60px" }}>
        <h2 style={{ color: "#dc2626" }}>{error}</h2>
        <Link to="/profile" style={{ color: "#3b82f6" }}>
          ← Quay lại
        </Link>
      </div>
    );
  if (!complaint) return null;

  const status = (complaint.status || "").toLowerCase();
  const type = (complaint.requestType || "").toLowerCase();
  const reason = complaint.reason || "";
  const mediaUrl = complaint.mediaUrl;
  const date = complaint.createdAt;
  const staffNote = complaint.staffNote;
  const canModify = complaint.canModify;
  const exchangeOrderId = complaint.exchangeOrderId;
  const reqId = complaint.requestId;
  const originalItem = complaint.originalItem;
  const refundAmount = complaint.refundAmount;
  const returnTrackingNumber = complaint.returnTrackingNumber;
  const refundedAt = complaint.refundedAt;

  const sInfo = statusMap[status] || {
    text: status,
    color: "#6b7280",
    bg: "#f3f4f6",
  };
  const currentStep =
    status === "rejected" || status === "cancelled"
      ? -1
      : statusFlow.indexOf(status);
  const flowSteps = flowDescriptions[type] || flowDescriptions.complaint;

  return (
    <div
      style={{
        maxWidth: "850px",
        margin: "40px auto",
        padding: "20px",
        fontFamily: "sans-serif",
      }}
    >
      <Link
        to="/profile"
        style={{
          color: "#6b7280",
          textDecoration: "none",
          fontSize: "14px",
          display: "inline-block",
          marginBottom: "20px",
        }}
      >
        ← Quay lại trang cá nhân
      </Link>

      <div
        style={{
          backgroundColor: "#fff",
          padding: "30px",
          borderRadius: "12px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            borderBottom: "2px solid #f3f4f6",
            paddingBottom: "18px",
            marginBottom: "24px",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: "22px" }}>
              {typeMap[type] || "Khiếu nại"} — Chi Tiết
            </h2>
            <p
              style={{ margin: "6px 0 0", color: "#6b7280", fontSize: "14px" }}
            >
              Mã:{" "}
              <b style={{ color: "#111827" }}>#{String(reqId).slice(0, 8)}</b>
              {" · "}
              {date ? new Date(date).toLocaleString("vi-VN") : ""}
            </p>
          </div>
          <span
            style={{
              fontWeight: "bold",
              color: sInfo.color,
              backgroundColor: sInfo.bg,
              padding: "6px 16px",
              borderRadius: "20px",
              fontSize: "14px",
            }}
          >
            {sInfo.text}
          </span>
        </div>

        {/* Progress bar with type-specific labels */}
        {currentStep >= 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              marginBottom: "28px",
            }}
          >
            {statusFlow.map((s, i) => {
              const reached = i <= currentStep;
              return (
                <React.Fragment key={s}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      flex: "0 0 auto",
                    }}
                  >
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        backgroundColor: reached ? "#3b82f6" : "#e5e7eb",
                        color: reached ? "#fff" : "#9ca3af",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "13px",
                        fontWeight: "bold",
                      }}
                    >
                      {reached ? "✓" : i + 1}
                    </div>
                    <span
                      style={{
                        fontSize: "11px",
                        color: reached ? "#3b82f6" : "#9ca3af",
                        marginTop: "4px",
                        textAlign: "center",
                        maxWidth: "90px",
                      }}
                    >
                      {flowSteps[i]}
                    </span>
                  </div>
                  {i < statusFlow.length - 1 && (
                    <div
                      style={{
                        flex: 1,
                        height: "3px",
                        backgroundColor:
                          i < currentStep ? "#3b82f6" : "#e5e7eb",
                        margin: "0 4px",
                        marginTop: "13px",
                      }}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}

        {(status === "rejected" || status === "cancelled") && (
          <div
            style={{
              backgroundColor: status === "rejected" ? "#fee2e2" : "#f3f4f6",
              color: status === "rejected" ? "#dc2626" : "#6b7280",
              padding: "12px 16px",
              borderRadius: "8px",
              marginBottom: "20px",
              fontSize: "14px",
              fontWeight: "600",
            }}
          >
            {status === "rejected"
              ? "Yêu cầu đã bị từ chối"
              : "Yêu cầu đã bị huỷ"}
          </div>
        )}

        {/* Original item info */}
        {originalItem && (
          <div
            style={{
              marginBottom: "20px",
              padding: "18px",
              backgroundColor: "#faf5ff",
              borderRadius: "10px",
              border: "1px solid #e9d5ff",
            }}
          >
            <h4
              style={{
                marginTop: 0,
                marginBottom: "10px",
                color: "#7c3aed",
                fontSize: "15px",
              }}
            >
              Sản phẩm gốc
            </h4>
            <div
              style={{
                display: "flex",
                gap: "16px",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              {originalItem.imageUrl && (
                <img
                  src={originalItem.imageUrl}
                  alt={originalItem.frameName}
                  style={{
                    width: "80px",
                    height: "80px",
                    objectFit: "cover",
                    borderRadius: "8px",
                    border: "1px solid #e9d5ff",
                  }}
                />
              )}
              <div>
                <p style={{ margin: "4px 0", fontSize: "14px" }}>
                  <b>Tên:</b> {originalItem.frameName || "—"}
                </p>
                <p style={{ margin: "4px 0", fontSize: "14px" }}>
                  <b>Giá:</b> {fmt(originalItem.unitPrice)}$
                </p>
                <p style={{ margin: "4px 0", fontSize: "14px" }}>
                  <b>Số lượng:</b> {originalItem.quantity || 1}
                </p>
                {originalItem.selectedSize && (
                  <p style={{ margin: "4px 0", fontSize: "14px" }}>
                    <b>Kích thước:</b> {originalItem.selectedSize}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Reason */}
        <div
          style={{
            marginBottom: "20px",
            padding: "18px",
            backgroundColor: "#fff7ed",
            borderRadius: "10px",
            border: "1px solid #fed7aa",
          }}
        >
          <h4
            style={{
              marginTop: 0,
              marginBottom: "8px",
              color: "#9a3412",
              fontSize: "15px",
            }}
          >
            Lý do
          </h4>
          <p
            style={{
              margin: 0,
              fontSize: "14px",
              color: "#374151",
              whiteSpace: "pre-wrap",
            }}
          >
            {reason}
          </p>
        </div>

        {/* Media */}
        {mediaUrl && (
          <div style={{ marginBottom: "20px" }}>
            <h4
              style={{
                marginBottom: "8px",
                fontSize: "15px",
                color: "#374151",
              }}
            >
              Hình ảnh/Video đính kèm
            </h4>
            <a
              href={mediaUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#3b82f6" }}
            >
              Xem tệp đính kèm →
            </a>
          </div>
        )}

        {/* Staff note */}
        {staffNote && (
          <div
            style={{
              marginBottom: "20px",
              padding: "16px",
              backgroundColor: "#eff6ff",
              borderRadius: "10px",
              border: "1px solid #bfdbfe",
            }}
          >
            <h4
              style={{
                marginTop: 0,
                marginBottom: "8px",
                color: "#1e40af",
                fontSize: "15px",
              }}
            >
              Ghi chú từ nhân viên
            </h4>
            <p
              style={{
                margin: 0,
                fontSize: "14px",
                color: "#1e3a8a",
                whiteSpace: "pre-wrap",
              }}
            >
              {staffNote}
            </p>
          </div>
        )}

        {/* === TYPE-SPECIFIC FLOW SECTIONS === */}

        {/* EXCHANGE (Đổi hàng) */}
        {type === "exchange" && (
          <div
            style={{
              marginBottom: "20px",
              padding: "18px",
              backgroundColor: "#f0f9ff",
              borderRadius: "10px",
              border: "1px solid #bae6fd",
            }}
          >
            <h4
              style={{
                marginTop: 0,
                marginBottom: "12px",
                color: "#0369a1",
                fontSize: "15px",
              }}
            >
              Thông tin Đổi hàng
            </h4>
            {exchangeOrderId ? (
              <div>
                <p
                  style={{
                    margin: "4px 0",
                    fontSize: "14px",
                    color: "#065f46",
                  }}
                >
                  ✅ Đơn đổi hàng đã được tạo
                </p>
                <Link
                  to={`/orders/${exchangeOrderId}`}
                  style={{
                    display: "inline-block",
                    marginTop: "8px",
                    padding: "8px 16px",
                    backgroundColor: "#0ea5e9",
                    color: "#fff",
                    borderRadius: "6px",
                    textDecoration: "none",
                    fontWeight: "600",
                    fontSize: "14px",
                  }}
                >
                  Xem đơn hàng thay thế →
                </Link>
              </div>
            ) : status === "approved" || status === "in_progress" ? (
              <div>
                <p
                  style={{
                    margin: "0 0 12px",
                    fontSize: "14px",
                    color: "#374151",
                  }}
                >
                  Yêu cầu đổi hàng đã được duyệt. Bạn có thể chọn sản phẩm thay
                  thế ngay bây giờ.
                </p>
                <Link
                  to={`/complaints/${reqId}/exchange`}
                  style={{
                    display: "inline-block",
                    padding: "10px 22px",
                    backgroundColor: "#2563eb",
                    color: "#fff",
                    borderRadius: "8px",
                    textDecoration: "none",
                    fontWeight: "bold",
                    fontSize: "14px",
                  }}
                >
                  Chọn sản phẩm thay thế →
                </Link>
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: "14px", color: "#6b7280" }}>
                {status === "pending" || status === "under_review"
                  ? "Vui lòng chờ nhân viên xem xét và duyệt yêu cầu đổi hàng."
                  : "Quy trình đổi hàng đã kết thúc."}
              </p>
            )}
          </div>
        )}

        {/* RETURN (Trả hàng) */}
        {type === "return" && (
          <div
            style={{
              marginBottom: "20px",
              padding: "18px",
              backgroundColor: "#fefce8",
              borderRadius: "10px",
              border: "1px solid #fde68a",
            }}
          >
            <h4
              style={{
                marginTop: 0,
                marginBottom: "12px",
                color: "#92400e",
                fontSize: "15px",
              }}
            >
              Thông tin Trả hàng
            </h4>
            {returnTrackingNumber ? (
              <div style={{ marginBottom: "12px" }}>
                <p style={{ margin: "4px 0", fontSize: "14px" }}>
                  <b>Mã vận đơn trả hàng:</b>{" "}
                  <span style={{ color: "#1d4ed8", fontWeight: 600 }}>
                    {returnTrackingNumber}
                  </span>
                </p>
                
              </div>
            ) : status === "approved" || status === "in_progress" ? (
              <p
                style={{
                  margin: "0 0 12px",
                  fontSize: "14px",
                  color: "#374151",
                }}
              >
                Yêu cầu đã được duyệt. Vui lòng chờ nhân viên cung cấp mã vận
                đơn trả hàng.
              </p>
            ) : (
              <p
                style={{
                  margin: "0 0 12px",
                  fontSize: "14px",
                  color: "#6b7280",
                }}
              >
                {status === "pending" || status === "under_review"
                  ? "Đang chờ xem xét."
                  : ""}
              </p>
            )}
            {refundAmount != null && refundAmount > 0 && (
              <div
                style={{
                  padding: "12px",
                  backgroundColor: "#d1fae5",
                  borderRadius: "8px",
                }}
              >
                <p
                  style={{
                    margin: "0 0 4px",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#065f46",
                  }}
                >
                  Số tiền sẽ hoàn: {fmt(refundAmount)}$
                </p>
                {refundedAt && (
                  <p style={{ margin: 0, fontSize: "13px", color: "#047857" }}>
                    Nhân viên sẽ liên hệ với bạn qua số điện thoại hoặc email để hỗ trợ hoàn tiền.
                    
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* REFUND (Hoàn tiền) */}
        {type === "refund" && (
          <div
            style={{
              marginBottom: "20px",
              padding: "18px",
              backgroundColor: "#ecfdf5",
              borderRadius: "10px",
              border: "1px solid #a7f3d0",
            }}
          >
            <h4
              style={{
                marginTop: 0,
                marginBottom: "12px",
                color: "#065f46",
                fontSize: "15px",
              }}
            >
              Thông tin Hoàn tiền
            </h4>
            {refundAmount != null && refundAmount > 0 ? (
              <div>
                <p
                  style={{
                    margin: "4px 0",
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "#059669",
                  }}
                >
                  {fmt(refundAmount)}₫
                </p>
                {refundedAt ? (
                  <p
                    style={{
                      margin: "4px 0",
                      fontSize: "13px",
                      color: "#047857",
                    }}
                  >
                    ✅ Đã hoàn tiền ngày{" "}
                    {new Date(refundedAt).toLocaleString("vi-VN")}
                  </p>
                ) : (
                  <p
                    style={{
                      margin: "4px 0",
                      fontSize: "13px",
                      color: "#92400e",
                    }}
                  >
                    ⏳ Đang xử lý hoàn tiền...
                  </p>
                )}
              </div>
            ) : status === "approved" || status === "in_progress" ? (
              <p style={{ margin: 0, fontSize: "14px", color: "#374151" }}>
                Yêu cầu đã được duyệt. Nhân viên sẽ xử lý hoàn tiền cho bạn sớm
                nhất.
              </p>
            ) : (
              <p style={{ margin: 0, fontSize: "14px", color: "#6b7280" }}>
                {status === "pending" || status === "under_review"
                  ? "Đang chờ nhân viên xem xét yêu cầu hoàn tiền."
                  : "Quy trình hoàn tiền đã kết thúc."}
              </p>
            )}
          </div>
        )}

        {/* WARRANTY (Bảo hành) */}
        {type === "warranty" && (
          <div
            style={{
              marginBottom: "20px",
              padding: "18px",
              backgroundColor: "#f0fdf4",
              borderRadius: "10px",
              border: "1px solid #bbf7d0",
            }}
          >
            <h4
              style={{
                marginTop: 0,
                marginBottom: "12px",
                color: "#166534",
                fontSize: "15px",
              }}
            >
              Thông tin Bảo hành
            </h4>
            {returnTrackingNumber ? (
              <div style={{ marginBottom: "12px" }}>
                <p style={{ margin: "4px 0", fontSize: "14px" }}>
                  <b>Mã vận đơn gửi bảo hành:</b>{" "}
                  <span style={{ color: "#1d4ed8", fontWeight: 600 }}>
                    {returnTrackingNumber}
                  </span>
                </p>
                <p
                  style={{
                    margin: "4px 0",
                    fontSize: "13px",
                    color: "#6b7280",
                  }}
                >
                  Hãy gửi sản phẩm về trung tâm bảo hành theo mã vận đơn phía
                  trên.
                </p>
              </div>
            ) : status === "approved" || status === "in_progress" ? (
              <p
                style={{
                  margin: "0 0 12px",
                  fontSize: "14px",
                  color: "#374151",
                }}
              >
                Yêu cầu bảo hành đã được duyệt. Vui lòng chờ nhân viên cung cấp
                mã vận đơn để gửi sản phẩm.
              </p>
            ) : (
              <p style={{ margin: 0, fontSize: "14px", color: "#6b7280" }}>
                {status === "pending" || status === "under_review"
                  ? "Đang chờ xem xét yêu cầu bảo hành."
                  : "Quy trình bảo hành đã kết thúc."}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginTop: "20px",
            flexWrap: "wrap",
          }}
        >
          {canModify && (
            <Link
              to={`/complaints/${reqId}/edit`}
              style={{
                padding: "10px 20px",
                backgroundColor: "#3b82f6",
                color: "#fff",
                borderRadius: "8px",
                textDecoration: "none",
                fontWeight: "600",
                fontSize: "14px",
              }}
            >
              Chỉnh sửa khiếu nại
            </Link>
          )}
          <Link
            to="/profile"
            style={{
              padding: "10px 20px",
              backgroundColor: "#f3f4f6",
              color: "#374151",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: "600",
              fontSize: "14px",
            }}
          >
            Quay lại trang cá nhân
          </Link>
        </div>
      </div>
    </div>
  );
}
