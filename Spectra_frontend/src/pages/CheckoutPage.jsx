import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";     // Thêm Cart Context
import { useOrder } from "../context/OrderContext";   // Thêm Order Context
import "./CheckoutPage.css";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  
  
  const { clearCart } = useCart();
  const { addOrder } = useOrder();

  const initialCart = location.state?.cartItems ?? [];
  const [cartItems] = useState(initialCart);

  const [form, setForm] = useState({
    fullName: "", phone: "", email: "", address: "", note: "",
  });

  const [errors, setErrors] = useState({});
  const shippingFee = 30000;

  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cartItems]);

  const total = subtotal + (cartItems.length ? shippingFee : 0);

  const formatVND = (n) => n.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    let newErrors = {};
    let isValid = true;
    if (!form.fullName.trim()) { newErrors.fullName = "Vui lòng nhập họ và tên"; isValid = false; }
    if (!form.phone.trim()) { newErrors.phone = "Vui lòng nhập số điện thoại"; isValid = false; } 
    else if (!/^[0-9]{10,11}$/.test(form.phone.trim())) { newErrors.phone = "Số điện thoại không hợp lệ"; isValid = false; }
    if (!form.address.trim()) { newErrors.address = "Vui lòng nhập địa chỉ giao hàng"; isValid = false; }
    setErrors(newErrors);
    return isValid;
  };

  const placeOrder = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (cartItems.length === 0) {
      alert("Giỏ hàng trống.");
      return;
    }

    const orderId = "OD" + Math.floor(100000 + Math.random() * 900000);

    
    const newOrder = {
      id: orderId,
      date: new Date().toISOString().split('T')[0], 
      status: "Pending", 
      receiver: form.fullName,
      phone: form.phone,
      address: form.address,
      total: total,
      items: cartItems.map(item => ({
        name: item.name,
        qty: item.quantity,
        price: item.price
      }))
    };

    
    addOrder(newOrder);

    
    clearCart();

    
    navigate("/checkout-success", {
      state: {
        orderId,
        customer: { fullName: form.fullName, phone: form.phone, email: form.email, address: form.address, note: form.note },
        total,
      },
    });
  };

  return (
    <div className="checkout">
      <div className="checkout__container">
        <div className="checkout__top">
          <h1 className="checkout__title">Thanh toán</h1>
          <button className="btn btn--ghost" onClick={() => navigate("/cart")}>← Quay lại giỏ hàng</button>
        </div>

        <div className="checkout__grid">
          <form className="card" onSubmit={placeOrder}>
            <h2 className="card__title">Thông tin nhận hàng</h2>
            
            <div className="field">
              <label>Họ và tên *</label>
              <input name="fullName" value={form.fullName} onChange={onChange} placeholder="Nguyễn Văn A" className={errors.fullName ? "input-error" : ""} />
              {errors.fullName && <span className="error-text">{errors.fullName}</span>}
            </div>

            <div className="field">
              <label>Số điện thoại *</label>
              <input name="phone" value={form.phone} onChange={onChange} placeholder="0987xxxxxx" className={errors.phone ? "input-error" : ""} />
              {errors.phone && <span className="error-text">{errors.phone}</span>}
            </div>

            <div className="field">
              <label>Email</label>
              <input name="email" value={form.email} onChange={onChange} placeholder="email@gmail.com" />
            </div>

            <div className="field">
              <label>Địa chỉ *</label>
              <input name="address" value={form.address} onChange={onChange} placeholder="Số nhà, đường..." className={errors.address ? "input-error" : ""} />
              {errors.address && <span className="error-text">{errors.address}</span>}
            </div>

            <div className="field">
              <label>Ghi chú</label>
              <textarea name="note" value={form.note} onChange={onChange} rows={3} placeholder="Ví dụ: Giao giờ hành chính..." />
            </div>

            <button className="btn btn--full" type="submit">Đặt hàng</button>
            <small className="hint">* Demo UI (chưa tích hợp cổng thanh toán).</small>
          </form>

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
                  <div className="order-item__price">{formatVND(it.price * it.quantity)}</div>
                </div>
              ))}
            </div>
            <div className="line" />
            <div className="row"><span>Tạm tính</span><span>{formatVND(subtotal)}</span></div>
            <div className="row"><span>Phí vận chuyển</span><span>{cartItems.length ? formatVND(shippingFee) : formatVND(0)}</span></div>
            <div className="line" />
            <div className="row row--total"><span>Tổng</span><span>{formatVND(total)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}