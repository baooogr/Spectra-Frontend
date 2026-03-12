import React, { useContext, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import "./ComplaintPage.css";

export default function ComplaintPage() {
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const [searchParams] = useSearchParams();

  const orderItemIdFromUrl = searchParams.get("orderItemId") || "";

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

  const requestTypes = useMemo(
    () => [
      { value: "return", label: "Trả hàng" },
      { value: "exchange", label: "Đổi hàng" },
      { value: "refund", label: "Hoàn tiền" },
      { value: "complaint", label: "Khiếu nại" },
      { value: "warranty", label: "Bảo hành" },
    ],
    []
  );

  const validateForm = () => {
    const newErrors = {};

    if (!formData.orderItemId.trim()) {
      newErrors.orderItemId = "Thiếu orderItemId. Vui lòng chọn sản phẩm từ đơn hàng.";
    }

    if (!formData.requestType.trim()) {
      newErrors.requestType = "Vui lòng chọn loại yêu cầu.";
    } else {
      const validTypes = ["return", "exchange", "refund", "complaint", "warranty"];
      if (!validTypes.includes(formData.requestType)) {
        newErrors.requestType = "Loại yêu cầu không hợp lệ.";
      }
    }

    if (!formData.reason.trim()) {
      newErrors.reason = "Vui lòng nhập lý do khiếu nại.";
    }

    return newErrors;
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const token = user?.token || JSON.parse(localStorage.getItem("user"))?.token;
    if (!token) {
      navigate("/login");
      return;
    }

    const newErrors = validateForm();
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    setIsLoading(true);

    try {
      const response = await fetch("https://myspectra.runasp.net/api/Complaints", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderItemId: formData.orderItemId,
          requestType: formData.requestType,
          reason: formData.reason,
          mediaUrl: formData.mediaUrl.trim() || "",
        }),
      });

      const data = await response.json().catch(() => null);

      if (response.ok) {
        setSuccessMsg("Gửi khiếu nại thành công.");
        setFormData((prev) => ({
          ...prev,
          requestType: "complaint",
          reason: "",
          mediaUrl: "",
        }));

        setTimeout(() => {
          navigate("/complaint-history");
        }, 1500);
      } else {
        setErrorMsg(data?.message || "Gửi khiếu nại thất bại.");
      }
    } catch (error) {
      setErrorMsg("Không thể kết nối đến Server.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="complaint-page">
      <div className="complaint-container">
        <div className="complaint-topbar">
          <Link to="/orders" className="back-link">
            ← Quay lại đơn hàng
          </Link>
          <Link to="/complaint-history" className="history-link">
            Lịch sử khiếu nại
          </Link>
        </div>

        <div className="complaint-card">
          <h1 className="complaint-title">Gửi khiếu nại</h1>
          <p className="complaint-subtitle">
            Tạo yêu cầu khiếu nại / đổi trả / hoàn tiền / bảo hành cho sản phẩm đã mua.
          </p>

          {errorMsg && <div className="alert error-alert">{errorMsg}</div>}
          {successMsg && <div className="alert success-alert">{successMsg}</div>}

          <form onSubmit={handleSubmit} className="complaint-form">
            <div className="form-group">
              <label htmlFor="orderItemId">Order Item ID</label>
              <input
                id="orderItemId"
                name="orderItemId"
                type="text"
                value={formData.orderItemId}
                onChange={handleChange}
                placeholder="Nhập orderItemId"
                readOnly={!!orderItemIdFromUrl}
                className={errors.orderItemId ? "input-error" : ""}
              />
              {errors.orderItemId && (
                <p className="field-error">{errors.orderItemId}</p>
              )}
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
                {requestTypes.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
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
                rows="6"
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