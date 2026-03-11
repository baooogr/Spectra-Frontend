import React, { useMemo, useState } from "react";
import "./ComplaintPage.css";

export default function ComplaintPage() {
  // Giả lập dữ liệu userProfile lấy từ hệ thống
  const userProfile = {
    fullName: "Nguyễn Văn A",
    phone: "0901234567",
    email: "nguyenvana@gmail.com",
  };
const handleCreateComplaint = async (complaintData) => {
  setErrorMsg("");
  setSuccessMsg("");
  setIsLoading(true);

  try {
    const token = localStorage.getItem("token");

    const response = await fetch("https://myspectra.runasp.net/api/Complaints", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        orderItemId: complaintData.orderItemId,
        requestType: complaintData.requestType,
        reason: complaintData.reason,
        mediaUrl: complaintData.mediaUrl || "",
      }),
    });

    const data = await response.json();

    if (response.ok) {
      setSuccessMsg("Gửi khiếu nại thành công!");
      console.log("Complaint created:", data);
      return data;
    } else {
      setErrorMsg(data.message || "Gửi khiếu nại thất bại!");
      return null;
    }
  } catch (error) {
    setErrorMsg("Không thể kết nối đến Server.");
    return null;
  } finally {
    setIsLoading(false);
  }
};
  // Giả lập danh sách đơn hàng của customer
  const orders = [
    {
      id: "ORD001",
      date: "2026-03-01",
      total: 450000,
      items: "Áo thun nam, Quần jeans",
    },
    {
      id: "ORD002",
      date: "2026-03-05",
      total: 780000,
      items: "Giày sneaker",
    },
    {
      id: "ORD003",
      date: "2026-03-09",
      total: 320000,
      items: "Túi xách mini",
    },
  ];

  const complaintOptions = [
    "Sản phẩm bị lỗi",
    "Giao sai sản phẩm",
    "Thiếu sản phẩm",
    "Chất lượng không như mô tả",
    "Giao hàng chậm",
    "Khác",
  ];

  const [formData, setFormData] = useState({
    orderId: "",
    complaintType: "",
    otherComplaint: "",
  });

  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const selectedOrder = useMemo(() => {
    return orders.find((order) => order.id === formData.orderId);
  }, [formData.orderId]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "complaintType" && value !== "Khác"
        ? { otherComplaint: "" }
        : {}),
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.orderId) {
      newErrors.orderId = "Vui lòng chọn đơn hàng muốn khiếu nại.";
    }

    if (!userProfile.email || userProfile.email.trim() === "") {
      newErrors.email =
        "Email là bắt buộc. Vui lòng cập nhật trong User Profile.";
    }

    if (!formData.complaintType) {
      newErrors.complaintType = "Vui lòng chọn nội dung khiếu nại.";
    }

    if (
      formData.complaintType === "Khác" &&
      formData.otherComplaint.trim() === ""
    ) {
      newErrors.otherComplaint = "Vui lòng nhập nội dung khiếu nại khác.";
    }

    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = validateForm();
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    const payload = {
      orderId: formData.orderId,
      customerInfo: {
        fullName: userProfile.fullName,
        phone: userProfile.phone,
        email: userProfile.email,
      },
      complaintType: formData.complaintType,
      complaintContent:
        formData.complaintType === "Khác"
          ? formData.otherComplaint
          : formData.complaintType,
      status: "Pending",
      createdAt: new Date().toISOString(),
    };

    console.log("Complaint Payload:", payload);
    setSubmitted(true);

    setFormData({
      orderId: "",
      complaintType: "",
      otherComplaint: "",
    });
  };

  return (
    <div className="complaint-page">
      <div className="complaint-container">
        <h1 className="complaint-title">Gửi khiếu nại</h1>
        <p className="complaint-subtitle">
          Vui lòng chọn đơn hàng và nội dung khiếu nại của bạn.
        </p>

        {submitted && (
          <div className="success-message">
            Khiếu nại của bạn đã được gửi thành công.
          </div>
        )}

        <form className="complaint-form" onSubmit={handleSubmit}>
          {/* Chọn đơn hàng */}
          <div className="form-group">
            <label htmlFor="orderId">Chọn đơn hàng muốn khiếu nại</label>
            <select
              id="orderId"
              name="orderId"
              value={formData.orderId}
              onChange={handleChange}
            >
              <option value="">-- Chọn đơn hàng --</option>
              {orders.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.id} - {order.items}
                </option>
              ))}
            </select>
            {errors.orderId && <p className="error-text">{errors.orderId}</p>}
          </div>

          {/* Hiển thị thông tin đơn hàng đã chọn */}
          {selectedOrder && (
            <div className="order-info-box">
              <h3>Thông tin đơn hàng</h3>
              <p>
                <strong>Mã đơn:</strong> {selectedOrder.id}
              </p>
              <p>
                <strong>Ngày đặt:</strong> {selectedOrder.date}
              </p>
              <p>
                <strong>Sản phẩm:</strong> {selectedOrder.items}
              </p>
              <p>
                <strong>Tổng tiền:</strong> {selectedOrder.total.toLocaleString(
                  "vi-VN"
                )}{" "}
                VND
              </p>
            </div>
          )}

          {/* Thông tin cá nhân */}
          <div className="profile-box">
            <div className="profile-header">
              <h3>Thông tin cá nhân</h3>
              <span className="profile-note">
                Thông tin này được lấy từ User Profile. Muốn chỉnh sửa, vui lòng
                vào trang User Profile.
              </span>
            </div>

            <div className="profile-grid">
              <div className="form-group">
                <label>Họ và tên</label>
                <input type="text" value={userProfile.fullName} disabled />
              </div>

              <div className="form-group">
                <label>Số điện thoại</label>
                <input type="text" value={userProfile.phone} disabled />
              </div>

              <div className="form-group full-width">
                <label>Email</label>
                <input type="email" value={userProfile.email} disabled />
                {errors.email && <p className="error-text">{errors.email}</p>}
              </div>
            </div>
          </div>

          {/* Nội dung khiếu nại */}
          <div className="form-group">
            <label htmlFor="complaintType">Chọn nội dung khiếu nại</label>
            <select
              id="complaintType"
              name="complaintType"
              value={formData.complaintType}
              onChange={handleChange}
            >
              <option value="">-- Chọn nội dung --</option>
              {complaintOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {errors.complaintType && (
              <p className="error-text">{errors.complaintType}</p>
            )}
          </div>

          {/* Nếu chọn Khác thì hiện input */}
          {formData.complaintType === "Khác" && (
            <div className="form-group">
              <label htmlFor="otherComplaint">Nhập nội dung khiếu nại khác</label>
              <textarea
                id="otherComplaint"
                name="otherComplaint"
                rows="4"
                placeholder="Nhập yêu cầu khiếu nại khác của bạn..."
                value={formData.otherComplaint}
                onChange={handleChange}
              />
              {errors.otherComplaint && (
                <p className="error-text">{errors.otherComplaint}</p>
              )}
            </div>
          )}

          <button type="submit" className="submit-btn">
            Gửi khiếu nại
          </button>
        </form>
      </div>
    </div>
  );
}