import React, { useEffect, useState } from "react";
import "./ComplaintHistoryPage.css";

export default function ComplaintHistoryPage() {
  const [complaints, setComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetchComplaintHistory();
  }, []);

  const fetchComplaintHistory = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      const token = localStorage.getItem("token");

      // TODO: thay endpoint này bằng API GET thật của backend
      // Ví dụ có thể là:
      // GET https://myspectra.runasp.net/api/Complaints/my
      // hoặc GET https://myspectra.runasp.net/api/Complaints
      //
      // const response = await fetch("https://myspectra.runasp.net/api/Complaints/my", {
      //   method: "GET",
      //   headers: {
      //     "Content-Type": "application/json",
      //     Authorization: `Bearer ${token}`,
      //   },
      // });
      //
      // const data = await response.json();
      //
      // if (response.ok) {
      //   setComplaints(Array.isArray(data) ? data : []);
      // } else {
      //   setErrorMsg(data.message || "Không thể tải lịch sử khiếu nại.");
      // }

      // Mock data tạm thời để chạy giao diện trước
      const mockData = [
        {
          id: "CP001",
          orderItemId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          requestType: "complaint",
          reason: "Sản phẩm bị trầy xước khi nhận hàng.",
          mediaUrl: "https://via.placeholder.com/300",
          status: "pending",
          createdAt: "2026-03-10T09:30:00",
          canModify: true,
        },
        {
          id: "CP002",
          orderItemId: "4ab85f64-5717-4562-b3fc-2c963f66afa7",
          requestType: "exchange",
          reason: "Sản phẩm giao sai màu so với đơn đặt hàng.",
          mediaUrl: "",
          status: "approved",
          createdAt: "2026-03-08T14:15:00",
          canModify: false,
        },
        {
          id: "CP003",
          orderItemId: "5cd85f64-5717-4562-b3fc-2c963f66afa8",
          requestType: "refund",
          reason: "Kính bị lỗi gọng, muốn hoàn tiền.",
          mediaUrl: "",
          status: "rejected",
          createdAt: "2026-03-05T11:20:00",
          canModify: false,
        },
      ];

      setComplaints(mockData);
    } catch (error) {
      setErrorMsg("Không thể kết nối đến Server.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "pending":
        return "Đang chờ xử lý";
      case "approved":
        return "Đã chấp nhận";
      case "rejected":
        return "Đã từ chối";
      case "processing":
        return "Đang xử lý";
      case "completed":
        return "Hoàn tất";
      default:
        return status;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "pending":
        return "status-badge pending";
      case "approved":
        return "status-badge approved";
      case "rejected":
        return "status-badge rejected";
      case "processing":
        return "status-badge processing";
      case "completed":
        return "status-badge completed";
      default:
        return "status-badge";
    }
  };

  const getRequestTypeLabel = (type) => {
    switch (type) {
      case "return":
        return "Trả hàng";
      case "exchange":
        return "Đổi hàng";
      case "refund":
        return "Hoàn tiền";
      case "complaint":
        return "Khiếu nại";
      case "warranty":
        return "Bảo hành";
      default:
        return type;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleString("vi-VN");
  };

  return (
    <div className="complaint-history-page">
      <div className="complaint-history-container">
        <div className="page-header">
          <h1>Lịch sử khiếu nại</h1>
          <p>Xem các yêu cầu khiếu nại, đổi trả, hoàn tiền và trạng thái xử lý.</p>
        </div>

        {loading && <div className="info-box">Đang tải dữ liệu...</div>}

        {errorMsg && <div className="error-box">{errorMsg}</div>}

        {!loading && !errorMsg && complaints.length === 0 && (
          <div className="empty-box">Bạn chưa có khiếu nại nào.</div>
        )}

        {!loading && !errorMsg && complaints.length > 0 && (
          <div className="history-list">
            {complaints.map((item) => (
              <div className="history-card" key={item.id}>
                <div className="history-card-top">
                  <div>
                    <h3>Mã khiếu nại: {item.id}</h3>
                    <p>
                      <strong>Loại yêu cầu:</strong> {getRequestTypeLabel(item.requestType)}
                    </p>
                    <p>
                      <strong>Mã Order Item:</strong> {item.orderItemId}
                    </p>
                    <p>
                      <strong>Ngày gửi:</strong> {formatDate(item.createdAt)}
                    </p>
                  </div>

                  <div className={getStatusClass(item.status)}>
                    {getStatusLabel(item.status)}
                  </div>
                </div>

                <div className="history-card-body">
                  <p>
                    <strong>Lý do:</strong> {item.reason}
                  </p>
                </div>

                <div className="history-card-actions">
                  <button
                    className="detail-btn"
                    onClick={() => setSelectedComplaint(item)}
                  >
                    Xem chi tiết
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedComplaint && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedComplaint(null)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Chi tiết khiếu nại</h2>
              <button
                className="close-btn"
                onClick={() => setSelectedComplaint(null)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-row">
                <span className="detail-label">Mã khiếu nại:</span>
                <span>{selectedComplaint.id}</span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Order Item ID:</span>
                <span>{selectedComplaint.orderItemId}</span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Loại yêu cầu:</span>
                <span>{getRequestTypeLabel(selectedComplaint.requestType)}</span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Trạng thái:</span>
                <span className={getStatusClass(selectedComplaint.status)}>
                  {getStatusLabel(selectedComplaint.status)}
                </span>
              </div>

              <div className="detail-row column">
                <span className="detail-label">Lý do:</span>
                <p className="detail-reason">{selectedComplaint.reason}</p>
              </div>

              <div className="detail-row">
                <span className="detail-label">Ngày gửi:</span>
                <span>{formatDate(selectedComplaint.createdAt)}</span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Có thể chỉnh sửa:</span>
                <span>{selectedComplaint.canModify ? "Có" : "Không"}</span>
              </div>

              <div className="detail-row column">
                <span className="detail-label">Media URL:</span>
                {selectedComplaint.mediaUrl ? (
                  <a
                    href={selectedComplaint.mediaUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="media-link"
                  >
                    Xem file đính kèm
                  </a>
                ) : (
                  <span>Không có</span>
                )}
              </div>

              {selectedComplaint.mediaUrl && (
                <div className="preview-box">
                  <img
                    src={selectedComplaint.mediaUrl}
                    alt="Complaint media"
                    className="preview-image"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}