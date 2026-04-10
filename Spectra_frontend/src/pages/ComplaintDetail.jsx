import React, { useState, useEffect, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";
// import "./MyComplaints.css";

// API gốc dùng để gọi các endpoint liên quan đến complaint
const API = "https://myspectra.runasp.net/api/Complaints";

// Bản đồ trạng thái:
// Mỗi status sẽ tương ứng với:
// - text: chữ hiển thị ra giao diện
// - color: màu chữ
// - bg: màu nền badge
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

// Bản đồ loại request để đổi từ mã backend sang text đẹp hơn
const typeMap = {
  return: "Return",
  exchange: "Exchange",
  refund: "Refund",
  complaint: "Complaint",
  warranty: "Warranty",
};

// Flow chuẩn của một complaint/request
// Component sẽ dùng mảng này để:
// - xác định complaint đang ở bước thứ mấy
// - vẽ progress bar theo thứ tự bước
const statusFlow = [
  "pending",
  "under_review",
  "approved",
  "in_progress",
  "resolved",
];

// Mô tả nội dung của từng bước, tùy theo loại request
// Ví dụ:
// - exchange sẽ có bước chọn sản phẩm thay thế
// - refund sẽ có bước xử lý hoàn tiền
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

// Hàm format số theo kiểu Việt Nam
// Ví dụ: 1000000 -> 1.000.000
// Nếu n bị null/undefined thì hiện dấu —
const fmt = (n) => n?.toLocaleString("vi-VN") ?? "—";

// Component chính: hiển thị chi tiết complaint/request
export default function ComplaintDetail() {
  // Lấy id từ URL
  // Ví dụ route /complaints/15 => id = 15
  const { id } = useParams();

  // Lấy user hiện tại từ context
  const { user } = useContext(UserContext);

  // Hàm dùng để điều hướng sang trang khác bằng code
  const navigate = useNavigate();

  // State lưu toàn bộ dữ liệu complaint lấy từ API
  const [complaint, setComplaint] = useState(null);

  // State biết đang loading dữ liệu hay không
  const [loading, setLoading] = useState(true);

  // State lưu nội dung lỗi nếu gọi API thất bại
  const [error, setError] = useState("");

  // State biết đang thực hiện thao tác hủy complaint hay không
  // Dùng để disable nút và đổi text nút
  const [cancelling, setCancelling] = useState(false);

  // Lấy token:
  // - ưu tiên token trong context
  // - nếu không có thì lấy trong localStorage
  // Mục đích: khi refresh trang vẫn có thể dùng token cũ
  const token = user?.token || JSON.parse(localStorage.getItem("user"))?.token;

  // useEffect chạy khi component mount hoặc khi id/token thay đổi
  useEffect(() => {
    // Nếu không có token thì chưa đăng nhập => đá về login
    if (!token) {
      navigate("/login");
      return;
    }

    // Nếu có token thì gọi API lấy complaint detail
    fetchDetail();
  }, [id, token]);

  // Hàm gọi API để lấy chi tiết complaint
  const fetchDetail = async () => {
    try {
      // Gọi API GET /Complaints/{id}
      const res = await fetch(`${API}/${id}`, {
        headers: {
          "Content-Type": "application/json",
          // Gửi access token lên backend để xác thực
          Authorization: `Bearer ${token}`,
        },
      });

      // Nếu request thành công => parse JSON và lưu vào state complaint
      if (res.ok) setComplaint(await res.json());

      // Nếu 404 => complaint không tồn tại
      else if (res.status === 404) setError("Complaint not found.");

      // Nếu 403 => user không có quyền xem complaint này
      else if (res.status === 403)
        setError("You do not have permission to view this complaint.");

      // Các lỗi còn lại
      else setError("An error occurred while loading data.");
    } catch {
      // Nếu lỗi mạng hoặc API không kết nối được
      setError("Connection error. Please try again.");
    }

    // Dù thành công hay lỗi thì cũng tắt loading
    setLoading(false);
  };

  // Nếu đang loading thì chỉ hiện chữ Loading...
  if (loading) return <div className="mc-loading">Loading...</div>;

  // Nếu có lỗi thì hiện giao diện lỗi riêng
  if (error)
    return (
      <div style={{ textAlign: "center", padding: "60px" }}>
        <h2 style={{ color: "#dc2626" }}>{error}</h2>
        <Link to="/profile" style={{ color: "#3b82f6" }}>
          ← Back
        </Link>
      </div>
    );

  // Nếu không loading, không error nhưng complaint vẫn null
  // thì không render gì cả để tránh lỗi
  if (!complaint) return null;

  // Chuẩn hóa dữ liệu lấy từ complaint
  // toLowerCase() để so sánh dễ hơn, không sợ khác hoa/thường
  const status = (complaint.status || "").toLowerCase();
  const type = (complaint.requestType || "").toLowerCase();

  // Lấy các field thường dùng ra thành biến riêng
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

  // Biết complaint có phải do chính khách hàng hủy không
  const cancelledByCustomer = complaint.cancelledByCustomer;

  // Tạo object thông tin status để render badge
  // Trường hợp đặc biệt:
  // nếu status là cancelled và do customer tự hủy
  // thì hiển thị "You Withdrawn" thay vì "Cancelled"
  const sInfo = statusMap[
    status === "cancelled" && cancelledByCustomer
      ? "customer_cancelled"
      : status
  ] || {
    // Nếu status không nằm trong statusMap thì dùng style mặc định
    text: status,
    color: "#6b7280",
    bg: "#f3f4f6",
  };

  // Xác định bước hiện tại trong progress bar
  // Nếu bị rejected hoặc cancelled thì không dùng progress bar chuẩn nữa
  // nên currentStep = -1
  const currentStep =
    status === "rejected" || status === "cancelled"
      ? -1
      : statusFlow.indexOf(status);

  // Lấy mô tả các bước theo từng loại request
  // Nếu type lạ thì fallback sang flow của complaint
  const flowSteps = flowDescriptions[type] || flowDescriptions.complaint;

  // Chỉ cho customer hủy complaint khi complaint còn ở các trạng thái này
  const canCancel = ["pending", "under_review", "approved"].includes(status);

  // Hàm xử lý hủy complaint
  const handleCancelComplaint = async () => {
    // Xác nhận lại trước khi hủy
    if (!window.confirm("Are you sure you want to withdraw this complaint?")) return;

    // Bật trạng thái đang hủy để khóa nút
    setCancelling(true);

    try {
      // Gọi API PUT /Complaints/{reqId}/cancel
      const res = await fetch(`${API}/${reqId}/cancel`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      // Nếu hủy thành công => fetch lại detail để cập nhật UI
      if (res.ok) {
        fetchDetail();
      } else {
        // Nếu backend trả lỗi, cố gắng đọc JSON lỗi
        const err = await res.json().catch(() => null);

        // Hiện thông báo lỗi lấy từ backend nếu có
        alert(err?.message || err?.Message || "Unable to withdraw complaint.");
      }
    } catch {
      // Nếu lỗi kết nối
      alert("Connection error.");
    }

    // Tắt trạng thái đang hủy
    setCancelling(false);
  };

  return (
    <div
      style={{
        // Khung ngoài cùng của trang
        maxWidth: "850px",
        margin: "40px auto",
        padding: "20px",
        fontFamily: "sans-serif",
      }}
    >
      <Link
        to="/profile"
        style={{
          // Link quay về trang profile
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
          // Card chính chứa toàn bộ nội dung complaint detail
          backgroundColor: "#fff",
          padding: "30px",
          borderRadius: "12px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
        }}
      >
        {/* Header: tiêu đề complaint + badge status */}
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
              {/* Hiển thị loại request + chữ Detail */}
              {typeMap[type] || "Complaint"} — Detail
            </h2>

            <p
              style={{ margin: "6px 0 0", color: "#6b7280", fontSize: "14px" }}
            >
              Code:{" "}
              <b style={{ color: "#111827" }}>
                {/* Cắt 8 ký tự đầu của requestId cho ngắn gọn */}
                #{String(reqId).slice(0, 8)}
              </b>
              {" · "}
              {/* Format ngày tạo complaint */}
              {date ? new Date(date).toLocaleString("vi-VN") : ""}
            </p>
          </div>

          <span
            style={{
              // Badge trạng thái
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

        {/* Progress bar: chỉ hiển thị nếu request chưa bị reject/cancel */}
        {currentStep >= 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              marginBottom: "28px",
            }}
          >
            {statusFlow.map((s, i) => {
              // reached = bước này đã hoàn thành hoặc đang đứng tại bước này
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
                        // Hình tròn của mỗi bước
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
                      {/* Nếu đã đi qua bước này thì hiện dấu ✓
                          nếu chưa thì hiện số thứ tự bước */}
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
                      {/* Text mô tả bước, lấy theo loại request */}
                      {flowSteps[i]}
                    </span>
                  </div>

                  {/* Vẽ thanh ngang nối giữa các bước */}
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

        {/* Nếu request bị reject hoặc cancel thì hiện hộp cảnh báo riêng */}
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

        {/* Thông tin sản phẩm gốc */}
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
              {/* Nếu có ảnh sản phẩm thì hiện ảnh */}
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

                {/* Chỉ hiện size nếu có */}
                {originalItem.selectedSize && (
                  <p style={{ margin: "4px 0", fontSize: "14px" }}>
                    <b>Size:</b> {originalItem.selectedSize}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Lý do complaint/request */}
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
              // Giữ nguyên xuống dòng nếu reason có nhiều dòng
              whiteSpace: "pre-wrap",
            }}
          >
            {reason}
          </p>
        </div>

        {/* Ảnh / video / file đính kèm */}
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
              // mediaUrl có thể là một chuỗi gồm nhiều URL ngăn cách bởi dấu phẩy
              const urls = mediaUrl
                .split(",")
                .map((u) => u.trim())
                .filter(Boolean);

              // Lọc các URL được coi là ảnh
              // - có đuôi jpg, jpeg, png, gif, webp
              // - hoặc có chữ cloudinary
              const imageUrls = urls.filter(
                (u) =>
                  /\.(jpg|jpeg|png|gif|webp)/i.test(u) ||
                  u.includes("cloudinary"),
              );

              // Các URL còn lại sẽ coi là file/video/link khác
              const otherUrls = urls.filter(
                (u) =>
                  !(
                    /\.(jpg|jpeg|png|gif|webp)/i.test(u) ||
                    u.includes("cloudinary")
                  ),
              );

              return (
                <>
                  {/* Nếu có ảnh thì hiển thị dạng thumbnail */}
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

                  {/* Các file/link không phải ảnh sẽ hiện thành link */}
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

        {/* Ghi chú từ staff */}
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

        {/* =========================
            KHỐI RIÊNG THEO TỪNG TYPE
           ========================= */}

        {/* EXCHANGE */}
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
              // Nếu đã tạo replacement order thì hiện link sang order đó
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
              // Nếu complaint đã được duyệt hoặc đang xử lý
              // mà chưa có replacement order
              // thì cho user chọn sản phẩm thay thế
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
              // Nếu chưa được duyệt thì bảo user chờ
              // nếu quy trình xong rồi thì báo đã kết thúc
              <p style={{ margin: 0, fontSize: "14px", color: "#6b7280" }}>
                {status === "pending" || status === "under_review"
                  ? "Please wait for staff to review and approve your exchange request."
                  : "The exchange process has ended."}
              </p>
            )}
          </div>
        )}

        {/* RETURN */}
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
              // Nếu đã có mã tracking trả hàng thì hiện nó ra
              <div style={{ marginBottom: "12px" }}>
                <p style={{ margin: "4px 0", fontSize: "14px" }}>
                  <b>Return tracking number:</b>{" "}
                  <span style={{ color: "#1d4ed8", fontWeight: 600 }}>
                    {returnTrackingNumber}
                  </span>
                </p>
              </div>
            ) : status === "approved" || status === "in_progress" ? (
              // Nếu đã duyệt nhưng chưa có tracking number
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
              // Nếu đang chờ duyệt thì chỉ hiện trạng thái chờ
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

            {/* Nếu có số tiền refund thì hiện box tiền hoàn */}
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

                {/* Nếu có refundedAt thì báo staff sẽ liên hệ hỗ trợ */}
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

        {/* REFUND */}
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
              // Nếu đã có số tiền refund
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
                  // Nếu có refundedAt => đã hoàn tiền xong
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
                  // Nếu chưa có refundedAt => đang xử lý refund
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
              // Nếu được duyệt nhưng chưa có số tiền refund
              <p style={{ margin: 0, fontSize: "14px", color: "#374151" }}>
                Your request has been approved. Staff will process your refund
                as soon as possible.
              </p>
            ) : (
              // Nếu chưa được duyệt hoặc quy trình đã kết thúc
              <p style={{ margin: 0, fontSize: "14px", color: "#6b7280" }}>
                {status === "pending" || status === "under_review"
                  ? "Waiting for staff to review your refund request."
                  : "The refund process has ended."}
              </p>
            )}
          </div>
        )}

        {/* WARRANTY */}
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
              // Nếu có mã vận đơn bảo hành thì hiện cho user
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
              // Nếu đã duyệt nhưng staff chưa cấp tracking number
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
              // Nếu đang chờ review hoặc quy trình đã kết thúc
              <p style={{ margin: 0, fontSize: "14px", color: "#6b7280" }}>
                {status === "pending" || status === "under_review"
                  ? "Waiting for warranty request review."
                  : "The warranty process has ended."}
              </p>
            )}
          </div>
        )}

        {/* Khu vực các nút thao tác cuối trang */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginTop: "20px",
            flexWrap: "wrap",
          }}
        >
          {/* Nếu complaint cho phép sửa thì hiện nút Edit */}
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

          {/* Nếu complaint đang ở trạng thái được phép hủy thì hiện nút Withdraw */}
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

          {/* Nút quay lại profile */}
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