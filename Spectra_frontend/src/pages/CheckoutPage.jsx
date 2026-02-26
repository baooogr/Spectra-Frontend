import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./CheckoutPage.css";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Nếu bạn truyền từ CartPage qua navigate("/checkout", { state: { cartItems } })
  // thì sẽ lấy được ở đây. Nếu không có thì dùng demo data.
  const initialCart =
    location.state?.cartItems ??
    [
      {
        id: 1,
        name: "Kính râm Aviator Cổ điển",
        variant: "Màu: Đen",
        price: 1250000,
        quantity: 1,
      },
      {
        id: 2,
        name: "Kính cận chống ánh sáng xanh",
        variant: "Độ: -2.00 | Gọng: Trong suốt",
        price: 850000,
        quantity: 2,
      },
    ];

  const [cartItems] = useState(initialCart);

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    note: "",
  });

  const shippingFee = 30000;

  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cartItems]);

  const total = subtotal + (cartItems.length ? shippingFee : 0);

  const formatVND = (n) =>
    n.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const placeOrder = (e) => {
    e.preventDefault();

    // Validate đơn giản
    if (!form.fullName.trim() || !form.phone.trim() || !form.address.trim()) {
      alert("Vui lòng nhập Họ tên, SĐT và Địa chỉ.");
      return;
    }
    if (cartItems.length === 0) {
      alert("Giỏ hàng trống.");
      return;
    }

    alert("Đặt hàng thành công (demo)!");
    navigate("/orders"); // hoặc navigate("/") tuỳ bạn
  };

  return (
    <div className="checkout">
      <div className="checkout__container">
        <div className="checkout__top">
          <h1 className="checkout__title">Thanh toán</h1>
          <button className="btn btn--ghost" onClick={() => navigate("/cart")}>
            ← Quay lại giỏ hàng
          </button>
        </div>

        <div className="checkout__grid">
          {/* LEFT: FORM */}
          <form className="card" onSubmit={placeOrder}>
            <h2 className="card__title">Thông tin nhận hàng</h2>

            <div className="field">
              <label>Họ và tên *</label>
              <input
                name="fullName"
                value={form.fullName}
                onChange={onChange}
                placeholder="Nguyễn Văn A"
              />
            </div>

            <div className="field">
              <label>Số điện thoại *</label>
              <input
                name="phone"
                value={form.phone}
                onChange={onChange}
                placeholder="0987xxxxxx"
              />
            </div>

            <div className="field">
              <label>Email</label>
              <input
                name="email"
                value={form.email}
                onChange={onChange}
                placeholder="email@gmail.com"
              />
            </div>

            <div className="field">
              <label>Địa chỉ *</label>
              <input
                name="address"
                value={form.address}
                onChange={onChange}
                placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
              />
            </div>

            <div className="field">
              <label>Ghi chú</label>
              <textarea
                name="note"
                value={form.note}
                onChange={onChange}
                rows={3}
                placeholder="Ví dụ: Giao giờ hành chính..."
              />
            </div>

            <button className="btn btn--full" type="submit">
              Đặt hàng
            </button>

            <small className="hint">
              * Demo UI (chưa tích hợp cổng thanh toán).
            </small>
          </form>

          {/* RIGHT: SUMMARY */}
          <div className="card">
            <h2 className="card__title">Tóm tắt đơn hàng</h2>

            <div className="order-list">
              {cartItems.map((it) => (
                <div key={it.id} className="order-item">
                  <div className="order-item__left">
                    <div className="order-item__name">{it.name}</div>
                    <div className="order-item__variant">{it.variant}</div>
                    <div className="order-item__qty">SL: {it.quantity}</div>
                  </div>
                  <div className="order-item__price">
                    {formatVND(it.price * it.quantity)}
                  </div>
                </div>
              ))}
            </div>

            <div className="line" />

            <div className="row">
              <span>Tạm tính</span>
              <span>{formatVND(subtotal)}</span>
            </div>

            <div className="row">
              <span>Phí vận chuyển</span>
              <span>{cartItems.length ? formatVND(shippingFee) : formatVND(0)}</span>
            </div>

            <div className="line" />

            <div className="row row--total">
              <span>Tổng</span>
              <span>{formatVND(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}