import React, { useState, useEffect, useContext, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import { useCart } from "../context/CartContext";
import {
  useCurrentUser,
  useExchangeRate,
  API_BASE_URL,
  ENDPOINTS,
  buildUrl,
} from "../api";
import VIETNAM_PROVINCES, {
  buildAddressString,
  parseAddressString,
} from "../utils/vietnamAddress";
import {
  isValidVNPhone,
  formatPrice,
  formatVNDNumber,
  roundVND,
} from "../utils/validation";
import "./CheckoutPage.css";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const { cartItems, clearCart } = useCart();
  const location = useLocation();
  const items = location.state?.cartItems || cartItems;

  const currentUser = user || JSON.parse(localStorage.getItem("user")) || {};

  // Use cached user data
  const { user: apiUser } = useCurrentUser();
  const { rate: exchangeRate } = useExchangeRate();
  const fmtPrice = (n) => formatPrice(n, exchangeRate);

  const [form, setForm] = useState({
    fullName: currentUser.fullName || "",
    phone: "",
    email: currentUser.email || "",
    province: "",
    district: "",
    ward: "",
    addressDetail: "",
    note: "",
    paymentMethod: "COD",
    shippingMethod: "standard",
  });

  const [phoneError, setPhoneError] = useState("");
  const [phoneManualMode, setPhoneManualMode] = useState(false);

  // ⚡ Sync form with cached user data when available
  useEffect(() => {
    if (apiUser) {
      const parsed = parseAddressString(apiUser.address || "");
      setForm((prev) => ({
        ...prev,
        phone: apiUser.phone || prev.phone,
        fullName: apiUser.fullName || prev.fullName,
        province: parsed.province || prev.province,
        district: parsed.district || prev.district,
        ward: parsed.ward || prev.ward,
        addressDetail: parsed.detail || prev.addressDetail,
      }));
      if (!apiUser.phone) {
        setPhoneManualMode(true);
      }
    }
  }, [apiUser]);

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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [businessRules, setBusinessRules] = useState({});

  useEffect(() => {
    const fetchBusinessRules = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}${ENDPOINTS.BUSINESS_RULES.PUBLIC}`,
        );
        if (res.ok) {
          const data = await res.json();
          setBusinessRules(data || {});
        }
      } catch (err) {
        console.error("Không thể tải quy tắc vận chuyển:", err);
      }
    };
    fetchBusinessRules();
  }, []);

  // ─── SHIPPING FEE LOGIC (distance-based) ─────────────────────────────────
  // Rules: Base 20,000₫ for first 3km, +5,000₫/km beyond, max 150,000₫
  // Free shipping if order total > 1,500,000₫
  // Express = 1.5x multiplier, still capped at 150,000₫
  const parseRuleNumber = (ruleKey, defaultValue) => {
    const value = Number(businessRules?.[ruleKey]);
    return Number.isFinite(value) && value >= 0 ? value : defaultValue;
  };
  const SHIPPING_RULES = {
    BASE_FEE_VND: 20000,
    BASE_DISTANCE_KM: 3,
    PER_KM_FEE_VND: 5000,
    MAX_FEE_VND: 150000,
    FREE_THRESHOLD_VND: 1500000,
    EXPRESS_MULTIPLIER: 1.5,
  };

  const shippingRules = {
    BASE_FEE_VND: parseRuleNumber(
      "shipping.base_fee_vnd",
      SHIPPING_RULES.BASE_FEE_VND,
    ),
    BASE_DISTANCE_KM: parseRuleNumber(
      "shipping.base_distance_km",
      SHIPPING_RULES.BASE_DISTANCE_KM,
    ),
    PER_KM_FEE_VND: parseRuleNumber(
      "shipping.per_km_fee_vnd",
      SHIPPING_RULES.PER_KM_FEE_VND,
    ),
    MAX_FEE_VND: parseRuleNumber(
      "shipping.max_fee_vnd",
      SHIPPING_RULES.MAX_FEE_VND,
    ),
    FREE_THRESHOLD_VND: parseRuleNumber(
      "shipping.free_threshold_vnd",
      SHIPPING_RULES.FREE_THRESHOLD_VND,
    ),
    EXPRESS_MULTIPLIER: parseRuleNumber(
      "shipping.express_multiplier",
      SHIPPING_RULES.EXPRESS_MULTIPLIER,
    ),
  };

  // Zone → estimated distance from HCM warehouse
  const ZONE_DISTANCE_KM = {
    same_city: 10,
    southern: 80,
    central: 600,
    northern: 1500,
  };

  const CITY_ZONE_MAP = {
    "hồ chí minh": "same_city",
    "ho chi minh": "same_city",
    hcm: "same_city",
    "thủ đức": "same_city",
    "thu duc": "same_city",
    "bình dương": "southern",
    "binh duong": "southern",
    "đồng nai": "southern",
    "dong nai": "southern",
    "long an": "southern",
    "bà rịa": "southern",
    "ba ria": "southern",
    "vũng tàu": "southern",
    "vung tau": "southern",
    "tây ninh": "southern",
    "tay ninh": "southern",
    "cần thơ": "southern",
    "can tho": "southern",
    "an giang": "southern",
    "kiên giang": "southern",
    "kien giang": "southern",
    "tiền giang": "southern",
    "tien giang": "southern",
    "bến tre": "southern",
    "ben tre": "southern",
    "cà mau": "southern",
    "ca mau": "southern",
    "đà nẵng": "central",
    "da nang": "central",
    huế: "central",
    hue: "central",
    "khánh hòa": "central",
    "khanh hoa": "central",
    "nha trang": "central",
    "nghệ an": "central",
    "nghe an": "central",
    "thanh hóa": "central",
    "thanh hoa": "central",
    "quảng nam": "central",
    "quang nam": "central",
    "hà nội": "northern",
    "ha noi": "northern",
    hanoi: "northern",
    "hải phòng": "northern",
    "hai phong": "northern",
    "quảng ninh": "northern",
    "quang ninh": "northern",
    "nam định": "northern",
    "nam dinh": "northern",
    "thái nguyên": "northern",
    "thai nguyen": "northern",
  };

  const detectZone = (province) => {
    if (!province) return "southern";
    const lower = province.toLowerCase();
    for (const [key, zone] of Object.entries(CITY_ZONE_MAP)) {
      if (lower.includes(key)) return zone;
    }
    return "southern";
  };

  const currentZone = useMemo(() => detectZone(form.province), [form.province]);

  // Calculate shipping fee in VND based on distance
  const calcShippingFeeVND = (zone, method) => {
    const distKm = ZONE_DISTANCE_KM[zone] || 80;
    let fee = shippingRules.BASE_FEE_VND;
    if (distKm > shippingRules.BASE_DISTANCE_KM) {
      fee +=
        (distKm - shippingRules.BASE_DISTANCE_KM) *
        shippingRules.PER_KM_FEE_VND;
    }
    if (fee > shippingRules.MAX_FEE_VND) fee = shippingRules.MAX_FEE_VND;
    if (method === "express") {
      fee *= shippingRules.EXPRESS_MULTIPLIER;
      if (fee > shippingRules.MAX_FEE_VND) fee = shippingRules.MAX_FEE_VND;
    }
    return roundVND(fee);
  };

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  );

  const subtotalVND = subtotal * (exchangeRate || 25400);
  const isFreeShipping = subtotalVND >= shippingRules.FREE_THRESHOLD_VND;

  const shippingFeeVND = isFreeShipping
    ? 0
    : calcShippingFeeVND(currentZone, form.shippingMethod);
  // Convert VND fee to USD for backend storage
  const shippingFee = isFreeShipping
    ? 0
    : Math.round((roundVND(shippingFeeVND) / (exchangeRate || 25400)) * 100) /
      100;
  const total = subtotal + shippingFee;

  const SHIPPING_METHODS = [
    {
      key: "standard",
      label: "Giao hàng tiêu chuẩn",
      feeVND: isFreeShipping ? 0 : calcShippingFeeVND(currentZone, "standard"),
      days: "5-7 ngày",
      icon: "📦",
    },
    {
      key: "express",
      label: "Giao hàng nhanh",
      feeVND: isFreeShipping ? 0 : calcShippingFeeVND(currentZone, "express"),
      days: "2-3 ngày",
      icon: "⚡",
    },
  ];

  // Estimated delivery date range
  const getEstimatedDelivery = () => {
    const now = new Date();
    const minDays = form.shippingMethod === "express" ? 2 : 5;
    const maxDays = form.shippingMethod === "express" ? 3 : 7;
    const from = new Date(now);
    from.setDate(from.getDate() + minDays);
    const to = new Date(now);
    to.setDate(to.getDate() + maxDays);
    const fmt = (d) =>
      d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
    return `${fmt(from)} – ${fmt(to)}`;
  };

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
        "Số điện thoại không hợp lệ. Vui lòng nhập đúng SĐT Việt Nam.",
      );
      setIsSubmitting(false);
      return;
    }

    if (
      !form.province ||
      !form.district ||
      !form.ward ||
      !form.addressDetail.trim()
    ) {
      alert(
        "Vui lòng điền đầy đủ địa chỉ giao hàng (Tỉnh/Thành phố, Quận/Huyện, Phường/Xã, Địa chỉ chi tiết).",
      );
      setIsSubmitting(false);
      return;
    }

    const fullAddress = buildAddressString({
      province: form.province,
      district: form.district,
      ward: form.ward,
      detail: form.addressDetail.trim(),
    });

    try {
      // 1. Chuẩn hóa items theo chuẩn API
      const formattedItems = items.map((item) => {
        const detail = {
          frameId: String(item.id),
          quantity: Number(item.quantity),
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

      // 2. Payload tạo đơn hàng
      const ORDER_SHIPPING_ADDRESS_LIMIT = 300;
      const composedAddress = `[${form.fullName.trim()} - ${form.phone.trim()} - ${form.email.trim()}] ${fullAddress}`;

      if (composedAddress.length > ORDER_SHIPPING_ADDRESS_LIMIT) {
        setErrorMsg(
          "Địa chỉ giao hàng quá dài. Vui lòng rút gọn địa chỉ chi tiết hoặc bỏ bớt thông tin không cần thiết.",
        );
        setIsSubmitting(false);
        return;
      }

      const payload = {
        shippingAddress: composedAddress,
        shippingMethod: form.shippingMethod,
        notes: form.note || undefined,
        items: formattedItems,
      };

      console.log("[Checkout] sending order payload", payload);
      const res = await fetch("https://myspectra.runasp.net/api/OrdersV2", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const result = await res.json();
        const createdId = result.id || result.orderId || result.orderSummaryId;

        if (form.paymentMethod === "VNPAY") {
          // Wait for order creation response, then call /api/Payments, then redirect
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
                  orderId: createdId,
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
          // COD flow unchanged
          clearCart();
          navigate("/checkout-success", {
            state: {
              orderId: createdId,
              customer: {
                fullName: form.fullName,
                phone: form.phone,
                address: fullAddress,
              },
              total: total,
              items: items,
              createdAt: new Date().toISOString(),
            },
          });
        }
      } else {
        const errData = await res.json();
        const detailedError = errData.errors
          ? JSON.stringify(errData.errors)
          : errData.message;
        setErrorMsg(detailedError || "Lỗi tạo đơn hàng từ Server.");
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
        Giỏ hàng trống. Không thể thanh toán.
      </div>
    );

  return (
    <div className="checkout">
      <div className="checkout__container">
        <h1 className="checkout__title">Thanh Toán</h1>

        <form className="checkout__grid" onSubmit={placeOrder}>
          <div className="checkout__form">
            <h2>Thông tin giao hàng</h2>

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
                      color: "#ef4444",
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
                Tỉnh/Thành phố <span className="req">*</span>
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
                  Quận/Huyện <span className="req">*</span>
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
                  Phường/Xã <span className="req">*</span>
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
              <label>
                Địa chỉ chi tiết (Số nhà, đường) <span className="req">*</span>
              </label>
              <input
                type="text"
                name="addressDetail"
                value={form.addressDetail}
                onChange={onChange}
                required
                placeholder="Số nhà, tên đường..."
              />
            </div>

            <div className="form-group">
              <label>Ghi chú đơn hàng (Tùy chọn)</label>
              <textarea
                name="note"
                value={form.note}
                onChange={onChange}
                placeholder="Giao giờ hành chính, gọi trước khi giao..."
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

            {/* ── PHƯƠNG THỨC VẬN CHUYỂN ── */}
            <div style={{ marginTop: "20px" }}>
              <label
                style={{
                  fontSize: "18px",
                  fontWeight: "bold",
                  marginBottom: "12px",
                  display: "block",
                }}
              >
                Phương thức vận chuyển <span className="req">*</span>
              </label>

              {isFreeShipping && (
                <div
                  style={{
                    backgroundColor: "#d1fae5",
                    border: "1px solid #6ee7b7",
                    borderRadius: "8px",
                    padding: "10px 14px",
                    marginBottom: "12px",
                    fontSize: "14px",
                    color: "#065f46",
                    fontWeight: 600,
                  }}
                >
                  🎉 Đơn hàng trên 1.500.000₫ — Miễn phí vận chuyển!
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                {SHIPPING_METHODS.map((m) => {
                  const isSelected = form.shippingMethod === m.key;
                  const fmtVND = (v) => formatVNDNumber(v) + "₫";
                  return (
                    <label
                      key={m.key}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "14px 16px",
                        borderRadius: "10px",
                        cursor: "pointer",
                        border: isSelected
                          ? "2px solid #2563eb"
                          : "2px solid #e5e7eb",
                        backgroundColor: isSelected ? "#eff6ff" : "#f9fafb",
                        transition: "all 0.15s",
                      }}
                    >
                      <input
                        type="radio"
                        name="shippingMethod"
                        value={m.key}
                        checked={isSelected}
                        onChange={onChange}
                        style={{
                          width: "18px",
                          height: "18px",
                          accentColor: "#2563eb",
                        }}
                      />
                      <span style={{ fontSize: "20px" }}>{m.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontWeight: "bold",
                            fontSize: "15px",
                            color: "#111827",
                          }}
                        >
                          {m.label}
                        </div>
                        <div
                          style={{
                            fontSize: "13px",
                            color: "#6b7280",
                            marginTop: "2px",
                          }}
                        >
                          Dự kiến nhận hàng trong {m.days}
                        </div>
                      </div>
                      <div
                        style={{
                          fontWeight: "bold",
                          fontSize: "15px",
                          color: m.feeVND === 0 ? "#059669" : "#dc2626",
                        }}
                      >
                        {m.feeVND === 0 ? "Miễn phí" : fmtVND(m.feeVND)}
                      </div>
                    </label>
                  );
                })}
              </div>

              {/* Estimated delivery */}
              <div
                style={{
                  marginTop: "10px",
                  padding: "10px 14px",
                  backgroundColor: "#fefce8",
                  border: "1px solid #fde68a",
                  borderRadius: "8px",
                  fontSize: "13px",
                  color: "#92400e",
                }}
              >
                Dự kiến nhận hàng: <strong>{getEstimatedDelivery()}</strong>
              </div>
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
                onChange={onChange}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  outline: "none",
                  backgroundColor: "#f9fafb",
                  fontSize: "15px",
                }}
              >
                <option value="COD">Thanh toán tiền mặt (COD)</option>
                <option value="VNPAY">
                  Thanh toán qua VNPay (Quét mã QR / Thẻ ATM)
                </option>
              </select>
            </div>
          </div>

          <div className="checkout__summary">
            <h2>Đơn hàng của bạn</h2>
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
                  </div>
                  <div
                    className="item__price"
                    style={{ fontWeight: "bold", color: "#10b981" }}
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
              <span>
                Phí giao hàng (
                {
                  (
                    SHIPPING_METHODS.find(
                      (m) => m.key === form.shippingMethod,
                    ) || SHIPPING_METHODS[0]
                  ).label
                }
                )
              </span>
              <span
                style={{ color: shippingFee === 0 ? "#059669" : undefined }}
              >
                {shippingFee === 0 ? "Miễn phí" : fmtPrice(shippingFee)}
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
                backgroundColor: isSubmitting ? "#9ca3af" : "#111827",
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
                ? "Đang xử lý..."
                : `Xác Nhận Đặt Hàng - ${fmtPrice(total)}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
