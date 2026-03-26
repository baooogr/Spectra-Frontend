import React, { useState, useEffect, useContext } from "react";
import { UserContext } from "../context/UserContext";
import "./AdminComplaints.css";

const API = "https://myspectra.runasp.net/api/Complaints";
const API_ORDERS = "https://myspectra.runasp.net/api/Orders";
const API_SHIPPING = "https://myspectra.runasp.net/api/Shipping";

// Default warehouse address (HCM) — GoShip numeric IDs
const WAREHOUSE_ADDRESS = {
  name: "Spectra Glasses Warehouse",
  phone: "0909123456",
  street: "123 Nguyễn Văn Linh",
  ward: "9233",
  district: "700700",
  city: "700000",
};

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

  // GoShip wizard state for complaint shipments
  const [gsMode, setGsMode] = useState("goship"); // "goship" or "manual"
  const [goShipStep, setGoShipStep] = useState(1); // 1=address+parcel, 2=rates, 3=creating
  const [goShipParcel, setGoShipParcel] = useState({
    weight: 500,
    width: 20,
    height: 10,
    length: 25,
    cod: 0,
  });
  const [goShipRates, setGoShipRates] = useState([]);
  const [goShipSelectedRate, setGoShipSelectedRate] = useState(null);
  const [goShipLoading, setGoShipLoading] = useState(false);
  const [goShipError, setGoShipError] = useState("");
  const [gsCities, setGsCities] = useState([]);
  const [gsDistricts, setGsDistricts] = useState([]);
  const [gsWards, setGsWards] = useState([]);
  const [gsSelectedCity, setGsSelectedCity] = useState("");
  const [gsSelectedDistrict, setGsSelectedDistrict] = useState("");
  const [gsSelectedWard, setGsSelectedWard] = useState("");
  const [gsReceiverName, setGsReceiverName] = useState("");
  const [gsReceiverPhone, setGsReceiverPhone] = useState("");
  const [gsReceiverStreet, setGsReceiverStreet] = useState("");

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

    // Reset GoShip state for complaint tracking
    resetGoShipState();

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
        setActionMsg("Đã thêm số tiền cần hoàn.");
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
        setActionMsg("Đã cập nhật mã vận đơn thành công.");
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

  // ─── GoShip helper functions for complaint shipments ───

  const resetGoShipState = () => {
    setGsMode("goship");
    setGoShipStep(1);
    setGoShipRates([]);
    setGoShipSelectedRate(null);
    setGoShipError("");
    setGoShipParcel({ weight: 500, width: 20, height: 10, length: 25, cod: 0 });
    setGsDistricts([]);
    setGsWards([]);
    setGsSelectedCity("");
    setGsSelectedDistrict("");
    setGsSelectedWard("");
    setGsReceiverName("");
    setGsReceiverPhone("");
    setGsReceiverStreet("");
    // Load cities if not cached
    if (gsCities.length === 0) {
      fetch(`${API_SHIPPING}/goship/cities`, { headers })
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => setGsCities(data || []))
        .catch(() => {});
    }
  };

  const handleGsCityChange = (cityId) => {
    setGsSelectedCity(cityId);
    setGsSelectedDistrict("");
    setGsSelectedWard("");
    setGsDistricts([]);
    setGsWards([]);
    if (!cityId) return;
    fetch(`${API_SHIPPING}/goship/cities/${cityId}/districts`, { headers })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setGsDistricts(data || []))
      .catch(() => {});
  };

  const handleGsDistrictChange = (districtId) => {
    setGsSelectedDistrict(districtId);
    setGsSelectedWard("");
    setGsWards([]);
    if (!districtId) return;
    fetch(`${API_SHIPPING}/goship/districts/${districtId}/wards`, { headers })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setGsWards(data || []))
      .catch(() => {});
  };

  const handleGsGetRates = async () => {
    if (!gsSelectedCity || !gsSelectedDistrict || !gsSelectedWard) {
      setGoShipError("Vui lòng chọn đầy đủ Tỉnh/Thành, Quận/Huyện, Phường/Xã.");
      return;
    }
    setGoShipLoading(true);
    setGoShipError("");
    try {
      const addressTo = {
        name: gsReceiverName || "Khách hàng",
        phone: gsReceiverPhone || "0900000000",
        street: gsReceiverStreet || "",
        ward: gsSelectedWard,
        district: gsSelectedDistrict,
        city: gsSelectedCity,
      };
      const res = await fetch(`${API_SHIPPING}/goship/rates`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          addressFrom: WAREHOUSE_ADDRESS,
          addressTo,
          parcel: goShipParcel,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const rates = data.data || data.Data || [];
        if (rates.length === 0) {
          setGoShipError(
            "Không tìm thấy tuyến vận chuyển J&T cho địa chỉ này.",
          );
        } else {
          setGoShipRates(rates);
          setGoShipStep(2);
        }
      } else {
        const err = await res.json().catch(() => null);
        setGoShipError(err?.message || "Không thể lấy giá cước từ GoShip.");
      }
    } catch {
      setGoShipError("Lỗi kết nối GoShip.");
    } finally {
      setGoShipLoading(false);
    }
  };

  const handleGsCreateShipment = async () => {
    if (!goShipSelectedRate) return;
    setGoShipLoading(true);
    setGoShipError("");
    setGoShipStep(3);
    try {
      const addressTo = {
        name: gsReceiverName || "Khách hàng",
        phone: gsReceiverPhone || "0900000000",
        street: gsReceiverStreet || "",
        ward: gsSelectedWard,
        district: gsSelectedDistrict,
        city: gsSelectedCity,
      };
      const cId = selectedComplaint.requestId || selectedComplaint.RequestId;
      const res = await fetch(`${API_SHIPPING}/goship/shipments`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          rateId: goShipSelectedRate,
          complaintId: cId,
          addressFrom: WAREHOUSE_ADDRESS,
          addressTo,
          parcel: goShipParcel,
        }),
      });
      if (res.ok) {
        setActionMsg("Đã tạo vận đơn J&T Express thành công!");
        setTrackingConfirmed(true);
        setGoShipStep(1);
        fetchComplaints(activeFilter, page);
      } else {
        const err = await res.json().catch(() => null);
        setGoShipError(err?.message || "Không thể tạo vận đơn GoShip.");
        setGoShipStep(2);
      }
    } catch {
      setGoShipError("Lỗi kết nối khi tạo vận đơn.");
      setGoShipStep(2);
    } finally {
      setGoShipLoading(false);
    }
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
                  <th>Sản phẩm</th>
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
                  const originalItem = c.originalItem || c.OriginalItem || null;
                  const orderItem = c.orderItem || c.OrderItem || null;
                  const productName =
                    originalItem?.frameName ||
                    originalItem?.productName ||
                    originalItem?.name ||
                    orderItem?.frame?.frameName ||
                    orderItem?.frameName ||
                    orderItem?.productName ||
                    orderItem?.name ||
                    (c.orderItemId || c.OrderItemId
                      ? `#${String(c.orderItemId || c.OrderItemId).slice(0, 8)}`
                      : "—");
                  const productQuantity =
                    originalItem?.quantity ||
                    originalItem?.Quantity ||
                    orderItem?.quantity ||
                    orderItem?.Quantity ||
                    "—";
                  const productSize =
                    originalItem?.selectedSize ||
                    originalItem?.SelectedSize ||
                    orderItem?.selectedSize ||
                    orderItem?.SelectedSize ||
                    "";
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
                        <div style={{ fontWeight: "600" }}>{productName}</div>
                        <div style={{ fontSize: "12px", color: "#6b7280" }}>
                          SL: {productQuantity}
                          {productSize ? ` • Size: ${productSize}` : ""}
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
                                    Xem bằng chứng
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
          let transitions = validTransitions[cStatus] || [];

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
                "Vui lòng tạo vận đơn trả hàng (J&T hoặc thủ công) trước khi cập nhật trạng thái.";
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

          // Block resolving exchange complaints unless exchange order is delivered
          if (cType === "exchange" && cStatus === "in_progress") {
            const exchangeDelivered =
              exchangeOrderDetail?.status?.toLowerCase() === "delivered";
            if (!exchangeDelivered) {
              // Filter out "resolved" from available transitions
              transitions = transitions.filter((t) => t !== "resolved");
              if (transitions.length === 0) {
                canShowStatusUpdate = false;
                statusBlockReason =
                  "Không thể hoàn tất khiếu nại cho đến khi đơn hàng thay thế đã được giao đến khách hàng.";
              }
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
                "Vui lòng tạo vận đơn bảo hành (J&T hoặc thủ công) trước khi cập nhật trạng thái.";
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

                {/* Product being complained about */}
                {complaintDetail?.originalItem && (
                  <div
                    style={{
                      marginBottom: "16px",
                      padding: "14px",
                      backgroundColor: "#f8fafc",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                    }}
                  >
                    <label
                      style={{
                        display: "block",
                        fontWeight: "600",
                        marginBottom: "8px",
                        fontSize: "14px",
                        color: "#0f172a",
                      }}
                    >
                      Sản phẩm bị khiếu nại
                    </label>
                    <p style={{ margin: "2px 0", fontSize: "13px" }}>
                      <b>OrderItem ID:</b>{" "}
                      {complaintDetail.orderItemId ||
                        complaintDetail.OrderItemId ||
                        "—"}
                    </p>
                    <p style={{ margin: "2px 0", fontSize: "13px" }}>
                      <b>Tên:</b>{" "}
                      {complaintDetail.originalItem.frameName ||
                        complaintDetail.originalItem.productName ||
                        "—"}
                    </p>
                    <p style={{ margin: "2px 0", fontSize: "13px" }}>
                      <b>Giá:</b>{" "}
                      {(
                        complaintDetail.originalItem.unitPrice || 0
                      ).toLocaleString("vi-VN")}{" "}
                      $
                    </p>
                    <p style={{ margin: "2px 0", fontSize: "13px" }}>
                      <b>Số lượng:</b>{" "}
                      {complaintDetail.originalItem.quantity ||
                        complaintDetail.originalItem.Quantity ||
                        1}
                    </p>
                    {complaintDetail.originalItem.selectedSize && (
                      <p style={{ margin: "2px 0", fontSize: "13px" }}>
                        <b>Kích thước:</b>{" "}
                        {complaintDetail.originalItem.selectedSize}
                      </p>
                    )}
                  </div>
                )}

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
                            Khách đã chọn sản phẩm thay thế
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
                          Khách hàng chưa chọn sản phẩm thay thế
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

                {/* Step 1: Return tracking section (GoShip wizard or manual) */}
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
                      {trackingConfirmed ? "" : "① "}
                      Vận đơn trả hàng / gửi bảo hành
                    </label>
                    {trackingConfirmed ? (
                      <div style={{ fontSize: "13px", color: "#065f46" }}>
                        <p style={{ margin: 0 }}>Đã tạo vận đơn thành công.</p>
                        {(complaintDetail?.returnShippingCarrier ||
                          complaintDetail?.ReturnShippingCarrier) && (
                          <p style={{ margin: "4px 0 0", fontSize: "12px" }}>
                            Hãng vận chuyển:{" "}
                            <b>
                              {complaintDetail.returnShippingCarrier ||
                                complaintDetail.ReturnShippingCarrier}
                            </b>
                            {" — "}Mã:{" "}
                            <b>
                              {complaintDetail.returnTrackingNumber ||
                                complaintDetail.ReturnTrackingNumber}
                            </b>
                          </p>
                        )}
                      </div>
                    ) : (
                      <div>
                        {/* Toggle between GoShip and Manual */}
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            marginBottom: "12px",
                          }}
                        >
                          <button
                            onClick={() => {
                              setGsMode("goship");
                              setGoShipError("");
                            }}
                            style={{
                              padding: "6px 14px",
                              borderRadius: "6px",
                              fontSize: "13px",
                              fontWeight: 600,
                              border:
                                gsMode === "goship"
                                  ? "2px solid #d97706"
                                  : "1px solid #d1d5db",
                              backgroundColor:
                                gsMode === "goship" ? "#fef3c7" : "#fff",
                              color:
                                gsMode === "goship" ? "#92400e" : "#6b7280",
                              cursor: "pointer",
                            }}
                          >
                            J&T Express (GoShip)
                          </button>
                          <button
                            onClick={() => {
                              setGsMode("manual");
                              setGoShipError("");
                            }}
                            style={{
                              padding: "6px 14px",
                              borderRadius: "6px",
                              fontSize: "13px",
                              fontWeight: 600,
                              border:
                                gsMode === "manual"
                                  ? "2px solid #d97706"
                                  : "1px solid #d1d5db",
                              backgroundColor:
                                gsMode === "manual" ? "#fef3c7" : "#fff",
                              color:
                                gsMode === "manual" ? "#92400e" : "#6b7280",
                              cursor: "pointer",
                            }}
                          >
                            Nhập thủ công
                          </button>
                        </div>

                        {goShipError && (
                          <div
                            style={{
                              backgroundColor: "#fee2e2",
                              color: "#dc2626",
                              padding: "8px 12px",
                              borderRadius: "6px",
                              fontSize: "13px",
                              marginBottom: "10px",
                            }}
                          >
                            {goShipError}
                          </div>
                        )}

                        {gsMode === "manual" ? (
                          /* Manual tracking input */
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
                              onChange={(e) =>
                                setTrackingNumber(e.target.value)
                              }
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
                        ) : (
                          /* GoShip 3-step wizard */
                          <div>
                            {goShipStep === 1 && (
                              <div>
                                <p
                                  style={{
                                    fontWeight: 600,
                                    marginBottom: "8px",
                                    fontSize: "13px",
                                  }}
                                >
                                  Địa chỉ người nhận (chọn từ GoShip)
                                </p>
                                <div
                                  style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: "8px",
                                    marginBottom: "10px",
                                  }}
                                >
                                  <div>
                                    <label
                                      style={{
                                        fontSize: "12px",
                                        fontWeight: 500,
                                        color: "#374151",
                                      }}
                                    >
                                      Tên:
                                    </label>
                                    <input
                                      type="text"
                                      value={gsReceiverName}
                                      onChange={(e) =>
                                        setGsReceiverName(e.target.value)
                                      }
                                      style={{
                                        width: "100%",
                                        padding: "6px 10px",
                                        border: "1px solid #d1d5db",
                                        borderRadius: "6px",
                                        fontSize: "13px",
                                        boxSizing: "border-box",
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <label
                                      style={{
                                        fontSize: "12px",
                                        fontWeight: 500,
                                        color: "#374151",
                                      }}
                                    >
                                      SĐT:
                                    </label>
                                    <input
                                      type="text"
                                      value={gsReceiverPhone}
                                      onChange={(e) =>
                                        setGsReceiverPhone(e.target.value)
                                      }
                                      style={{
                                        width: "100%",
                                        padding: "6px 10px",
                                        border: "1px solid #d1d5db",
                                        borderRadius: "6px",
                                        fontSize: "13px",
                                        boxSizing: "border-box",
                                      }}
                                    />
                                  </div>
                                  <div style={{ gridColumn: "1 / -1" }}>
                                    <label
                                      style={{
                                        fontSize: "12px",
                                        fontWeight: 500,
                                        color: "#374151",
                                      }}
                                    >
                                      Địa chỉ (số nhà, đường):
                                    </label>
                                    <input
                                      type="text"
                                      value={gsReceiverStreet}
                                      onChange={(e) =>
                                        setGsReceiverStreet(e.target.value)
                                      }
                                      style={{
                                        width: "100%",
                                        padding: "6px 10px",
                                        border: "1px solid #d1d5db",
                                        borderRadius: "6px",
                                        fontSize: "13px",
                                        boxSizing: "border-box",
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <label
                                      style={{
                                        fontSize: "12px",
                                        fontWeight: 500,
                                        color: "#374151",
                                      }}
                                    >
                                      Tỉnh/Thành phố:{" "}
                                      <span style={{ color: "red" }}>*</span>
                                    </label>
                                    <select
                                      value={gsSelectedCity}
                                      onChange={(e) =>
                                        handleGsCityChange(e.target.value)
                                      }
                                      style={{
                                        width: "100%",
                                        padding: "6px 8px",
                                        borderRadius: "6px",
                                        border: "1px solid #d1d5db",
                                        fontSize: "13px",
                                      }}
                                    >
                                      <option value="">
                                        -- Chọn tỉnh/thành --
                                      </option>
                                      {gsCities.map((c) => (
                                        <option key={c.id} value={c.id}>
                                          {c.name}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label
                                      style={{
                                        fontSize: "12px",
                                        fontWeight: 500,
                                        color: "#374151",
                                      }}
                                    >
                                      Quận/Huyện:{" "}
                                      <span style={{ color: "red" }}>*</span>
                                    </label>
                                    <select
                                      value={gsSelectedDistrict}
                                      onChange={(e) =>
                                        handleGsDistrictChange(e.target.value)
                                      }
                                      disabled={!gsSelectedCity}
                                      style={{
                                        width: "100%",
                                        padding: "6px 8px",
                                        borderRadius: "6px",
                                        border: "1px solid #d1d5db",
                                        fontSize: "13px",
                                      }}
                                    >
                                      <option value="">
                                        -- Chọn quận/huyện --
                                      </option>
                                      {gsDistricts.map((d) => (
                                        <option key={d.id} value={d.id}>
                                          {d.name}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label
                                      style={{
                                        fontSize: "12px",
                                        fontWeight: 500,
                                        color: "#374151",
                                      }}
                                    >
                                      Phường/Xã:{" "}
                                      <span style={{ color: "red" }}>*</span>
                                    </label>
                                    <select
                                      value={gsSelectedWard}
                                      onChange={(e) =>
                                        setGsSelectedWard(e.target.value)
                                      }
                                      disabled={!gsSelectedDistrict}
                                      style={{
                                        width: "100%",
                                        padding: "6px 8px",
                                        borderRadius: "6px",
                                        border: "1px solid #d1d5db",
                                        fontSize: "13px",
                                      }}
                                    >
                                      <option value="">
                                        -- Chọn phường/xã --
                                      </option>
                                      {gsWards.map((w) => (
                                        <option key={w.id} value={String(w.id)}>
                                          {w.name}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                                <p
                                  style={{
                                    fontWeight: 600,
                                    marginBottom: "8px",
                                    fontSize: "13px",
                                  }}
                                >
                                  Thông tin kiện hàng
                                </p>
                                <div
                                  style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr 1fr",
                                    gap: "8px",
                                    marginBottom: "10px",
                                  }}
                                >
                                  <div>
                                    <label
                                      style={{
                                        fontSize: "12px",
                                        fontWeight: 500,
                                        color: "#374151",
                                      }}
                                    >
                                      Cân nặng (g):
                                    </label>
                                    <input
                                      type="number"
                                      value={goShipParcel.weight}
                                      min={1}
                                      onChange={(e) =>
                                        setGoShipParcel({
                                          ...goShipParcel,
                                          weight: Number(e.target.value),
                                        })
                                      }
                                      style={{
                                        width: "100%",
                                        padding: "6px 10px",
                                        border: "1px solid #d1d5db",
                                        borderRadius: "6px",
                                        fontSize: "13px",
                                        boxSizing: "border-box",
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <label
                                      style={{
                                        fontSize: "12px",
                                        fontWeight: 500,
                                        color: "#374151",
                                      }}
                                    >
                                      Dài (cm):
                                    </label>
                                    <input
                                      type="number"
                                      value={goShipParcel.length}
                                      min={1}
                                      onChange={(e) =>
                                        setGoShipParcel({
                                          ...goShipParcel,
                                          length: Number(e.target.value),
                                        })
                                      }
                                      style={{
                                        width: "100%",
                                        padding: "6px 10px",
                                        border: "1px solid #d1d5db",
                                        borderRadius: "6px",
                                        fontSize: "13px",
                                        boxSizing: "border-box",
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <label
                                      style={{
                                        fontSize: "12px",
                                        fontWeight: 500,
                                        color: "#374151",
                                      }}
                                    >
                                      Rộng (cm):
                                    </label>
                                    <input
                                      type="number"
                                      value={goShipParcel.width}
                                      min={1}
                                      onChange={(e) =>
                                        setGoShipParcel({
                                          ...goShipParcel,
                                          width: Number(e.target.value),
                                        })
                                      }
                                      style={{
                                        width: "100%",
                                        padding: "6px 10px",
                                        border: "1px solid #d1d5db",
                                        borderRadius: "6px",
                                        fontSize: "13px",
                                        boxSizing: "border-box",
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <label
                                      style={{
                                        fontSize: "12px",
                                        fontWeight: 500,
                                        color: "#374151",
                                      }}
                                    >
                                      Cao (cm):
                                    </label>
                                    <input
                                      type="number"
                                      value={goShipParcel.height}
                                      min={1}
                                      onChange={(e) =>
                                        setGoShipParcel({
                                          ...goShipParcel,
                                          height: Number(e.target.value),
                                        })
                                      }
                                      style={{
                                        width: "100%",
                                        padding: "6px 10px",
                                        border: "1px solid #d1d5db",
                                        borderRadius: "6px",
                                        fontSize: "13px",
                                        boxSizing: "border-box",
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <label
                                      style={{
                                        fontSize: "12px",
                                        fontWeight: 500,
                                        color: "#374151",
                                      }}
                                    >
                                      COD (VND):
                                    </label>
                                    <input
                                      type="number"
                                      value={goShipParcel.cod}
                                      min={0}
                                      onChange={(e) =>
                                        setGoShipParcel({
                                          ...goShipParcel,
                                          cod: Number(e.target.value),
                                        })
                                      }
                                      style={{
                                        width: "100%",
                                        padding: "6px 10px",
                                        border: "1px solid #d1d5db",
                                        borderRadius: "6px",
                                        fontSize: "13px",
                                        boxSizing: "border-box",
                                      }}
                                    />
                                  </div>
                                </div>
                                <button
                                  onClick={handleGsGetRates}
                                  disabled={goShipLoading}
                                  style={{
                                    padding: "8px 20px",
                                    backgroundColor: "#d97706",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: "8px",
                                    cursor: goShipLoading
                                      ? "not-allowed"
                                      : "pointer",
                                    fontWeight: "600",
                                    fontSize: "13px",
                                  }}
                                >
                                  {goShipLoading
                                    ? "Đang tải..."
                                    : "Lấy giá cước →"}
                                </button>
                              </div>
                            )}

                            {goShipStep === 2 && (
                              <div>
                                <p
                                  style={{
                                    fontWeight: 600,
                                    marginBottom: "8px",
                                    fontSize: "13px",
                                  }}
                                >
                                  Chọn gói vận chuyển ({goShipRates.length}{" "}
                                  tuyến)
                                </p>
                                <div
                                  style={{
                                    maxHeight: "200px",
                                    overflowY: "auto",
                                    marginBottom: "10px",
                                  }}
                                >
                                  {goShipRates.map((rate) => (
                                    <div
                                      key={rate.id}
                                      onClick={() =>
                                        setGoShipSelectedRate(rate.id)
                                      }
                                      style={{
                                        padding: "10px 12px",
                                        marginBottom: "6px",
                                        borderRadius: "8px",
                                        border:
                                          goShipSelectedRate === rate.id
                                            ? "2px solid #d97706"
                                            : "1px solid #e5e7eb",
                                        backgroundColor:
                                          goShipSelectedRate === rate.id
                                            ? "#fef3c7"
                                            : "#fff",
                                        cursor: "pointer",
                                        fontSize: "13px",
                                      }}
                                    >
                                      <div style={{ fontWeight: 600 }}>
                                        {rate.carrier_name ||
                                          rate.carrierName ||
                                          "J&T Express"}
                                      </div>
                                      <div
                                        style={{
                                          color: "#6b7280",
                                          fontSize: "12px",
                                        }}
                                      >
                                        {rate.service ||
                                          rate.carrier_short_name ||
                                          ""}{" "}
                                        —{" "}
                                        {rate.est_pick_time ||
                                          rate.estPickTime ||
                                          "N/A"}
                                      </div>
                                      <div
                                        style={{
                                          fontWeight: 700,
                                          color: "#d97706",
                                          marginTop: "4px",
                                        }}
                                      >
                                        {(
                                          rate.total_fee ||
                                          rate.totalFee ||
                                          0
                                        ).toLocaleString("vi-VN")}{" "}
                                        VND
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <div style={{ display: "flex", gap: "8px" }}>
                                  <button
                                    onClick={() => {
                                      setGoShipStep(1);
                                      setGoShipRates([]);
                                      setGoShipSelectedRate(null);
                                    }}
                                    style={{
                                      padding: "8px 16px",
                                      backgroundColor: "#f3f4f6",
                                      border: "none",
                                      borderRadius: "8px",
                                      cursor: "pointer",
                                      fontWeight: "600",
                                      fontSize: "13px",
                                    }}
                                  >
                                    ← Quay lại
                                  </button>
                                  <button
                                    onClick={handleGsCreateShipment}
                                    disabled={
                                      !goShipSelectedRate || goShipLoading
                                    }
                                    style={{
                                      padding: "8px 20px",
                                      backgroundColor: goShipSelectedRate
                                        ? "#059669"
                                        : "#d1d5db",
                                      color: "#fff",
                                      border: "none",
                                      borderRadius: "8px",
                                      cursor:
                                        goShipSelectedRate && !goShipLoading
                                          ? "pointer"
                                          : "not-allowed",
                                      fontWeight: "600",
                                      fontSize: "13px",
                                    }}
                                  >
                                    {goShipLoading
                                      ? "Đang tạo..."
                                      : "Tạo vận đơn ✓"}
                                  </button>
                                </div>
                              </div>
                            )}

                            {goShipStep === 3 && (
                              <div
                                style={{
                                  textAlign: "center",
                                  padding: "20px 0",
                                }}
                              >
                                <p
                                  style={{
                                    fontSize: "14px",
                                    color: "#d97706",
                                    fontWeight: 600,
                                  }}
                                >
                                  Đang tạo vận đơn...
                                </p>
                              </div>
                            )}
                          </div>
                        )}
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
                        {statusBlockReason}
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
