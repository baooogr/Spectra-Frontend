import React, { useState, useEffect, useContext, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import { useCart } from "../context/CartContext";
import { useExchangeRate } from "../api";
import VIETNAM_PROVINCES, {
  buildAddressString,
  parseAddressString,
} from "../utils/vietnamAddress";
import { isValidVNPhone, formatPrice } from "../utils/validation";
import "./CheckoutPage.css"; // Dùng chung CSS với trang Checkout thường để giữ đúng bố cục

export default function CheckoutPreorderPage() {
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const { cartItems, clearCart } = useCart();
  const location = useLocation();
  const { rate: exchangeRate } = useExchangeRate();
  const fmtPrice = (n) => formatPrice(n, exchangeRate);

  // Lấy items từ state hoặc cartItems, sau đó lọc CHỈ lấy hàng Pre-order
  const allItems = location.state?.cartItems || cartItems;
  const items = allItems.filter((item) => item.isPreorder);

  const currentUser = user || JSON.parse(localStorage.getItem("user")) || {};

  const [form, setForm] = useState({
    fullName: currentUser.fullName || "",
    phone: "", // Sẽ được tự động điền từ API
    email: currentUser.email || "",
    province: "",
    district: "",
    ward: "",
    addressDetail: "",
    note: "",
    paymentMethod: "VNPAY", // Preorder bắt buộc thanh toán trước qua VNPay
  });

  const [phoneError, setPhoneError] = useState("");
  const [phoneManualMode, setPhoneManualMode] = useState(false);

  // ⚡ GỌI API LẤY THÔNG TIN USER (Đồng bộ với Checkout thường)
  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = currentUser.token;
      if (!token) return;
      try {
        const res = await fetch("https://myspectra.runasp.net/api/Users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const parsed = parseAddressString(data.address || "");
          setForm((prev) => ({
            ...prev,
            phone: data.phone || "",
            province: parsed.province,
            district: parsed.district,
            ward: parsed.ward,
            addressDetail: parsed.detail,
            fullName: data.fullName || prev.fullName,
          }));
          if (!data.phone) {
            setPhoneManualMode(true);
          }
        }
      } catch (err) {
        console.error("Lỗi tải thông tin cá nhân:", err);
      }
    };
    fetchUserProfile();
  }, []);

  // Fallback: if phone is still empty after 8s, let the user type it in
  useEffect(() => {
    const timer = setTimeout(() => {
      setForm((prev) => {
        if (!prev.phone) setPhoneManualMode(true);
        return prev;
      });
    }, 8000);
    return () => clearTimeout(timer);
  }, []);

  // Điều hướng về giỏ hàng nếu không có hàng đặt trước
  useEffect(() => {
    if (items.length === 0) {
      navigate("/cart");
    }
  }, [items, navigate]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const shippingFee = 0; // Chưa tính phí ship ở bước Pre-order
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  );
  const total = subtotal + shippingFee;

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const placeOrder = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    const token = currentUser.token;
    if (!token) {
      alert("Bạn chưa đăng nhập. Vui lòng đăng nhập để tiếp tục.");
      navigate("/login");
      return;
    }

    if (!form.phone) {
      alert(
        "Số điện thoại không được để trống. Vui lòng cập nhật SĐT trong phần hồ sơ cá nhân.",
      );
      setIsSubmitting(false);
      return;
    }

    if (!isValidVNPhone(form.phone)) {
      setPhoneError(
        "Số điện thoại không hợp lệ (VD: 0912345678 hoặc +84912345678)",
      );
      setIsSubmitting(false);
      return;
    }
    setPhoneError("");

    if (!form.province || !form.district || !form.ward) {
      alert("Vui lòng chọn đầy đủ Tỉnh/Thành phố, Quận/Huyện và Phường/Xã.");
      setIsSubmitting(false);
      return;
    }

    try {
      // 1. Chuẩn hóa items theo chuẩn API
      const formattedItems = items.map((item) => {
        const detail = {
          frameId: String(item.id),
          quantity: Number(item.quantity),
          selectedSize: item.size || "M",
        };

        const getValidGuid = (val) => {
          if (!val || val === "null" || val === "undefined" || val === "")
            return undefined;
          return String(val);
        };

        const validColorId = getValidGuid(item.colorId || item.selectedColorId);
        if (validColorId) {
          detail.selectedColorId = validColorId;
        }

        if (item.lensInfo) {
          const validTypeId = getValidGuid(item.lensInfo.typeId);
          const validFeatureId = getValidGuid(item.lensInfo.featureId);
          const validPrescriptionId = getValidGuid(
            item.lensInfo.prescriptionId,
          );
          const validIndexId = getValidGuid(item.lensInfo.lensIndexId);

          if (validTypeId) detail.lensTypeId = validTypeId;
          if (validFeatureId) detail.featureId = validFeatureId;
          if (validPrescriptionId) detail.prescriptionId = validPrescriptionId;
          if (validIndexId) detail.lensIndexId = validIndexId;
        }

        return detail;
      });

      // 2. Payload tạo đơn ĐẶT TRƯỚC (TUÂN THỦ API Swagger)
      const fullAddress = buildAddressString({
        province: form.province,
        district: form.district,
        ward: form.ward,
        detail: form.addressDetail,
      });
      const payload = {
        campaignId: items[0].campaignId,
        expectedDate:
          items[0].estimatedDeliveryDate || new Date().toISOString(),
        shippingAddress: `[${form.fullName.trim()} - ${form.phone.trim()} - ${form.email.trim()}] ${fullAddress}`,
        items: formattedItems,
      };

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
        const createdId = result.id || result.preorderId || result.preOrderId;

        // 3. Xử lý logic Payment VNPay (Bắt buộc)
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
                paymentMethod: "vnpay",
                preorderId: createdId,
              }),
            },
          );

          if (paymentRes.ok) {
            const paymentData = await paymentRes.json();
            if (paymentData.paymentUrl) {
              clearCart();
              window.location.href = paymentData.paymentUrl;
              return;
            } else {
              alert("Lỗi: Backend không trả về Link VNPay!");
            }
          } else {
            alert("Lỗi kết nối tạo VNPay!");
          }
        } catch (err) {
          alert("Lỗi mạng khi tạo thanh toán VNPay");
        }
      } else {
        const errData = await res.json();
        const detailedError = errData.errors
          ? JSON.stringify(errData.errors)
          : errData.message;
        setErrorMsg(detailedError || "Lỗi tạo đơn đặt trước từ Server.");
      }
    } catch (err) {
      setErrorMsg("Lỗi mạng! Không thể kết nối tới Server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0)
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        Chưa có sản phẩm đặt trước nào.
      </div>
    );

  return (
    <div className="checkout">
      <div className="checkout__container">
        <h1 className="checkout__title">Thanh Toán Đặt Trước</h1>

        <form className="checkout__grid" onSubmit={placeOrder}>
          <div className="checkout__form">
            <h2>Thông tin liên hệ & Giao hàng</h2>

            {/* Thông báo đặc biệt cho đơn Pre-order */}

            {errorMsg && (
              <div
                style={{
                  color: "red",
                  backgroundColor: "#fee2e2",
                  padding: "10px",
                  borderRadius: "5px",
                  marginBottom: "15px",
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
                  required
                />
              </div>
              <div className="form-group">
                <label>
                  {phoneManualMode
                    ? "Số điện thoại"
                    : "Số điện thoại (Cố định)"}
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={phoneManualMode ? onChange : undefined}
                  readOnly={!phoneManualMode}
                  style={
                    phoneManualMode
                      ? {}
                      : {
                          backgroundColor: "#e5e7eb",
                          color: "#6b7280",
                          cursor: "not-allowed",
                          outline: "none",
                        }
                  }
                  required
                  title={
                    phoneManualMode
                      ? "Nhập số điện thoại của bạn"
                      : "Vui lòng cập nhật số điện thoại ở phần hồ sơ cá nhân"
                  }
                  placeholder={
                    phoneManualMode
                      ? "Nhập số điện thoại..."
                      : form.phone
                        ? ""
                        : "Đang tải SĐT..."
                  }
                />
                {phoneManualMode && !form.phone && (
                  <small
                    style={{
                      color: "#d97706",
                      marginTop: "4px",
                      display: "block",
                    }}
                  >
                    Không tìm thấy SĐT trong hồ sơ. Vui lòng nhập thủ công.
                  </small>
                )}
                {phoneError && (
                  <small
                    style={{
                      color: "#dc2626",
                      marginTop: "4px",
                      display: "block",
                    }}
                  >
                    {phoneError}
                  </small>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Email liên hệ</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={onChange}
              />
            </div>

            <div className="form-group">
              <label>
                Tỉnh / Thành phố <span className="req">*</span>
              </label>
              <select
                name="province"
                value={form.province}
                onChange={(e) =>
                  setForm({
                    ...form,
                    province: e.target.value,
                    district: "",
                    ward: "",
                  })
                }
                required
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                }}
              >
                <option value="">-- Chọn Tỉnh/Thành phố --</option>
                {VIETNAM_PROVINCES.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>
                  Quận / Huyện <span className="req">*</span>
                </label>
                <select
                  name="district"
                  value={form.district}
                  onChange={(e) =>
                    setForm({ ...form, district: e.target.value, ward: "" })
                  }
                  required
                  disabled={!form.province}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #d1d5db",
                  }}
                >
                  <option value="">-- Chọn Quận/Huyện --</option>
                  {(
                    VIETNAM_PROVINCES.find((p) => p.name === form.province)
                      ?.districts || []
                  ).map((d) => (
                    <option key={d.name} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>
                  Phường / Xã <span className="req">*</span>
                </label>
                <select
                  name="ward"
                  value={form.ward}
                  onChange={(e) => setForm({ ...form, ward: e.target.value })}
                  required
                  disabled={!form.district}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #d1d5db",
                  }}
                >
                  <option value="">-- Chọn Phường/Xã --</option>
                  {(
                    VIETNAM_PROVINCES.find(
                      (p) => p.name === form.province,
                    )?.districts.find((d) => d.name === form.district)?.wards ||
                    []
                  ).map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Địa chỉ chi tiết (Số nhà, đường...)</label>
              <input
                type="text"
                name="addressDetail"
                value={form.addressDetail}
                onChange={onChange}
                placeholder="VD: Số 12, Đường Nguyễn Huệ"
              />
            </div>

            <div className="form-group">
              <label>Ghi chú đơn hàng (Tùy chọn)</label>
              <textarea
                name="note"
                value={form.note}
                onChange={onChange}
                placeholder="Ghi chú thêm cho chúng tôi về đơn đặt trước..."
                style={{
                  width: "95%",
                  minHeight: "110px",
                  padding: "12px",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  outline: "none",
                  fontFamily: "inherit",
                  resize: "vertical",
                  fontSize: "14px",
                  lineHeight: "1.5",
                }}
              ></textarea>
            </div>

            <div className="form-group" style={{ marginTop: "20px" }}>
              <label
                style={{
                  fontSize: "18px",
                  fontWeight: "bold",
                  marginBottom: "10px",
                  display: "block",
                }}
              >
                Phương thức thanh toán <span className="req">*</span>
              </label>
              <select
                name="paymentMethod"
                value={form.paymentMethod}
                disabled
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "6px",
                  border: "1px solid #2563eb",
                  outline: "none",
                  backgroundColor: "#eff6ff",
                  fontSize: "15px",
                  color: "#1d4ed8",
                  fontWeight: "bold",
                }}
              >
                <option value="VNPAY">
                  💳 Thanh toán trước 100% qua VNPay
                </option>
              </select>
            </div>
          </div>

          <div className="checkout__summary">
            <h2>Sản phẩm đặt trước</h2>
            <div className="summary__items">
              {items.map((item, idx) => (
                <div
                  className="summary__item"
                  key={idx}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    borderBottom: "1px solid #eee",
                    paddingBottom: "10px",
                    marginBottom: "10px",
                  }}
                >
                  <div>
                    <div className="item__name" style={{ fontWeight: "bold" }}>
                      {item.name}
                    </div>
                    {item.lensInfo && (
                      <div style={{ fontSize: "12px", color: "#666" }}>
                        + {item.lensInfo.type} / {item.lensInfo.feature}
                      </div>
                    )}
                    <div className="item__qty" style={{ fontSize: "13px" }}>
                      SL: {item.quantity} | Màu: {item.color || "Mặc định"}
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        backgroundColor: "#2563eb",
                        color: "white",
                        display: "inline-block",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        marginTop: "5px",
                      }}
                    >
                      Giao dự kiến:{" "}
                      {new Date(item.estimatedDeliveryDate).toLocaleDateString(
                        "vi-VN",
                      )}
                    </div>
                  </div>
                  <div
                    className="item__price"
                    style={{
                      fontWeight: "bold",
                      color: "#10b981",
                      textAlign: "right",
                    }}
                  >
                    {fmtPrice(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            <div className="summary__row">
              <span>Tạm tính</span>
              <span>{fmtPrice(subtotal)}</span>
            </div>
            <div className="summary__row">
              <span>Phí giao hàng</span>
              <span
                style={{
                  fontStyle: "italic",
                  fontSize: "13px",
                  color: "#6b7280",
                }}
              >
                Tính sau khi hàng về
              </span>
            </div>
            <div
              className="summary__row summary__total"
              style={{
                fontSize: "20px",
                marginTop: "15px",
                paddingTop: "15px",
                borderTop: "2px solid #ccc",
              }}
            >
              <span>Tổng thanh toán</span>
              <span style={{ color: "#10b981" }}>{fmtPrice(total)}</span>
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
                transition: "0.2s",
              }}
            >
              {isSubmitting ? "Đang chuyển hướng VNPay..." : `Thanh Toán VNPay`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
