import React, { useState, useEffect, useContext } from "react";
import { UserContext } from "../context/UserContext";
import "./AdminComplaints.css";

const API = "https://myspectra.runasp.net/api/Complaints";
const API_ORDERS = "https://myspectra.runasp.net/api/Orders";

const statusMap = {
  pending: { text: "Chờ xử lý", color: "#d97706", bg: "#fef3c7" },
  under_review: { text: "Đang xem xét", color: "#6366f1", bg: "#e0e7ff" },
  approved: { text: "Đã duyệt", color: "#059669", bg: "#d1fae5" },
  rejected: { text: "Từ chối", color: "#dc2626", bg: "#fee2e2" },
  in_progress: { text: "Đang xử lý", color: "#3b82f6", bg: "#dbeafe" },
  resolved: { text: "Đã giải quyết", color: "#10b981", bg: "#d1fae5" },
  cancelled: { text: "Đã huỷ", color: "#6b7280", bg: "#f3f4f6" },
  customer_cancelled: { text: "Khách đã hủy", color: "#9333ea", bg: "#f3e8ff" },
};

const typeMap = {
  return: "Trả hàng",
  exchange: "Đổi hàng",
  refund: "Hoàn tiền",
  complaint: "Khiếu nại",
  warranty: "Bảo hành",
};

// Valid transitions per the backend workflow
const validTransitions = {
  pending: ["under_review", "cancelled"],
  under_review: ["approved", "rejected"],
  approved: ["in_progress", "cancelled"],
  rejected: [],
  in_progress: ["resolved", "cancelled"],
  resolved: [],
  cancelled: [],
};

