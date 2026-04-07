import React, { useState, useEffect, useContext } from "react";
import { UserContext } from "../context/UserContext";
import "./AdminComplaints.css";

const API = "https://myspectra.runasp.net/api/Complaints";
const API_ORDERS = "https://myspectra.runasp.net/api/OrdersV2";
const API_SHIPPING = "https://myspectra.runasp.net/api/Shipping";

const statusMap = {
  pending: { text: "Pending", color: "#d97706", bg: "#fef3c7" },
  under_review: { text: "Under_Review", color: "#6366f1", bg: "#e0e7ff" },
  approved: { text: "Approved", color: "#059669", bg: "#d1fae5" },
  rejected: { text: "Rejected", color: "#dc2626", bg: "#fee2e2" },
  in_progress: { text: "In_Progress", color: "#3b82f6", bg: "#dbeafe" },
  resolved: { text: "Resolved", color: "#10b981", bg: "#d1fae5" },
  cancelled: { text: "Cancelled", color: "#6b7280", bg: "#f3f4f6" },
  customer_cancelled: { text: "Customer_Cancelled", color: "#9333ea", bg: "#f3e8ff" },
};

const typeMap = {
  return: "Return",
  exchange: "Exchange",
  refund: "Refund",
  complaint: "Complaint",
  warranty: "Warranty",
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

  // Ahamove wizard state for complaint shipments
  const [gsMode, setGsMode] = useState("ahamove"); // "ahamove" or "manual"
  const [ahamoveStep, setAhamoveStep] = useState(1); // 1=address, 2=services, 3=creating
  const [ahamoveLoading, setAhamoveLoading] = useState(false);
  const [ahamoveError, setAhamoveError] = useState("");
  const [ahamoveServices, setAhamoveServices] = useState([]);
  const [ahamoveSelectedService, setAhamoveSelectedService] = useState(null);
  const [destAddress, setDestAddress] = useState("");
  const [destLat, setDestLat] = useState("");
  const [destLng, setDestLng] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [packageWeight, setPackageWeight] = useState(500);

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const fetchComplaints = async (statusFilter = "all", p = 1) => {
    setLoading(true);
    try {
      const url =
        statusFilter === "all"
          ? `${API}?page=${p}&pageSize=10`
          : `${API}/status/${statusFilter}?page=${p}&pageSize=10`;
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

    // Reset Ahamove state for complaint tracking
    resetAhamoveState();

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

  // ─── Ahamove helper functions for complaint shipments ───

  const resetAhamoveState = () => {
    setGsMode("ahamove");
    setAhamoveStep(1);
    setAhamoveServices([]);
    setAhamoveSelectedService(null);
    setAhamoveError("");
    setDestAddress("");
    setDestLat("");
    setDestLng("");
    setRecipientName("");
    setRecipientPhone("");
    setPackageWeight(500);
  };

const handleAhamoveEstimate = async () => {
    if (!destAddress.trim() || !destLat || !destLng) {
      setAhamoveError("Please enter a complete address and recipient's coordinates.");
      return;
    }
    setAhamoveLoading(true);
    setAhamoveError("");
    try {
      const res = await fetch(`${API_SHIPPING}/ahamove/estimate`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          destinationAddress: destAddress.trim(),
          destinationLat: destLat,
          destinationLng: destLng,
          recipientName: recipientName || "Customer",
          recipientPhone: recipientPhone || "0900000000",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.length === 0) {
          setAhamoveError("No shipping services found for this address.");
        } else {
          setAhamoveServices(data);
          setAhamoveStep(2);
        }
      } else {
        const err = await res.json().catch(() => null);
        setAhamoveError(err?.message || "Unable to fetch shipping rates from Ahamove.");
      }
    } catch {
      setAhamoveError("Ahamove connection error.");
    } finally {
      setAhamoveLoading(false);
    }
  };

  const handleAhamoveCreateOrder = async () => {
    if (!ahamoveSelectedService) return;
    setAhamoveLoading(true);
    setAhamoveError("");
    setAhamoveStep(3);
    try {
      const cId = selectedComplaint.requestId || selectedComplaint.RequestId;
      const res = await fetch(`${API_SHIPPING}/ahamove/orders`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          complaintId: cId,
          destinationAddress: destAddress.trim(),
          destinationLat: destLat,
          destinationLng: destLng,
          recipientName: recipientName || "Customer",
          recipientPhone: recipientPhone || "0900000000",
          serviceId: ahamoveSelectedService,
        }),
      });
      if (res.ok) {
        setActionMsg("Ahamove order created successfully!");
        setTrackingConfirmed(true);
        setAhamoveStep(1);
        fetchComplaints(activeFilter, page);
      } else {
        const err = await res.json().catch(() => null);
        setAhamoveError(err?.message || "Unable to create Ahamove order.");
        setAhamoveStep(2);
      }
    } catch {
      setAhamoveError("Connection error while creating order.");
      setAhamoveStep(2);
    } finally {
      setAhamoveLoading(false);
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
        <h2>Complaint Management</h2>
        <p>Process return, exchange, and warranty requests from customers</p>
      </div>

      {/* Filter tabs */}
      <div className="ac-filters">
        {[
          { key: "all", label: "All" },
          { key: "pending", label: "Pending" },
          { key: "under_review", label: "Under review" },
          { key: "approved", label: "Approved" },
          { key: "in_progress", label: "In Progress" },
          { key: "resolved", label: "Resolved" },
          { key: "rejected", label: "Rejected" },
          { key: "cancelled", label: "Cancelled" },
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
        <div className="ac-loading">Loading...</div>
      ) : complaints.length === 0 ? (
        <div className="ac-empty">No complaints.</div>
      ) : (
        <>
          <div className="ac-table-wrapper">
            <table className="ac-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Type</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Creation Date</th>
                  <th>Actions</th>
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
                            Process
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
                ← Before
              </button>
              <span>
                Page {page}/{totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => fetchComplaints(activeFilter, page + 1)}
              >
                After →
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
                "Please create a return shipment order (J&T or manual) before updating the status.";
            } else if (needsRefund && !refundConfirmed) {
              canShowStatusUpdate = false;
              statusBlockReason =
                "Please enter the refund amount before updating the status.";
            }
          }

          if (cType === "exchange" && cStatus === "approved") {
            if (!hasExchangeOrder) {
              canShowStatusUpdate = false;
              statusBlockReason =
                "The customer has not selected a replacement product yet. Cannot move to 'In Progress' until the customer completes the replacement selection.";
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
                  "The complaint cannot be completed until the replacement order has been delivered to the customer.";
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
                "Please enter the refund amount before updating the status.";
            }
          }

          if (
            cType === "warranty" &&
            (cStatus === "approved" || cStatus === "in_progress")
          ) {
            if (needsTracking && !trackingConfirmed) {
              canShowStatusUpdate = false;
              statusBlockReason =
                "Please create a warranty shipment order (J&T or manual) before updating the status.";
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
                <h3>Handle Complaint</h3>
                <p
                  style={{
                    color: "#6b7280",
                    fontSize: "14px",
                    margin: "8px 0 6px",
                  }}
                >
                  Code:{" "}
                  <b>
                    #
                    {String(
                      selectedComplaint.requestId ||
                        selectedComplaint.RequestId,
                    ).slice(0, 8)}
                  </b>
                  {" · "}
                  Type: <b>{typeMap[cType] || cType}</b>
                  {" · "}
                  Current: {getStatusBadge(cStatus)}
                </p>
                <p
                  style={{
                    color: "#374151",
                    fontSize: "13px",
                    margin: "0 0 12px",
                  }}
                >
                  Reason:{" "}
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
                        <b style={{ fontSize: "13px" }}>Evidence:</b>
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
                                  alt={`Image ${idx + 1}`}
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
                              View attached file{" "}
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
                                           Complained Product
                    </label>
                    <p style={{ margin: "2px 0", fontSize: "13px" }}>
                      <b>OrderItem ID:</b>{" "}
                      {complaintDetail.orderItemId ||
                        complaintDetail.OrderItemId ||
                        "—"}
                    </p>
                    <p style={{ margin: "2px 0", fontSize: "13px" }}>
                      <b>Name:</b>{" "}
                      {complaintDetail.originalItem.frameName ||
                        complaintDetail.originalItem.productName ||
                        "—"}
                    </p>
                    <p style={{ margin: "2px 0", fontSize: "13px" }}>
                      <b>Price:</b>{" "}
                      {(
                        complaintDetail.originalItem.unitPrice || 0
                      ).toLocaleString("vi-VN")}{" "}
                      $
                    </p>
                    <p style={{ margin: "2px 0", fontSize: "13px" }}>
                      <b>Quantity:</b>{" "}
                      {complaintDetail.originalItem.quantity ||
                        complaintDetail.originalItem.Quantity ||
                        1}
                    </p>
                    {complaintDetail.originalItem.selectedSize && (
                      <p style={{ margin: "2px 0", fontSize: "13px" }}>
                        <b>Size:</b>{" "}
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
                      Exchange Information
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
                            Customer has selected a replacement product
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
                              <b>Exchange Order Code:</b> #
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
                              <b>Status:</b>{" "}
                              {exchangeOrderDetail.status || "—"}
                            </p>
                            <p
                              style={{
                                margin: "0 0 6px",
                                fontSize: "13px",
                                color: "#374151",
                              }}
                            >
                              <b>Shipping Address:</b>{" "}
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
                                  <b>Product:</b>{" "}
                                  {item.frame?.frameName ||
                                    item.frameName ||
                                    "Eyeglass Frame"}
                                  {(item.selectedColor || item.frame?.color) &&
                                    ` - Color: ${item.selectedColor || item.frame?.color}`}
                                </p>
                                <p style={{ margin: "2px 0" }}>
                                  <b>Qty:</b> {item.quantity || 1} · <b>Price:</b>{" "}
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
                              Total Exchange Order:{" "}
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
                          Customer has not selected a replacement product yet
                        </p>
                        <p
                          style={{
                            margin: "4px 0 0",
                            fontSize: "12px",
                            color: "#a16207",
                          }}
                        >
                          Cannot move to "In Progress" until the customer
                          completes selecting a replacement product.
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

                {/* Step 1: Return tracking section (Ahamove wizard or manual) */}
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
                      Return / Warranty Shipment
                    </label>
                    {trackingConfirmed ? (
                      <div style={{ fontSize: "13px", color: "#065f46" }}>
                        <p style={{ margin: 0 }}>Shipment created successfully.</p>
                        {(complaintDetail?.returnShippingCarrier ||
                          complaintDetail?.ReturnShippingCarrier) && (
                          <p style={{ margin: "4px 0 0", fontSize: "12px" }}>
                            Carrier:{" "}
                            <b>
                              {complaintDetail.returnShippingCarrier ||
                                complaintDetail.ReturnShippingCarrier}
                            </b>
                            {" — "}Code:{" "}
                            <b>
                              {complaintDetail.returnTrackingNumber ||
                                complaintDetail.ReturnTrackingNumber}
                            </b>
                          </p>
                        )}
                      </div>
                    ) : (
                      <div>
                        {/* Toggle between Ahamove and Manual */}
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            marginBottom: "12px",
                          }}
                        >
                          <button
                            onClick={() => {
                              setGsMode("ahamove");
                              setAhamoveError("");
                            }}
                            style={{
                              padding: "6px 14px",
                              borderRadius: "6px",
                              fontSize: "13px",
                              fontWeight: 600,
                              border:
                                gsMode === "ahamove"
                                  ? "2px solid #d97706"
                                  : "1px solid #d1d5db",
                              backgroundColor:
                                gsMode === "ahamove" ? "#fef3c7" : "#fff",
                              color:
                                gsMode === "ahamove" ? "#92400e" : "#6b7280",
                              cursor: "pointer",
                            }}
                          >
                            Ahamove
                          </button>
                          <button
                            onClick={() => {
                              setGsMode("manual");
                              setAhamoveError("");
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
                            Manual Entry
                          </button>
                        </div>

                        {ahamoveError && (
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
                            {ahamoveError}
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
                              placeholder="Ex: GHTK123456789"
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
                              Update
                            </button>
                          </div>
                        ) : (
                          /* Ahamove 3-step wizard */
                          <div>
                            {ahamoveStep === 1 && (
                              <div>
                                <p
                                  style={{
                                    fontWeight: 600,
                                    marginBottom: "8px",
                                    fontSize: "13px",
                                  }}
                                >
                                  Recipient Address
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
                                      Name:
                                    </label>
                                    <input
                                      type="text"
                                      value={recipientName}
                                      onChange={(e) =>
                                        setRecipientName(e.target.value)
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
                                      Phone:
                                    </label>
                                    <input
                                      type="text"
                                      value={recipientPhone}
                                      onChange={(e) =>
                                        setRecipientPhone(e.target.value)
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
                                      Full Address:{" "}
                                      <span style={{ color: "red" }}>*</span>
                                    </label>
                                    <input
                                      type="text"
                                      value={destAddress}
                                      onChange={(e) =>
                                        setDestAddress(e.target.value)
                                      }
                                      placeholder="Ex: 123 Nguyen Hue, District 1, HCMC"
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
                                      Latitude (Lat):{" "}
                                      <span style={{ color: "red" }}>*</span>
                                    </label>
                                    <input
                                      type="text"
                                      value={destLat}
                                      onChange={(e) =>
                                        setDestLat(e.target.value)
                                      }
                                      placeholder="Ex: 10.7769"
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
                                      Longitude (Lng):{" "}
                                      <span style={{ color: "red" }}>*</span>
                                    </label>
                                    <input
                                      type="text"
                                      value={destLng}
                                      onChange={(e) =>
                                        setDestLng(e.target.value)
                                      }
                                      placeholder="Ex: 106.7009"
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
                                <p
                                  style={{
                                    fontWeight: 600,
                                    marginBottom: "8px",
                                    fontSize: "13px",
                                  }}
                                >
                                  Package Information
                                </p>
                                <div style={{ marginBottom: "10px" }}>
                                  <label
                                    style={{
                                      fontSize: "12px",
                                      fontWeight: 500,
                                      color: "#374151",
                                    }}
                                  >
                                    Weight (g):
                                  </label>
                                  <input
                                    type="number"
                                    value={packageWeight}
                                    min={1}
                                    onChange={(e) =>
                                      setPackageWeight(Number(e.target.value))
                                    }
                                    style={{
                                      width: "120px",
                                      padding: "6px 10px",
                                      border: "1px solid #d1d5db",
                                      borderRadius: "6px",
                                      fontSize: "13px",
                                      marginLeft: "8px",
                                    }}
                                  />
                                </div>
                                <button
                                  onClick={handleAhamoveEstimate}
                                  disabled={ahamoveLoading}
                                  style={{
                                    padding: "8px 20px",
                                    backgroundColor: "#d97706",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: "8px",
                                    cursor: ahamoveLoading
                                      ? "not-allowed"
                                      : "pointer",
                                    fontWeight: "600",
                                    fontSize: "13px",
                                  }}
                                >
                                  {ahamoveLoading
                                    ? "Loading..."
                                    : "Get Shipping Rate →"}
                                </button>
                              </div>
                            )}

                            {ahamoveStep === 2 && (
                              <div>
                                <p
                                  style={{
                                    fontWeight: 600,
                                    marginBottom: "8px",
                                    fontSize: "13px",
                                  }}
                                >
                                  Select Service ({ahamoveServices.length} services)
                                </p>
                                <div
                                  style={{
                                    maxHeight: "200px",
                                    overflowY: "auto",
                                    marginBottom: "10px",
                                  }}
                                >
                                  {ahamoveServices.map((svc) => (
                                    <div
                                      key={svc.id || svc._id}
                                      onClick={() =>
                                        setAhamoveSelectedService(
                                          svc.id || svc._id,
                                        )
                                      }
                                      style={{
                                        padding: "10px 12px",
                                        marginBottom: "6px",
                                        borderRadius: "8px",
                                        border:
                                          ahamoveSelectedService ===
                                          (svc.id || svc._id)
                                            ? "2px solid #d97706"
                                            : "1px solid #e5e7eb",
                                        backgroundColor:
                                          ahamoveSelectedService ===
                                          (svc.id || svc._id)
                                            ? "#fef3c7"
                                            : "#fff",
                                        cursor: "pointer",
                                        fontSize: "13px",
                                      }}
                                    >
                                      <div style={{ fontWeight: 600 }}>
                                        {svc.name ||
                                          svc.serviceName ||
                                          svc.id ||
                                          "Service"}
                                      </div>
                                      <div
                                        style={{
                                          color: "#6b7280",
                                          fontSize: "12px",
                                        }}
                                      >
                                        {svc.description || ""}
                                      </div>
                                      <div
                                        style={{
                                          fontWeight: 700,
                                          color: "#d97706",
                                          marginTop: "4px",
                                        }}
                                      >
                                        {(
                                          svc.totalPrice ||
                                          svc.total_price ||
                                          svc.total_fee ||
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
                                      setAhamoveStep(1);
                                      setAhamoveServices([]);
                                      setAhamoveSelectedService(null);
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
                                    ← Back
                                  </button>
                                  <button
                                    onClick={handleAhamoveCreateOrder}
                                    disabled={
                                      !ahamoveSelectedService || ahamoveLoading
                                    }
                                    style={{
                                      padding: "8px 20px",
                                      backgroundColor: ahamoveSelectedService
                                        ? "#059669"
                                        : "#d1d5db",
                                      color: "#fff",
                                      border: "none",
                                      borderRadius: "8px",
                                      cursor:
                                        ahamoveSelectedService &&
                                        !ahamoveLoading
                                          ? "pointer"
                                          : "not-allowed",
                                      fontWeight: "600",
                                      fontSize: "13px",
                                    }}
                                  >
                                    {ahamoveLoading
                                      ? "Creating..."
                                      : "Create Shipment ✓"}
                                  </button>
                                </div>
                              </div>
                            )}

                            {ahamoveStep === 3 && (
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
                                  Creating shipment...
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
                      Process Refund
                    </label>
                    {refundConfirmed ? (
                      <p
                        style={{
                          margin: 0,
                          fontSize: "13px",
                          color: "#065f46",
                        }}
                      >
                        Refund amount entered successfully.
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
                          placeholder="Amount"
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
                          Refund
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
                      Update Status
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
                        Update
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
                    Staff Note
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
                    Close
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
    </div>
  );
}
