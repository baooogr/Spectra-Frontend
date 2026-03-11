import React, { useState, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import "./CheckoutPage.css";

export default function CheckoutPreorderPage() {
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const location = useLocation();

  const preorderItem = location.state?.preorderItem;

  const [form, setForm] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    address: user?.address || "",
    note: "",
    paymentMethod: "VNPAY",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const total = preorderItem ? preorderItem.price * preorderItem.quantity : 0;

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const formatUSD = (n) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(n);

  const placePreorder = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    // Validate form trước khi gửi
    if (!form.fullName.trim()) {
      setErrorMsg("Vui lòng nhập họ và tên.");
      setIsSubmitting(false);
      return;
    }
    if (!form.address.trim()) {
      setErrorMsg("Vui lòng nhập địa chỉ giao hàng.");
      setIsSubmitting(false);
      return;
    }

    const token =
      user?.token || JSON.parse(localStorage.getItem("user"))?.token;
    if (!token) {
      alert("Bạn chưa đăng nhập. Vui lòng đăng nhập để tiếp tục.");
      navigate("/login");
      return;
    }

    if (!preorderItem) {
      alert("Lỗi dữ liệu sản phẩm đặt trước!");
      setIsSubmitting(false);
      return;
    }

    try {
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + 30);

      // Chuẩn bị detail item
      const detail = {
        frameId: String(preorderItem.id),
        quantity: Number(preorderItem.quantity),
        selectedColor: preorderItem.color || "Default",
        lensTypeId: null,
        featureId: null,
        prescriptionId: null,
      };

      // Gắn thông tin tròng kính nếu có (UUID hợp lệ = 36 ký tự)
      if (
        preorderItem.lensInfo &&
        preorderItem.lensInfo.typeId?.length === 36 &&
        preorderItem.lensInfo.featureId?.length === 36
      ) {
        detail.lensTypeId = String(preorderItem.lensInfo.typeId);
        detail.featureId = String(preorderItem.lensInfo.featureId);
        detail.prescriptionId = preorderItem.lensInfo.prescriptionId
          ? String(preorderItem.lensInfo.prescriptionId)
          : null;
      }

      // ✅ PAYLOAD ĐẦY ĐỦ - bao gồm thông tin giao hàng
      // Phone lấy thẳng từ user context (không qua form state)
      const userPhone = user?.phone || JSON.parse(localStorage.getItem("user"))?.phone || "";
      const payload = {
        expectedDate: expectedDate.toISOString(),

        // Thông tin người nhận (bắt buộc)
        receiverName: form.fullName.trim(),
        customerName: form.fullName.trim(),
        phoneNumber: userPhone,
        receiverPhone: userPhone,
        phone: userPhone,
        shippingAddress: form.address.trim(),
        address: form.address.trim(),
        note: form.note || "",
        paymentMethod: "VNPAY",

        items: [detail],
      };

      // Debug: in payload ra console để kiểm tra
      console.log("📦 Preorder payload:", JSON.stringify(payload, null, 2));

      const res = await fetch("https://myspectra.runasp.net/api/Preorders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const result = await res.json();
        const createdPreorderId = result.id || result.preorderId;

        // Gọi API tạo thanh toán VNPay
        try {
          const paymentRes = await fetch(
            "https://myspectra.runasp.net/api/Payments",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                paymentMethod: "VNPAY",
                preorderId: createdPreorderId,
              }),
            }
          );

          if (paymentRes.ok) {
            const paymentData = await paymentRes.json();
            if (paymentData.paymentUrl) {
              window.location.href = paymentData.paymentUrl;
              return;
            } else {
              alert("Lỗi: Backend không trả về Link VNPay cho đơn đặt trước!");
            }
          } else {
            const payErr = await paymentRes.json();
            alert(
              `Lỗi kết nối tạo VNPay: ${payErr.message || "Thử lại sau"}`
            );
          }
        } catch (err) {
          alert("Lỗi mạng khi gọi cổng thanh toán VNPay");
        }
      } else {
        const errData = await res.json();

        // ✅ IN CHI TIẾT LỖI VALIDATION RA CONSOLE
        console.error("❌ API Error 400:", errData);
        if (errData.errors) {
          console.error(
            "📋 Validation errors:",
            JSON.stringify(errData.errors, null, 2)
          );
          // Hiển thị lỗi cụ thể lên UI
          const errorDetails = Object.entries(errData.errors)
            .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
            .join("\n");
          setErrorMsg(
            `Lỗi validation:\n${errorDetails}`
          );
        } else {
          setErrorMsg(
            errData.message || errData.title || "Lỗi tạo đơn đặt trước từ Server."
          );
        }
      }
    } catch (err) {
      setErrorMsg("Lỗi mạng! Không thể kết nối tới Server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!preorderItem) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        Dữ liệu không hợp lệ. Vui lòng quay lại trang sản phẩm.
      </div>
    );
  }

  return (
    <div className="checkout">
      <div className="checkout__container">
        <h1
          className="checkout__title"
          style={{ color: "#2563eb" }}
        >
          Thanh Toán Đặt Trước (Pre-Order)
        </h1>

        <div
          style={{
            backgroundColor: "#eff6ff",
            border: "1px solid #bfdbfe",
            padding: "15px",
            borderRadius: "8px",
            marginBottom: "20px",
            color: "#1e3a8a",
          }}
        >
          <strong>Chú ý:</strong> Sản phẩm này hiện đang hết hàng. Đơn Đặt
          Trước yêu cầu thanh toán ngay <strong>100% bằng VNPay</strong>. Sản
          phẩm sẽ được giao sau khoảng 30 ngày.
        </div>

        <form className="checkout__grid" onSubmit={placePreorder}>
          {/* CỘT TRÁI - FORM THÔNG TIN */}
          <div className="checkout__form">
            <h2>Thông tin giao hàng</h2>

            {errorMsg && (
              <div
                style={{
                  color: "red",
                  backgroundColor: "#fee2e2",
                  padding: "12px",
                  borderRadius: "6px",
                  marginBottom: "15px",
                  whiteSpace: "pre-line",
                  fontSize: "14px",
                }}
              >
                {errorMsg}
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label>
                  Họ và tên <span className="req">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={form.fullName}
                  onChange={onChange}
                  placeholder="Nguyễn Văn A"
                  required
                />
              </div>
              <div className="form-group">
                <label>
                  Số điện thoại{" "}
                  <span style={{ fontSize: "11px", color: "#6b7280", fontWeight: "normal", marginLeft: "4px" }}>
                    (Chỉnh sửa tại{" "}
                    <a href="/profile" style={{ color: "#2563eb", textDecoration: "underline" }}>
                      Thông tin cá nhân
                    </a>
                    )
                  </span>
                </label>
                <input
                  type="tel"
                  value={user?.phone || JSON.parse(localStorage.getItem("user"))?.phone || "Chưa cập nhật"}
                  readOnly
                  style={{
                    backgroundColor: "#f3f4f6",
                    cursor: "not-allowed",
                    color: "#374151",
                    border: "1px solid #d1d5db",
                  }}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Email liên hệ (Tùy chọn)</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={onChange}
                placeholder="example@email.com"
              />
            </div>

            <div className="form-group">
              <label>
                Địa chỉ giao hàng <span className="req">*</span>
              </label>
              <input
                type="text"
                name="address"
                value={form.address}
                onChange={onChange}
                placeholder="123 Nguyễn Trãi, Quận 1, TP.HCM"
                required
              />
            </div>

            <div className="form-group">
              <label>Ghi chú đơn hàng (Tùy chọn)</label>
              <textarea
                name="note"
                rows="3"
                value={form.note}
                onChange={onChange}
                placeholder="Giao giờ hành chính, gọi trước khi giao..."
              ></textarea>
            </div>

            <div className="form-group" style={{ marginTop: "20px" }}>
              <label
                style={{
                  fontSize: "16px",
                  fontWeight: "bold",
                  marginBottom: "10px",
                  display: "block",
                }}
              >
                Phương thức thanh toán
              </label>
              <select
                name="paymentMethod"
                value={form.paymentMethod}
                disabled
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "6px",
                  border: "1px solid #93c5fd",
                  outline: "none",
                  backgroundColor: "#dbeafe",
                  color: "#1e40af",
                  fontWeight: "bold",
                  fontSize: "15px",
                  cursor: "not-allowed",
                }}
              >
                <option value="VNPAY">💳 Thanh toán 100% qua VNPay</option>
              </select>
            </div>
          </div>

          {/* CỘT PHẢI - TÓM TẮT ĐƠN */}
          <div className="checkout__summary">
            <h2>Sản phẩm Đặt Trước</h2>
            <div className="summary__items">
              <div
                className="summary__item"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderBottom: "1px solid #eee",
                  paddingBottom: "10px",
                  marginBottom: "10px",
                }}
              >
                <div>
                  <div
                    className="item__name"
                    style={{ fontWeight: "bold", color: "#2563eb" }}
                  >
                    {preorderItem.name}
                  </div>
                  {preorderItem.lensInfo && (
                    <div style={{ fontSize: "12px", color: "#666" }}>
                      + {preorderItem.lensInfo.type} /{" "}
                      {preorderItem.lensInfo.feature}
                    </div>
                  )}
                  <div className="item__qty" style={{ fontSize: "13px" }}>
                    SL: {preorderItem.quantity} | Màu:{" "}
                    {preorderItem.color || "Mặc định"}
                  </div>
                </div>
                <div className="item__price" style={{ fontWeight: "bold" }}>
                  {formatUSD(preorderItem.price * preorderItem.quantity)}
                </div>
              </div>
            </div>

            <div
              className="summary__row summary__total"
              style={{
                fontSize: "20px",
                marginTop: "15px",
                paddingTop: "15px",
                borderTop: "2px solid #ccc",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>Tổng cần thanh toán</span>
              <span style={{ color: "#2563eb" }}>{formatUSD(total)}</span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="checkout__btn"
              style={{
                width: "100%",
                padding: "15px",
                backgroundColor: isSubmitting ? "#9ca3af" : "#2563eb",
                color: "white",
                fontWeight: "bold",
                border: "none",
                borderRadius: "8px",
                marginTop: "20px",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                fontSize: "16px",
              }}
            >
              {isSubmitting
                ? "Đang kết nối VNPay..."
                : `Thanh Toán Bằng VNPay (${formatUSD(total)})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}