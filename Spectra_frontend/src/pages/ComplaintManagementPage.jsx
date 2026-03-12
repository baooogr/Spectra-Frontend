import React, { useEffect, useMemo, useState } from "react";
import "./ComplaintManagementPage.css";

export default function ComplaintManagementPage() {
  const [complaints, setComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const [filters, setFilters] = useState({
    keyword: "",
    status: "all",
    requestType: "all",
  });

  const [updateForm, setUpdateForm] = useState({
    status: "",
    internalNote: "",
    emailContent: "",
  });

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    setLoading(true);
    setPageError("");

    try {
      const token = localStorage.getItem("token");

      // GẮN API GET DANH SÁCH KHIẾU NẠI Ở ĐÂY
      // Ví dụ:
      // const response = await fetch("https://your-api.com/api/Complaints", {
      //   method: "GET",
      //   headers: {
      //     "Content-Type": "application/json",
      //     Authorization: `Bearer ${token}`,
      //   },
      // });
      //
      // const data = await response.json();
      //
      // if (!response.ok) {
      //   throw new Error(data.message || "Không thể tải danh sách khiếu nại.");
      // }
      //
      // setComplaints(Array.isArray(data) ? data : []);

      setComplaints([]);
    } catch (error) {
      setPageError(error.message || "Không thể kết nối đến Server.");
    } finally {
      setLoading(false);
    }
  };

  const filteredComplaints = useMemo(() => {
    return complaints.filter((item) => {
      const keyword = filters.keyword.toLowerCase();

      const matchKeyword =
        (item.id || "").toLowerCase().includes(keyword) ||
        (item.customerName || "").toLowerCase().includes(keyword) ||
        (item.customerEmail || "").toLowerCase().includes(keyword) ||
        (item.orderItemId || "").toLowerCase().includes(keyword);

      const matchStatus =
        filters.status === "all" ? true : item.status === filters.status;

      const matchType =
        filters.requestType === "all"
          ? true
          : item.requestType === filters.requestType;

      return matchKeyword && matchStatus && matchType;
    });
  }, [complaints, filters]);

  const getStatusLabel = (status) => {
    switch (status) {
      case "pending":
        return "Chờ xử lý";
      case "processing":
        return "Đang xử lý";
      case "resolved":
        return "Đã xử lý";
      case "rejected":
        return "Từ chối";
      default:
        return status || "";
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "pending":
        return "status-badge pending";
      case "processing":
        return "status-badge processing";
      case "resolved":
        return "status-badge resolved";
      case "rejected":
        return "status-badge rejected";
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
        return type || "";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleString("vi-VN");
  };

  const openDetail = (complaint) => {
    setSelectedComplaint(complaint);
    setUpdateForm({
      status: complaint.status || "",
      internalNote: complaint.internalNote || "",
      emailContent: "",
    });
    setSuccessMsg("");
  };

  const closeDetail = () => {
    setSelectedComplaint(null);
    setUpdateForm({
      status: "",
      internalNote: "",
      emailContent: "",
    });
    setSuccessMsg("");
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdateFormChange = (e) => {
    const { name, value } = e.target;
    setUpdateForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdateComplaint = async () => {
    if (!selectedComplaint) return;

    if (!updateForm.status) {
      alert("Vui lòng chọn trạng thái.");
      return;
    }

    if (!updateForm.emailContent.trim()) {
      alert("Vui lòng nhập nội dung email gửi khách.");
      return;
    }

    setActionLoading(true);
    setSuccessMsg("");

    try {
      const token = localStorage.getItem("token");

      // GẮN API UPDATE + GỬI MAIL Ở ĐÂY
      // Ví dụ:
      // const response = await fetch(
      //   `https://your-api.com/api/Complaints/${selectedComplaint.id}`,
      //   {
      //     method: "PUT",
      //     headers: {
      //       "Content-Type": "application/json",
      //       Authorization: `Bearer ${token}`,
      //     },
      //     body: JSON.stringify({
      //       status: updateForm.status,
      //       internalNote: updateForm.internalNote,
      //       emailContent: updateForm.emailContent,
      //     }),
      //   }
      // );
      //
      // const data = await response.json();
      //
      // if (!response.ok) {
      //   throw new Error(data.message || "Cập nhật thất bại");
      // }
      //
      // const updatedComplaint = data;

      const updatedComplaint = {
        ...selectedComplaint,
        status: updateForm.status,
        internalNote: updateForm.internalNote,
      };

      setComplaints((prev) =>
        prev.map((item) =>
          item.id === selectedComplaint.id ? updatedComplaint : item
        )
      );

      setSelectedComplaint(updatedComplaint);
      setSuccessMsg("Cập nhật trạng thái đơn khiếu nại thành công.");
    } catch (error) {
      alert(error.message || "Không thể cập nhật đơn khiếu nại.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="complaint-management-page">
      <div className="complaint-management-container">
        <div className="page-header">
          <h1>Quản lý đơn khiếu nại</h1>
          <p>
            Staff xem chi tiết đơn, rà soát theo business rule, gửi email kết quả
            xử lý cho khách và cập nhật trạng thái.
          </p>
        </div>

        <div className="filter-bar">
          <input
            type="text"
            name="keyword"
            placeholder="Tìm theo mã đơn, khách hàng, email, order item..."
            value={filters.keyword}
            onChange={handleFilterChange}
          />

          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Chờ xử lý</option>
            <option value="processing">Đang xử lý</option>
            <option value="resolved">Đã xử lý</option>
            <option value="rejected">Từ chối</option>
          </select>

          <select
            name="requestType"
            value={filters.requestType}
            onChange={handleFilterChange}
          >
            <option value="all">Tất cả loại yêu cầu</option>
            <option value="complaint">Khiếu nại</option>
            <option value="exchange">Đổi hàng</option>
            <option value="refund">Hoàn tiền</option>
            <option value="return">Trả hàng</option>
            <option value="warranty">Bảo hành</option>
          </select>
        </div>

        {loading && <div className="info-box">Đang tải dữ liệu...</div>}
        {pageError && <div className="error-box">{pageError}</div>}

        {!loading && !pageError && (
          <div className="table-wrapper">
            <table className="complaint-table">
              <thead>
                <tr>
                  <th>Mã đơn KN</th>
                  <th>Khách hàng</th>
                  <th>Loại yêu cầu</th>
                  <th>Trạng thái</th>
                  <th>Ngày gửi</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredComplaints.length > 0 ? (
                  filteredComplaints.map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>
                        <div className="cell-main">{item.customerName}</div>
                        <div className="cell-sub">{item.customerEmail}</div>
                      </td>
                      <td>{getRequestTypeLabel(item.requestType)}</td>
                      <td>
                        <span className={getStatusClass(item.status)}>
                          {getStatusLabel(item.status)}
                        </span>
                      </td>
                      <td>{formatDate(item.createdAt)}</td>
                      <td>
                        <button
                          className="detail-btn"
                          onClick={() => openDetail(item)}
                        >
                          Xem chi tiết
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="empty-row">
                      Không có đơn khiếu nại phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedComplaint && (
        <div className="modal-overlay" onClick={closeDetail}>
          <div
            className="modal-content large"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Chi tiết đơn khiếu nại</h2>
              <button className="close-btn" onClick={closeDetail}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-card">
                  <h3>Thông tin khiếu nại</h3>

                  <div className="detail-item">
                    <span>Mã đơn khiếu nại:</span>
                    <strong>{selectedComplaint.id}</strong>
                  </div>

                  <div className="detail-item">
                    <span>Order Item ID:</span>
                    <strong>{selectedComplaint.orderItemId}</strong>
                  </div>

                  <div className="detail-item">
                    <span>Loại yêu cầu:</span>
                    <strong>
                      {getRequestTypeLabel(selectedComplaint.requestType)}
                    </strong>
                  </div>

                  <div className="detail-item">
                    <span>Trạng thái hiện tại:</span>
                    <span className={getStatusClass(selectedComplaint.status)}>
                      {getStatusLabel(selectedComplaint.status)}
                    </span>
                  </div>

                  <div className="detail-item column">
                    <span>Lý do khách gửi:</span>
                    <p>{selectedComplaint.reason}</p>
                  </div>

                  <div className="detail-item">
                    <span>Ngày gửi:</span>
                    <strong>{formatDate(selectedComplaint.createdAt)}</strong>
                  </div>

                  <div className="detail-item column">
                    <span>Media:</span>
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
                      <p>Không có file đính kèm</p>
                    )}
                  </div>

                  {selectedComplaint.mediaUrl && (
                    <div className="image-preview">
                      <img
                        src={selectedComplaint.mediaUrl}
                        alt="Complaint media"
                      />
                    </div>
                  )}
                </div>

                <div className="detail-card">
                  <h3>Thông tin khách hàng</h3>

                  <div className="detail-item">
                    <span>Họ tên:</span>
                    <strong>{selectedComplaint.customerName}</strong>
                  </div>

                  <div className="detail-item">
                    <span>Email:</span>
                    <strong>{selectedComplaint.customerEmail}</strong>
                  </div>

                  <div className="detail-item">
                    <span>Số điện thoại:</span>
                    <strong>{selectedComplaint.customerPhone}</strong>
                  </div>
                </div>
              </div>

              <div className="update-panel">
                <h3>Xử lý đơn khiếu nại</h3>

                <div className="form-group">
                  <label>Cập nhật trạng thái</label>
                  <select
                    name="status"
                    value={updateForm.status}
                    onChange={handleUpdateFormChange}
                  >
                    <option value="">-- Chọn trạng thái --</option>
                    <option value="pending">Chờ xử lý</option>
                    <option value="processing">Đang xử lý</option>
                    <option value="resolved">Đã xử lý</option>
                    <option value="rejected">Từ chối</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Ghi chú xử lý nội bộ</label>
                  <textarea
                    name="internalNote"
                    rows="4"
                    placeholder="Nhập ghi chú nội bộ để staff/admin theo dõi..."
                    value={updateForm.internalNote}
                    onChange={handleUpdateFormChange}
                  />
                </div>

                <div className="form-group">
                  <label>Nội dung email gửi khách hàng</label>
                  <textarea
                    name="emailContent"
                    rows="6"
                    placeholder="Nhập nội dung email kết quả xử lý gửi cho khách hàng..."
                    value={updateForm.emailContent}
                    onChange={handleUpdateFormChange}
                  />
                </div>

                {successMsg && <div className="success-box">{successMsg}</div>}

                <div className="action-row">
                  <button
                    className="secondary-btn"
                    onClick={closeDetail}
                    disabled={actionLoading}
                  >
                    Đóng
                  </button>

                  <button
                    className="primary-btn"
                    onClick={handleUpdateComplaint}
                    disabled={actionLoading}
                  >
                    {actionLoading ? "Đang cập nhật..." : "Lưu xử lý"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}