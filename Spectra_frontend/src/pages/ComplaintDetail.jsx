import React, { useState, useEffect, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";
//import "./MyComplaints.css";

const API = "https://myspectra.runasp.net/api/Complaints";

const statusMap = {
  pending: { text: "Pending", color: "#d97706", bg: "#fef3c7" },
  under_review: { text: "Under Review", color: "#6366f1", bg: "#e0e7ff" },
  approved: { text: "Approved", color: "#059669", bg: "#d1fae5" },
  rejected: { text: "Rejected", color: "#dc2626", bg: "#fee2e2" },
  in_progress: { text: "In Progress", color: "#3b82f6", bg: "#dbeafe" },
  resolved: { text: "Resolved", color: "#10b981", bg: "#d1fae5" },
  cancelled: { text: "Cancelled", color: "#6b7280", bg: "#f3f4f6" },
  customer_cancelled: { text: "You Withdrawn", color: "#9333ea", bg: "#f3e8ff" },
};

const typeMap = {
  return: "Return",
  exchange: "Exchange",
  refund: "Refund",
  complaint: "Complaint",
  warranty: "Warranty",
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
    "Submit exchange request",
    "Staff reviews the request",
    "Request approved — Select replacement product",
    "Processing exchange — Return old product",
    "Exchange completed",
  ],
  return: [
    "Submit return request",
    "Staff reviews the request",
    "Request approved — Awaiting return instructions",
    "Return product — Awaiting refund",
    "Return & refund completed",
  ],
  refund: [
    "Submit refund request",
    "Staff reviews the request",
    "Request approved",
    "Refund is being processed",
    "Refund completed successfully",
  ],
  warranty: [
    "Submit warranty request",
    "Staff reviews the request",
    "Request approved — Awaiting shipping instructions",
    "Repairing / replacing product",
    "Warranty completed",
  ],
  complaint: [
    "Submit complaint",
    "Staff reviews",
    "Complaint approved",
    "Processing",
    "Resolved",
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
  const [cancelling, setCancelling] = useState(false);

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
      else if (res.status === 404) setError("Complaint not found.");
      else if (res.status === 403)
        setError("You do not have permission to view this complaint.");
      else setError("An error occurred while loading data.");
    } catch {
      setError("Connection error. Please try again.");
    }
    setLoading(false);
  };

  if (loading) return <div className="mc-loading">Loading...</div>;
  if (error)
    return (
      <div style={{ textAlign: "center", padding: "60px" }}>
        <h2 style={{ color: "#dc2626" }}>{error}</h2>
        <Link to="/profile" style={{ color: "#3b82f6" }}>
          ← Back
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

  const cancelledByCustomer = complaint.cancelledByCustomer;

  const sInfo = statusMap[
    status === "cancelled" && cancelledByCustomer
      ? "customer_cancelled"
      : status
  ] || {
    text: status,
    color: "#6b7280",
    bg: "#f3f4f6",
  };
  const currentStep =
    status === "rejected" || status === "cancelled"
      ? -1
      : statusFlow.indexOf(status);
  const flowSteps = flowDescriptions[type] || flowDescriptions.complaint;

  // Customer can cancel when pending, under_review, or approved
  const canCancel = ["pending", "under_review", "approved"].includes(status);

  const handleCancelComplaint = async () => {
    if (!window.confirm("Are you sure you want to withdraw this complaint?")) return;
    setCancelling(true);
    try {
      const res = await fetch(`${API}/${reqId}/cancel`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        fetchDetail();
      } else {
        const err = await res.json().catch(() => null);
        alert(err?.message || err?.Message || "Unable to withdraw complaint.");
      }
    } catch {
      alert("Connection error.");
    }
    setCancelling(false);
  };

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
        ← Back to profile page
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
              {typeMap[type] || "Complaint"} — Detail
            </h2>
            <p
              style={{ margin: "6px 0 0", color: "#6b7280", fontSize: "14px" }}
            >
              Code:{" "}
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
              ? "Request has been rejected"
              : "Request has been cancelled"}
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
              Original Product
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
                  <b>Name:</b> {originalItem.frameName || "—"}
                </p>
                <p style={{ margin: "4px 0", fontSize: "14px" }}>
                  <b>Price:</b> {fmt(originalItem.unitPrice)}$
                </p>
                <p style={{ margin: "4px 0", fontSize: "14px" }}>
                  <b>Quantity:</b> {originalItem.quantity || 1}
                </p>
                {originalItem.selectedSize && (
                  <p style={{ margin: "4px 0", fontSize: "14px" }}>
                    <b>Size:</b> {originalItem.selectedSize}
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
            Reason
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
              Attached Images/Videos
            </h4>
            {(() => {
              const urls = mediaUrl
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
                <>
                  {imageUrls.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        flexWrap: "wrap",
                        marginBottom: "10px",
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
                              width: "120px",
                              height: "120px",
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
                    <a
                      key={`link-${idx}`}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "#3b82f6",
                        display: "block",
                        marginBottom: "4px",
                      }}
                    >
                      View attachment {otherUrls.length > 1 ? idx + 1 : ""} →
                    </a>
                  ))}
                </>
              );
            })()}
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
              Staff Note
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

        {/* EXCHANGE (Exchange) */}
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
              Exchange Information
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
                  Exchange order has been created
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
                  View replacement order →
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
                  Your exchange request has been approved. You can choose a
                  replacement product right now.
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
                  Select replacement product →
                </Link>
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: "14px", color: "#6b7280" }}>
                {status === "pending" || status === "under_review"
                  ? "Please wait for staff to review and approve your exchange request."
                  : "The exchange process has ended."}
              </p>
            )}
          </div>
        )}

        {/* RETURN (Return) */}
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
              Return Information
            </h4>
            {returnTrackingNumber ? (
              <div style={{ marginBottom: "12px" }}>
                <p style={{ margin: "4px 0", fontSize: "14px" }}>
                  <b>Return tracking number:</b>{" "}
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
                Your request has been approved. Please wait for staff to provide
                the return tracking number.
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
                  ? "Waiting for review."
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
                  Refund amount: {fmt(refundAmount)}$
                </p>
                {refundedAt && (
                  <p style={{ margin: 0, fontSize: "13px", color: "#047857" }}>
                    Staff will contact you by phone number or email to assist
                    with the refund.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* REFUND (Refund) */}
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
              Refund Information
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
                    Refunded on{" "}
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
                    Processing refund...
                  </p>
                )}
              </div>
            ) : status === "approved" || status === "in_progress" ? (
              <p style={{ margin: 0, fontSize: "14px", color: "#374151" }}>
                Your request has been approved. Staff will process your refund
                as soon as possible.
              </p>
            ) : (
              <p style={{ margin: 0, fontSize: "14px", color: "#6b7280" }}>
                {status === "pending" || status === "under_review"
                  ? "Waiting for staff to review your refund request."
                  : "The refund process has ended."}
              </p>
            )}
          </div>
        )}

        {/* WARRANTY (Warranty) */}
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
              Warranty Information
            </h4>
            {returnTrackingNumber ? (
              <div style={{ marginBottom: "12px" }}>
                <p style={{ margin: "4px 0", fontSize: "14px" }}>
                  <b>Warranty shipment tracking number:</b>{" "}
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
                  Please send the product to the warranty center using the
                  tracking number above.
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
                Your warranty request has been approved. Please wait for staff
                to provide the tracking number to send the product.
              </p>
            ) : (
              <p style={{ margin: 0, fontSize: "14px", color: "#6b7280" }}>
                {status === "pending" || status === "under_review"
                  ? "Waiting for warranty request review."
                  : "The warranty process has ended."}
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
              Edit complaint
            </Link>
          )}
          {canCancel && (
            <button
              onClick={handleCancelComplaint}
              disabled={cancelling}
              style={{
                padding: "10px 20px",
                backgroundColor: "#dc2626",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: cancelling ? "not-allowed" : "pointer",
                fontWeight: "600",
                fontSize: "14px",
              }}
            >
              {cancelling ? "Cancelling..." : "Withdraw complaint"}
            </button>
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
            Back to profile page
          </Link>
        </div>
      </div>
    </div>
  );
}
