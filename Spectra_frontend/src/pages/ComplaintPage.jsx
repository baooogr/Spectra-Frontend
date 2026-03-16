import React, { useContext, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import "./ComplaintPage.css";

export default function ComplaintPage() {
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const [searchParams] = useSearchParams();

  const orderItemIdFromUrl = searchParams.get("orderItemId") || "";

  const userFromStorage = JSON.parse(localStorage.getItem("user")) || {};

  const userProfile = {
    fullName: user?.fullName || userFromStorage.fullName || "Người dùng",
    phone: user?.phone || userFromStorage.phone || "Chưa cập nhật",
    email: user?.email || userFromStorage.email || "Chưa cập nhật",
  };

  const requestTypeOptions = useMemo(
    () => [
      { value: "complaint", label: "Khiếu nại" },
      { value: "return", label: "Trả hàng" },
      { value: "exchange", label: "Đổi hàng" },
      { value: "refund", label: "Hoàn tiền" },
      { value: "warranty", label: "Bảo hành" },
    ],
    []
  );

  const [formData, setFormData] = useState({
    orderItemId: orderItemIdFromUrl,
    requestType: "complaint",
    reason: "",
    mediaUrl: "",
  });

  const [errors, setErrors] = useState({});
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const getRequestTypeLabel = (value) => {
    const found = requestTypeOptions.find((item) => item.value === value);
    return found ? found.label : value;
  };

  const handleCreateComplaint = async (complaintData) => {
    setErrorMsg("");
    setSuccessMsg("");
    setIsLoading(true);

    try {
      const token = user?.token || userFromStorage?.token;

      if (!token) {
        setErrorMsg("Bạn chưa đăng nhập.");
        return null;
      }

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

      const data = await response.json().catch(() => null);

      if (response.ok) {
        setSuccessMsg("Gửi khiếu nại thành công!");
        return data;
      } else {
        setErrorMsg(data?.message || "Gửi khiếu nại thất bại!");
        return null;
      }
    } catch (error) {
      setErrorMsg("Không thể kết nối đến Server.");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));

    setErrorMsg("");
    setSuccessMsg("");
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.orderItemId.trim()) {
      newErrors.orderItemId = "Thiếu orderItemId. Vui lòng bấm từ chi tiết đơn hàng.";
    }

    const validTypes = ["return", "exchange", "refund", "complaint", "warranty"];
    if (!formData.requestType || !validTypes.includes(formData.requestType)) {
      newErrors.requestType = "Loại yêu cầu không hợp lệ.";
    }

    if (!formData.reason.trim()) {
      newErrors.reason = "Vui lòng nhập lý do khiếu nại.";
    }

    if (!userProfile.email || userProfile.email === "Chưa cập nhật") {
      newErrors.email = "Email là bắt buộc. Vui lòng cập nhật trong User Profile.";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = validateForm();
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    const result = await handleCreateComplaint({
      orderItemId: formData.orderItemId,
      requestType: formData.requestType,
      reason: formData.reason,
      mediaUrl: formData.mediaUrl,
    });

    if (result) {
      const complaintDataForSuccessPage = {
        id: result?.id || result?.complaintId || result?.requestId || null,
        title:
          result?.title ||
          `${getRequestTypeLabel(formData.requestType)} cho đơn hàng ${formData.orderItemId}`,
        requestType: result?.requestType || formData.requestType,
        requestTypeLabel: getRequestTypeLabel(result?.requestType || formData.requestType),
        content: result?.content || result?.reason || formData.reason,
        description: result?.description || "",
        reason: result?.reason || formData.reason,
        mediaUrl: result?.mediaUrl || formData.mediaUrl || "",
        status: result?.status || "Pending",
        createdAt: result?.createdAt || new Date().toISOString(),
        orderItemId: result?.orderItemId || formData.orderItemId,
        customer: {
          fullName: userProfile.fullName,
          phone: userProfile.phone,
          email: userProfile.email,
        },
      };

      setFormData((prev) => ({
        ...prev,
        requestType: "complaint",
        reason: "",
        mediaUrl: "",
      }));

      navigate("/checkout-success", {
        state: {
          complaintId: complaintDataForSuccessPage.id,
          title: complaintDataForSuccessPage.title,
          requestType: complaintDataForSuccessPage.requestTypeLabel,
          content: complaintDataForSuccessPage.content,
          createdAt: complaintDataForSuccessPage.createdAt,
          status: complaintDataForSuccessPage.status,
          complaint: complaintDataForSuccessPage,
        },
      });
    }
  };

  return (
    <div className="complaint-page">
      <div className="complaint-container">
        <div className="complaint-topbar">
          <Link to="/orders" className="back-link">
            ← Quay lại đơn hàng
          </Link>
        </div>

        <div className="complaint-card">
          <h1 className="complaint-title">Gửi khiếu nại</h1>
          <p className="complaint-subtitle">
            Tạo yêu cầu khiếu nại / đổi trả / hoàn tiền / bảo hành cho sản phẩm đã mua.
          </p>

          {errorMsg && <div className="alert error-alert">{errorMsg}</div>}
          {successMsg && <div className="alert success-alert">{successMsg}</div>}

          <form className="complaint-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="orderItemId">Order Item ID</label>
              <input
                id="orderItemId"
                name="orderItemId"
                type="text"
                value={formData.orderItemId}
                onChange={handleChange}
                readOnly={!!orderItemIdFromUrl}
                className={errors.orderItemId ? "input-error" : ""}
                placeholder="Nhập orderItemId"
              />
              {errors.orderItemId && (
                <p className="field-error">{errors.orderItemId}</p>
              )}
            </div>

            <div className="profile-box">
              <div className="profile-header">
                <h3>Thông tin cá nhân</h3>
                <span className="profile-note">
                  Thông tin này được lấy từ tài khoản người dùng. Muốn chỉnh sửa, vui lòng vào User Profile.
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
                  {errors.email && <p className="field-error">{errors.email}</p>}
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="requestType">Loại yêu cầu</label>
              <select
                id="requestType"
                name="requestType"
                value={formData.requestType}
                onChange={handleChange}
                className={errors.requestType ? "input-error" : ""}
              >
                {requestTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.requestType && (
                <p className="field-error">{errors.requestType}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="reason">Lý do</label>
              <textarea
                id="reason"
                name="reason"
                rows="5"
                value={formData.reason}
                onChange={handleChange}
                placeholder="Nhập lý do chi tiết..."
                className={errors.reason ? "input-error" : ""}
              />
              {errors.reason && <p className="field-error">{errors.reason}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="mediaUrl">Media URL (không bắt buộc)</label>
              <input
                id="mediaUrl"
                name="mediaUrl"
                type="text"
                value={formData.mediaUrl}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="secondary-btn"
                onClick={() => navigate(-1)}
                disabled={isLoading}
              >
                Huỷ
              </button>

              <button type="submit" className="primary-btn" disabled={isLoading}>
                {isLoading ? "Đang gửi..." : "Gửi khiếu nại"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}