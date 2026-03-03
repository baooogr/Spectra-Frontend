import React, { useMemo, useState, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { UserContext } from "../context/UserContext"; 
import "./CheckoutPage.css";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(UserContext);
  const { clearCart } = useCart();

  const initialCart = location.state?.cartItems ?? [];
  const [cartItems] = useState(initialCart);

  const [form, setForm] = useState({
    fullName: "", phone: "", email: "", address: "", note: "", paymentMethod: "COD"
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const shippingFee = 0; 

  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cartItems]);

  const total = subtotal + (cartItems.length ? shippingFee : 0);

  const formatUSD = (n) => 
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(n);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const validateForm = () => {
    let err = {};
    if (!form.fullName.trim()) err.fullName = "Vui lòng nhập họ tên.";
    if (!form.phone.trim()) err.phone = "Vui lòng nhập số điện thoại.";
    if (!form.address.trim()) err.address = "Vui lòng nhập địa chỉ giao hàng.";
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  
  const placeOrder = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (cartItems.length === 0) { alert("Giỏ hàng trống."); return; }

    const token = user?.token || JSON.parse(localStorage.getItem("user"))?.token;
    if (!token) { alert("Bạn cần đăng nhập để đặt hàng."); navigate("/login"); return; }

    setIsSubmitting(true);

    try {
     
      const formattedItems = cartItems.map(item => {
        const detail = {
          frameId: String(item.id), 
          quantity: Number(item.quantity),
          unitPrice: Number(item.price)
        };
        
        
        if (item.lensInfo && item.lensInfo.typeId && item.lensInfo.featureId) {
          detail.lensTypeId = String(item.lensInfo.typeId);
          detail.lensFeatureId = String(item.lensInfo.featureId);
        } else {
          detail.lensTypeId = null;
          detail.lensFeatureId = null;
        }
        
        return detail;
      });

      const orderPayload = {
        receiverName: form.fullName,
        customerName: form.fullName, 
        phoneNumber: form.phone,
        phone: form.phone,           
        shippingAddress: form.address,
        address: form.address,       
        note: form.note,
        paymentMethod: form.paymentMethod,
        items: formattedItems,           
        orderDetails: formattedItems     
      };

      const res = await fetch("https://myspectra.runasp.net/api/Orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(orderPayload)
      });

      if (res.ok) {
        const result = await res.json();
        clearCart(); 
        navigate("/checkout-success", {
          state: {
            orderId: result.id || result.orderId || "Mới",
            customer: { fullName: form.fullName, phone: form.phone, email: form.email, address: form.address },
            total: total
          }
        });
      } else {
        
        const errorText = await res.text();
        console.error("Lỗi 400 từ Backend:", errorText);
        alert("Có lỗi từ Server: " + errorText);
      }
    } catch (err) {
      alert("Lỗi mạng: Không thể kết nối đến máy chủ.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="checkout">
      <div className="checkout__header">
        <h1 className="checkout__main-title">Thanh Toán An Toàn</h1>
        <button className="btn btn--ghost" onClick={() => navigate("/cart")}>← Quay lại giỏ hàng</button>
      </div>

      <div className="checkout__grid">
        <form className="card" onSubmit={placeOrder}>
          <h2 className="card__title">Thông tin nhận hàng</h2>
          
          <div className="field">
            <label>Họ và tên *</label>
            <input name="fullName" value={form.fullName} onChange={onChange} className={errors.fullName ? "input-error" : ""} />
            {errors.fullName && <span className="error-text">{errors.fullName}</span>}
          </div>

          <div className="field">
            <label>Số điện thoại *</label>
            <input name="phone" value={form.phone} onChange={onChange} className={errors.phone ? "input-error" : ""} />
            {errors.phone && <span className="error-text">{errors.phone}</span>}
          </div>

          <div className="field">
            <label>Địa chỉ giao hàng *</label>
            <input name="address" value={form.address} onChange={onChange} className={errors.address ? "input-error" : ""} />
            {errors.address && <span className="error-text">{errors.address}</span>}
          </div>

          <div className="field">
            <label>Ghi chú đơn hàng (Tùy chọn)</label>
            <textarea name="note" value={form.note} onChange={onChange} rows="3" />
          </div>

          <div className="field">
            <label>Phương thức thanh toán</label>
            <select name="paymentMethod" value={form.paymentMethod} onChange={onChange} style={{width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none'}}>
              <option value="COD">💵 Thanh toán khi nhận hàng (COD)</option>
              <option value="BANK_TRANSFER">💳 Chuyển khoản ngân hàng</option>
            </select>
          </div>
          
          <button type="submit" className="btn btn--primary checkout-btn" disabled={isSubmitting} style={{marginTop: '25px', padding: '15px', fontSize: '18px', width: '100%', borderRadius: '8px', border: 'none', backgroundColor: '#111827', color: 'white', fontWeight: 'bold', cursor: 'pointer'}}>
            {isSubmitting ? "⏳ Đang kết nối Server..." : "Xác Nhận Đặt Hàng"}
          </button>
        </form>

        <div className="card summary-card" style={{height: 'fit-content'}}>
          <h2 className="card__title">Đơn hàng của bạn ({cartItems.length})</h2>
          <ul className="summary-list">
            {cartItems.map((item, idx) => (
              <li key={idx} className="summary-item" style={{display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px dashed #eee'}}>
                <div style={{flex: 1}}>
                  <span style={{fontWeight: 'bold', color: '#1f2937'}}>{item.name}</span>
                  <span className="summary-qty" style={{color: '#6b7280', marginLeft: '5px'}}>x {item.quantity}</span>
                  {item.lensInfo && (
                    <div style={{fontSize: '12px', color: '#6b7280', marginTop: '4px'}}>
                      + {item.lensInfo.type}
                    </div>
                  )}
                </div>
                <span className="summary-price" style={{fontWeight: 'bold', color: '#10b981'}}>{formatUSD(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="summary-total" style={{display: 'flex', justifyContent: 'space-between', marginTop: '15px', paddingTop: '15px', borderTop: '2px solid #e5e7eb', fontSize: '20px', fontWeight: 'bold'}}>
            <span>Tổng cộng</span>
            <span style={{color: '#10b981'}}>{formatUSD(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}