export default function AdminComplaints() {
  const { user } = useContext(UserContext);
  const token = user?.token || JSON.parse(localStorage.getItem("user"))?.token;

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal state
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [complaintDetail, setComplaintDetail] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [staffNote, setStaffNote] = useState("");
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");

  // Refund & tracking state
  const [refundAmount, setRefundAmount] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [actionMsg, setActionMsg] = useState("");

  // Sequential flags for complex complaint types
  const [trackingConfirmed, setTrackingConfirmed] = useState(false);
  const [refundConfirmed, setRefundConfirmed] = useState(false);

  // Exchange order detail
  const [exchangeOrderDetail, setExchangeOrderDetail] = useState(null);

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const fetchComplaints = async (statusFilter = "all", p = 1) => {
    setLoading(true);
    try {
      const url =
        statusFilter === "all"
          ? `${API}?page=${p}&pageSize=15`
          : `${API}/status/${statusFilter}?page=${p}&pageSize=15`;
      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        setComplaints(data.items || data.Items || []);
        setTotalPages(data.totalPages || data.TotalPages || 1);
        setPage(data.currentPage || data.CurrentPage || p);
      }
    } catch {
      /* ignore */
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchComplaints(activeFilter, 1);
  }, [activeFilter]);

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
  };

  const openStatusModal = async (complaint) => {
    setSelectedComplaint(complaint);
    setComplaintDetail(null);
    setExchangeOrderDetail(null);
    const status = (complaint.status || complaint.Status || "").toLowerCase();
    const transitions = validTransitions[status] || [];
    setNewStatus(transitions[0] || "");
    setStaffNote(complaint.staffNote || complaint.StaffNote || "");
    setUpdateError("");
    setRefundAmount("");
    setTrackingNumber("");
    setActionMsg("");

    // Check existing data to set flags
    const hasTracking = !!(
      complaint.returnTrackingNumber || complaint.ReturnTrackingNumber
    );
    const hasRefund = !!(complaint.refundAmount || complaint.RefundAmount);
    setTrackingConfirmed(hasTracking);
    setRefundConfirmed(hasRefund);

    // Fetch full complaint detail for exchange order info
    const cId = complaint.requestId || complaint.RequestId;
    try {
      const res = await fetch(`${API}/${cId}`, { headers });
      if (res.ok) {
        const detail = await res.json();
        setComplaintDetail(detail);

        // Update flags from detail
        setTrackingConfirmed(!!detail.returnTrackingNumber);
        setRefundConfirmed(!!(detail.refundAmount && detail.refundAmount > 0));

        // Fetch exchange order detail if exists
        if (detail.exchangeOrderId) {
          try {
            const orderRes = await fetch(
              `${API_ORDERS}/${detail.exchangeOrderId}`,
              { headers },
            );
            if (orderRes.ok) {
              setExchangeOrderDetail(await orderRes.json());
            }
          } catch {
            /* ignore */
          }
        }
      }
    } catch {
      /* ignore */
    }
  };

  const handleStatusUpdate = async () => {
    if (!newStatus) return;
    setUpdating(true);
    setUpdateError("");

    const cId = selectedComplaint.requestId || selectedComplaint.RequestId;
    try {
      const res = await fetch(`${API}/${cId}/status`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          status: newStatus,
          staffNote: staffNote.trim() || null,
        }),
      });
      if (res.ok) {
        setSelectedComplaint(null);
        fetchComplaints(activeFilter, page);
      } else {
        const err = await res.json();
        setUpdateError(err.message || err.Message || "Cập nhật thất bại.");
      }
    } catch {
      setUpdateError("Lỗi kết nối.");
    }
    setUpdating(false);
  };

  const handleProcessRefund = async () => {
    const amt = parseFloat(refundAmount);
    if (!amt || amt <= 0) {
      setUpdateError("Vui lòng nhập số tiền hoàn hợp lệ.");
      return;
    }
    setUpdating(true);
    setUpdateError("");
    const cId = selectedComplaint.requestId || selectedComplaint.RequestId;
    try {
      const res = await fetch(`${API}/${cId}/process-refund`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ refundAmount: amt }),
      });
      if (res.ok) {
        setActionMsg("✅ Đã thêm số tiền cần hoàn.");
        setRefundConfirmed(true);
        setRefundAmount("");
        fetchComplaints(activeFilter, page);
      } else {
        const err = await res.json().catch(() => null);
        setUpdateError(
          err?.message || err?.Message || "Xử lý hoàn tiền thất bại.",
        );
      }
    } catch {
      setUpdateError("Lỗi kết nối.");
    }
    setUpdating(false);
  };

  const handleSetTracking = async () => {
    if (!trackingNumber.trim()) {
      setUpdateError("Vui lòng nhập mã vận đơn.");
      return;
    }
    setUpdating(true);
    setUpdateError("");
    const cId = selectedComplaint.requestId || selectedComplaint.RequestId;
    try {
      const res = await fetch(`${API}/${cId}/return-tracking`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ trackingNumber: trackingNumber.trim() }),
      });
      if (res.ok) {
        setActionMsg("✅ Đã cập nhật mã vận đơn thành công.");
        setTrackingConfirmed(true);
        setTrackingNumber("");
        fetchComplaints(activeFilter, page);
      } else {
        const err = await res.json().catch(() => null);
        setUpdateError(
          err?.message || err?.Message || "Cập nhật mã vận đơn thất bại.",
        );
      }
    } catch {
      setUpdateError("Lỗi kết nối.");
    }
    setUpdating(false);
  };

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
        className="ac-badge"
        style={{ color: info.color, backgroundColor: info.bg }}
      >
        {info.text}
      </span>
    );
  };

  return (
    <div className="ac-container">
      <div className="ac-header">
        <h2>Quản lý Khiếu nại</h2>
        <p>Xử lý yêu cầu trả hàng, đổi hàng, bảo hành từ khách hàng</p>
      </div>

      {/* Filter tabs */}
      <div className="ac-filters">
        {[
          { key: "all", label: "Tất cả" },
          { key: "pending", label: "Chờ xử lý" },
          { key: "under_review", label: "Đang xem xét" },
          { key: "approved", label: "Đã duyệt" },
          { key: "in_progress", label: "Đang xử lý" },
          { key: "resolved", label: "Đã giải quyết" },
          { key: "rejected", label: "Từ chối" },
          { key: "cancelled", label: "Đã huỷ" },
        ].map((f) => (
          <button
            key={f.key}
            className={`ac-filter-btn ${activeFilter === f.key ? "active" : ""}`}
            onClick={() => handleFilterChange(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="ac-loading">Đang tải...</div>
      ) : complaints.length === 0 ? (
        <div className="ac-empty">Không có khiếu nại nào.</div>
      ) : (
        <>
          <div className="ac-table-wrapper">
            <table className="ac-table">
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Khách hàng</th>
                  <th>Loại</th>
                  <th>Lý do</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((c) => {
                  const cId = c.requestId || c.RequestId;
                  const userName =
                    c.userName ||
                    c.UserName ||
                    c.user?.fullName ||
                    c.User?.FullName ||
                    (c.userId || c.UserId
                      ? `#${String(c.userId || c.UserId).slice(0, 8)}`
                      : "—");
                  const userPhone =
                    c.userPhone ||
                    c.UserPhone ||
                    c.user?.phone ||
                    c.User?.Phone ||
                    "—";
                  const type = c.requestType || c.RequestType || "";
                  const reason = c.reason || c.Reason || "";
                  const mediaUrl = c.mediaUrl || c.MediaUrl || "";
                  const status = (c.status || c.Status || "").toLowerCase();
                  const date = c.createdAt || c.CreatedAt;
                  const transitions = validTransitions[status] || [];

                  return (
                    <tr key={cId}>
                      <td className="ac-id">#{String(cId).slice(0, 8)}</td>
                      <td>
                        <div style={{ fontWeight: "600" }}>{userName}</div>
                        <div style={{ fontSize: "12px", color: "#6b7280" }}>
                          {userPhone}
                        </div>
                      </td>
                      <td>
                        <span className="ac-type-tag">
                          {typeMap[type.toLowerCase()] || type}
                        </span>
                      </td>
                      <td className="ac-reason-cell">
                        {reason.length > 60
                          ? reason.slice(0, 60) + "..."
                          : reason}
                        {mediaUrl &&
                          (() => {
                            const urls = mediaUrl
                              .split(",")
                              .map((u) => u.trim())
                              .filter(Boolean);
                            const imageUrls = urls.filter(
                              (u) =>
                                /\.(jpg|jpeg|png|gif|webp)/i.test(u) ||
                                u.includes("cloudinary"),
                            );
                            const hasImages = imageUrls.length > 0;
                            return (
                              <div style={{ marginTop: "6px" }}>
                                {hasImages ? (
                                  <div
                                    style={{
                                      display: "flex",
                                      gap: "4px",
                                      flexWrap: "wrap",
                                    }}
                                  >
                                    {imageUrls.slice(0, 3).map((url, idx) => (
                                      <a
                                        key={idx}
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        <img
                                          src={url}
                                          alt={`" ${idx + 1}`}
                                          style={{
                                            width: "40px",
                                            height: "40px",
                                            objectFit: "cover",
                                            borderRadius: "4px",
                                            border: "1px solid #e5e7eb",
                                          }}
                                        />
                                      </a>
                                    ))}
                                    {imageUrls.length > 3 && (
                                      <span
                                        style={{
                                          fontSize: "11px",
                                          color: "#6b7280",
                                          alignSelf: "center",
                                        }}
                                      >
                                        +{imageUrls.length - 3}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <a
                                    href={urls[0]}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      fontSize: "12px",
                                      color: "#2563eb",
                                    }}
                                  >
                                    📎 Xem bằng chứng
                                  </a>
                                )}
                              </div>
                            );
                          })()}
                      </td>
                      <td>
                        {getStatusBadge(
                          status,
                          c.cancelledByCustomer || c.CancelledByCustomer,
                        )}
                      </td>
                      <td className="ac-date">
                        {date
                          ? new Date(date).toLocaleDateString("vi-VN")
                          : "—"}
                      </td>
                      <td>
                        {transitions.length > 0 ||
                        ((type.toLowerCase() === "return" ||
                          type.toLowerCase() === "refund" ||
                          type.toLowerCase() === "exchange" ||
                          type.toLowerCase() === "warranty") &&
                          (status === "approved" ||
                            status === "in_progress")) ? (
                          <button
                            className="ac-action-btn"
                            onClick={() => openStatusModal(c)}
                          >
                            Xử lý
                          </button>
                        ) : (
                          <span style={{ color: "#9ca3af", fontSize: "13px" }}>
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="ac-pagination">
              <button
                disabled={page <= 1}
                onClick={() => fetchComplaints(activeFilter, page - 1)}
              >
                ← Trước
              </button>
              <span>
                Trang {page}/{totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => fetchComplaints(activeFilter, page + 1)}
              >
                Tiếp →
              </button>
            </div>
          )}
        </>
      )}

      {/* Status update modal */}
      {selectedComplaint &&
        (() => {
          const cStatus = (
            selectedComplaint.status ||
            selectedComplaint.Status ||
            ""
          ).toLowerCase();
          const cType = (
            selectedComplaint.requestType ||
            selectedComplaint.RequestType ||
            ""
          ).toLowerCase();
          const transitions = validTransitions[cStatus] || [];

          // Determine which sections to show based on complaint type
          const needsTracking =
            (cType === "return" || cType === "warranty") &&
            (cStatus === "approved" || cStatus === "in_progress");
          const needsRefund =
            (cType === "return" || cType === "refund") &&
            (cStatus === "approved" || cStatus === "in_progress");
          const isExchange = cType === "exchange";

          // Sequential validation for complex types (return):
          // Step 1: Enter tracking number -> Step 2: Enter refund amount -> Step 3: Update status
          // For return: tracking -> refund -> status
          // For exchange: must have exchange order selected by customer before moving to in_progress
          // For refund: refund -> status
          // For warranty: tracking -> status

          const hasExchangeOrder = !!(
            complaintDetail?.exchangeOrderId ||
            selectedComplaint.exchangeOrderId ||
            selectedComplaint.ExchangeOrderId
          );

          // Determine if status update should be shown based on flags
          let canShowStatusUpdate = transitions.length > 0;
          let statusBlockReason = "";

          if (
            cType === "return" &&
            (cStatus === "approved" || cStatus === "in_progress")
          ) {
            if (needsTracking && !trackingConfirmed) {
              canShowStatusUpdate = false;
              statusBlockReason =
                "Vui lòng nhập mã vận đơn trả hàng trước khi cập nhật trạng thái.";
            } else if (needsRefund && !refundConfirmed) {
              canShowStatusUpdate = false;
              statusBlockReason =
                "Vui lòng nhập số tiền hoàn trước khi cập nhật trạng thái.";
            }
          }

          if (cType === "exchange" && cStatus === "approved") {
            if (!hasExchangeOrder) {
              canShowStatusUpdate = false;
              statusBlockReason =
                "Khách hàng chưa chọn sản phẩm thay thế. Không thể chuyển sang trạng thái 'Đang xử lý' cho đến khi khách hoàn tất chọn sản phẩm đổi.";
            }
          }

          if (
            cType === "refund" &&
            (cStatus === "approved" || cStatus === "in_progress")
          ) {
            if (!refundConfirmed) {
              canShowStatusUpdate = false;
              statusBlockReason =
                "Vui lòng nhập số tiền hoàn trước khi cập nhật trạng thái.";
            }
          }

          if (
            cType === "warranty" &&
            (cStatus === "approved" || cStatus === "in_progress")
          ) {
            if (needsTracking && !trackingConfirmed) {
              canShowStatusUpdate = false;
              statusBlockReason =
                "Vui lòng nhập mã vận đơn gửi bảo hành trước khi cập nhật trạng thái.";
            }
          }

          // Refund should only show after tracking is confirmed for return type
          const showRefund =
            needsRefund && (cType !== "return" || trackingConfirmed);

          return (
            <div
              className="ac-modal-overlay"
              onClick={() => setSelectedComplaint(null)}
            >
              <div
                className="ac-modal"
                onClick={(e) => e.stopPropagation()}
                style={{
                  maxWidth: "600px",
                  maxHeight: "85vh",
                  overflowY: "auto",
                }}
              >
                <h3>Xử lý khiếu nại</h3>
                <p
                  style={{
                    color: "#6b7280",
                    fontSize: "14px",
                    margin: "8px 0 6px",
                  }}
                >
                  Mã:{" "}
                  <b>
                    #
                    {String(
                      selectedComplaint.requestId ||
                        selectedComplaint.RequestId,
                    ).slice(0, 8)}
                  </b>
                  {" · "}
                  Loại: <b>{typeMap[cType] || cType}</b>
                  {" · "}
                  Hiện tại: {getStatusBadge(cStatus)}
                </p>
                <p
                  style={{
                    color: "#374151",
                    fontSize: "13px",
                    margin: "0 0 12px",
                  }}
                >
                  Lý do:{" "}
                  {(
                    selectedComplaint.reason ||
                    selectedComplaint.Reason ||
                    ""
                  ).slice(0, 100)}
                  {(selectedComplaint.reason || "").length > 100 ? "..." : ""}
                </p>

                {(selectedComplaint.mediaUrl || selectedComplaint.MediaUrl) &&
                  (() => {
                    const rawUrl =
                      selectedComplaint.mediaUrl || selectedComplaint.MediaUrl;
                    const urls = rawUrl
                      .split(",")
                      .map((u) => u.trim())
                      .filter(Boolean);
                    const imageUrls = urls.filter(
                      (u) =>
                        /\.(jpg|jpeg|png|gif|webp)/i.test(u) ||
                        u.includes("cloudinary"),
                    );
                    const otherUrls = urls.filter(
                      (u) =>
                        !(
                          /\.(jpg|jpeg|png|gif|webp)/i.test(u) ||
                          u.includes("cloudinary")
                        ),
                    );
                    return (
                      <div style={{ margin: "0 0 16px" }}>
                        <b style={{ fontSize: "13px" }}>Bằng chứng:</b>
                        {imageUrls.length > 0 && (
                          <div
                            style={{
                              display: "flex",
                              gap: "8px",
                              flexWrap: "wrap",
                              marginTop: "8px",
                            }}
                          >
                            {imageUrls.map((url, idx) => (
                              <a
                                key={idx}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <img
                                  src={url}
                                  alt={`Ảnh ${idx + 1}`}
                                  style={{
                                    width: "100px",
                                    height: "100px",
                                    objectFit: "cover",
                                    borderRadius: "8px",
                                    border: "1px solid #e5e7eb",
                                  }}
                                />
                              </a>
                            ))}
                          </div>
                        )}
                        {otherUrls.map((url, idx) => (
                          <p
                            key={idx}
                            style={{ margin: "4px 0", fontSize: "13px" }}
                          >
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: "#2563eb" }}
                            >
                              Xem file đính kèm{" "}
                              {otherUrls.length > 1 ? idx + 1 : ""}
                            </a>
                          </p>
                        ))}
                      </div>
                    );
                  })()}

                {/* Exchange: show exchange order detail if exists */}
                {isExchange && (
                  <div
                    style={{
                      marginBottom: "16px",
                      padding: "14px",
                      backgroundColor: "#f0f9ff",
                      borderRadius: "8px",
                      border: "1px solid #bae6fd",
                    }}
                  >
                    <label
                      style={{
                        display: "block",
                        fontWeight: "600",
                        marginBottom: "8px",
                        fontSize: "14px",
                        color: "#0369a1",
                      }}
                    >
                      Thông tin đổi hàng
                    </label>
                    {hasExchangeOrder ? (
                      <div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginBottom: "8px",
                          }}
                        >
                          <span
                            style={{
                              color: "#059669",
                              fontWeight: "bold",
                              fontSize: "13px",
                            }}
                          >
                            ✅ Khách đã chọn sản phẩm thay thế
                          </span>
                        </div>
                        {exchangeOrderDetail && (
                          <div
                            style={{
                              backgroundColor: "#fff",
                              borderRadius: "6px",
                              padding: "10px 12px",
                              border: "1px solid #e0f2fe",
                            }}
                          >
                            <p
                              style={{
                                margin: "0 0 6px",
                                fontSize: "13px",
                                color: "#374151",
                              }}
                            >
                              <b>Mã đơn đổi:</b> #
                              {String(exchangeOrderDetail.orderId || "").slice(
                                0,
                                8,
                              )}
                            </p>
                            <p
                              style={{
                                margin: "0 0 6px",
                                fontSize: "13px",
                                color: "#374151",
                              }}
                            >
                              <b>Trạng thái:</b>{" "}
                              {exchangeOrderDetail.status || "—"}
                            </p>
                            <p
                              style={{
                                margin: "0 0 6px",
                                fontSize: "13px",
                                color: "#374151",
                              }}
                            >
                              <b>Địa chỉ giao:</b>{" "}
                              {exchangeOrderDetail.shippingAddress || "—"}
                            </p>
                            {(
                              exchangeOrderDetail.items ||
                              exchangeOrderDetail.orderItems ||
                              []
                            ).map((item, idx) => (
                              <div
                                key={idx}
                                style={{
                                  padding: "8px",
                                  backgroundColor: "#f0f9ff",
                                  borderRadius: "6px",
                                  marginTop: "6px",
                                  fontSize: "13px",
                                }}
                              >
                                <p style={{ margin: "2px 0" }}>
                                  <b>Sản phẩm:</b>{" "}
                                  {item.frame?.frameName ||
                                    item.frameName ||
                                    "Gọng kính"}
                                  {(item.selectedColor || item.frame?.color) &&
                                    ` - Màu: ${item.selectedColor || item.frame?.color}`}
                                </p>
                                <p style={{ margin: "2px 0" }}>
                                  <b>SL:</b> {item.quantity || 1} · <b>Giá:</b>{" "}
                                  {(
                                    item.unitPrice ||
                                    item.orderPrice ||
                                    0
                                  ).toLocaleString("vi-VN")}
                                  $
                                </p>
                              </div>
                            ))}
                            <p
                              style={{
                                margin: "8px 0 0",
                                fontSize: "14px",
                                fontWeight: "bold",
                                color: "#0369a1",
                              }}
                            >
                              Tổng đơn đổi:{" "}
                              {(
                                exchangeOrderDetail.totalAmount || 0
                              ).toLocaleString("vi-VN")}
                              $
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        style={{
                          padding: "10px 12px",
                          backgroundColor: "#fef3c7",
                          borderRadius: "6px",
                          border: "1px solid #fde68a",
                        }}
                      >
                        <p
                          style={{
                            margin: 0,
                            fontSize: "13px",
                            color: "#92400e",
                            fontWeight: "600",
                          }}
                        >
                          ⏳ Khách hàng chưa chọn sản phẩm thay thế
                        </p>
                        <p
                          style={{
                            margin: "4px 0 0",
                            fontSize: "12px",
                            color: "#a16207",
                          }}
                        >
                          Không thể chuyển sang "Đang xử lý" cho đến khi khách
                          hoàn tất chọn sản phẩm đổi.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {actionMsg && (
                  <div
                    style={{
                      color: "#065f46",
                      backgroundColor: "#d1fae5",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      marginBottom: "12px",
                      fontSize: "13px",
                      fontWeight: 600,
                    }}
                  >
                    {actionMsg}
                  </div>
                )}

                {/* Step 1: Return tracking section (shown first for return/exchange/warranty) */}
                {needsTracking && (
                  <div
                    style={{
                      marginBottom: "16px",
                      padding: "14px",
                      backgroundColor: trackingConfirmed
                        ? "#d1fae5"
                        : "#fefce8",
                      borderRadius: "8px",
                      border: `1px solid ${trackingConfirmed ? "#a7f3d0" : "#fde68a"}`,
                    }}
                  >
                    <label
                      style={{
                        display: "block",
                        fontWeight: "600",
                        marginBottom: "6px",
                        fontSize: "14px",
                        color: trackingConfirmed ? "#065f46" : "#92400e",
                      }}
                    >
                      {trackingConfirmed ? "✅ " : "① "}
                      Mã vận đơn trả hàng / gửi bảo hành
                    </label>
                    {trackingConfirmed ? (
                      <p
                        style={{
                          margin: 0,
                          fontSize: "13px",
                          color: "#065f46",
                        }}
                      >
                        Đã cập nhật mã vận đơn thành công.
                      </p>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          alignItems: "center",
                        }}
                      >
                        <input
                          type="text"
                          value={trackingNumber}
                          onChange={(e) => setTrackingNumber(e.target.value)}
                          placeholder="VD: GHTK123456789"
                          style={{
                            flex: 1,
                            padding: "8px 12px",
                            border: "1px solid #fde68a",
                            borderRadius: "8px",
                            fontSize: "14px",
                          }}
                        />
                        <button
                          onClick={handleSetTracking}
                          disabled={updating}
                          style={{
                            padding: "8px 16px",
                            backgroundColor: "#d97706",
                            color: "#fff",
                            border: "none",
                            borderRadius: "8px",
                            cursor: updating ? "not-allowed" : "pointer",
                            fontWeight: "600",
                            fontSize: "13px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Cập nhật
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 2: Refund processing section (shown after tracking for return, standalone for refund) */}
                {showRefund && (
                  <div
                    style={{
                      marginBottom: "16px",
                      padding: "14px",
                      backgroundColor: refundConfirmed ? "#d1fae5" : "#ecfdf5",
                      borderRadius: "8px",
                      border: `1px solid ${refundConfirmed ? "#a7f3d0" : "#a7f3d0"}`,
                    }}
                  >
                    <label
                      style={{
                        display: "block",
                        fontWeight: "600",
                        marginBottom: "6px",
                        fontSize: "14px",
                        color: "#065f46",
                      }}
                    >
                      {refundConfirmed
                        ? "✅ "
                        : cType === "return"
                          ? "② "
                          : "① "}
                      Xử lý hoàn tiền
                    </label>
                    {refundConfirmed ? (
                      <p
                        style={{
                          margin: 0,
                          fontSize: "13px",
                          color: "#065f46",
                        }}
                      >
                        Đã nhập số tiền hoàn thành công.
                      </p>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          alignItems: "center",
                        }}
                      >
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          value={refundAmount}
                          onChange={(e) => setRefundAmount(e.target.value)}
                          placeholder="Số tiền"
                          style={{
                            flex: 1,
                            padding: "8px 12px",
                            border: "1px solid #a7f3d0",
                            borderRadius: "8px",
                            fontSize: "14px",
                          }}
                        />
                        <button
                          onClick={handleProcessRefund}
                          disabled={updating}
                          style={{
                            padding: "8px 16px",
                            backgroundColor: "#059669",
                            color: "#fff",
                            border: "none",
                            borderRadius: "8px",
                            cursor: updating ? "not-allowed" : "pointer",
                            fontWeight: "600",
                            fontSize: "13px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Hoàn tiền
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Status block reason message */}
                {!canShowStatusUpdate &&
                  statusBlockReason &&
                  transitions.length > 0 && (
                    <div
                      style={{
                        padding: "12px 14px",
                        backgroundColor: "#fef3c7",
                        borderRadius: "8px",
                        marginBottom: "16px",
                        border: "1px solid #fde68a",
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          fontSize: "13px",
                          color: "#92400e",
                          fontWeight: "600",
                        }}
                      >
                        🔒 {statusBlockReason}
                      </p>
                    </div>
                  )}

                {/* Step 3: Status change section (only after prerequisites are met) */}
                {canShowStatusUpdate && transitions.length > 0 && (
                  <div
                    style={{
                      marginBottom: "16px",
                      padding: "14px",
                      backgroundColor: "#f9fafb",
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    <label
                      style={{
                        display: "block",
                        fontWeight: "600",
                        marginBottom: "6px",
                        fontSize: "14px",
                      }}
                    >
                      {cType === "return" &&
                      (cStatus === "approved" || cStatus === "in_progress")
                        ? "③ "
                        : cType === "refund" &&
                            (cStatus === "approved" ||
                              cStatus === "in_progress")
                          ? "② "
                          : (cType === "exchange" || cType === "warranty") &&
                              (cStatus === "approved" ||
                                cStatus === "in_progress")
                            ? "② "
                            : ""}
                      Cập nhật trạng thái
                    </label>
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        alignItems: "center",
                      }}
                    >
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        style={{
                          flex: 1,
                          padding: "8px 12px",
                          border: "1px solid #d1d5db",
                          borderRadius: "8px",
                          fontSize: "14px",
                        }}
                      >
                        {transitions.map((s) => (
                          <option key={s} value={s}>
                            {statusMap[s]?.text || s}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={handleStatusUpdate}
                        disabled={updating || !newStatus}
                        style={{
                          padding: "8px 16px",
                          backgroundColor: "#3b82f6",
                          color: "#fff",
                          border: "none",
                          borderRadius: "8px",
                          cursor: updating ? "not-allowed" : "pointer",
                          fontWeight: "600",
                          fontSize: "13px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Cập nhật
                      </button>
                    </div>
                  </div>
                )}

                {/* Staff note */}
                <div style={{ marginBottom: "16px" }}>
                  <label
                    style={{
                      display: "block",
                      fontWeight: "600",
                      marginBottom: "6px",
                      fontSize: "14px",
                    }}
                  >
                    Ghi chú nhân viên
                  </label>
                  <textarea
                    value={staffNote}
                    onChange={(e) => setStaffNote(e.target.value)}
                    rows={3}
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

                {updateError && (
                  <div
                    style={{
                      color: "#dc2626",
                      backgroundColor: "#fee2e2",
                      padding: "10px",
                      borderRadius: "8px",
                      marginBottom: "12px",
                      fontSize: "13px",
                    }}
                  >
                    {updateError}
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    justifyContent: "flex-end",
                  }}
                >
                  <button
                    onClick={() => setSelectedComplaint(null)}
                    style={{
                      padding: "10px 20px",
                      backgroundColor: "#f3f4f6",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontWeight: "600",
                    }}
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
    </div>
  );
}
