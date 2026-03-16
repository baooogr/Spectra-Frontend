
import React, { useState, useEffect, useContext, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import { useCart } from "../context/CartContext";
import "./CheckoutPage.css";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const { cartItems, clearCart } = useCart();
  const location = useLocation();
  const items = location.state?.cartItems || cartItems;

  const currentUser = user || JSON.parse(localStorage.getItem("user")) || {};

  const [form, setForm] = useState({
    fullName: currentUser.fullName || "",
    phone: "", // Sẽ được tự động điền từ API
    email: currentUser.email || "",
    address: "", // Sẽ được tự động điền từ API
    note: "",
    paymentMethod: "COD"
  });

  // ⚡ GỌI API LẤY THÔNG TIN USER (GỒM CẢ SĐT VÀ ĐỊA CHỈ)
  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = currentUser.token;
      if (!token) return;
      try {
        const res = await fetch("https://myspectra.runasp.net/api/Users/me", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setForm(prev => ({
            ...prev,
            phone: data.phone || "",
            address: data.address || "",
            fullName: data.fullName || prev.fullName
          }));
        }
      } catch (err) {
        console.error("Lỗi tải thông tin cá nhân:", err);
      }
    };
    fetchUserProfile();
  }, []);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const shippingFee = 0;
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);
  const total = subtotal + shippingFee;

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // ⚡ ĐỒNG BỘ ĐỊNH DẠNG FORMAT GIÁ TIỀN ÉP SÁT NGOẶC ($175(4.593.750 VND))

  const EXCHANGE_RATE = 25400; 
  const formatPrice = (n) => {
    const usd = new Intl.NumberFormat("en-US", { 
      style: "currency", 
      currency: "USD", 
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(n || 0);
    const vnd = new Intl.NumberFormat("vi-VN").format((n || 0) * EXCHANGE_RATE);
    return `${usd}(${vnd} VND)`;
  };

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
      alert("Số điện thoại không được để trống. Vui lòng cập nhật SĐT trong phần hồ sơ cá nhân.");
      setIsSubmitting(false);
      return;
    }

    try {

      // 1. Chuẩn hóa items theo chuẩn API
      const formattedItems = items.map(item => {
        const detail = {
          frameId: String(item.id),
          quantity: Number(item.quantity)
        };

        const getValidGuid = (val) => {
          if (!val || val === "null" || val === "undefined" || val === "") return undefined;
          return String(val);
        };

        const validColorId = getValidGuid(item.colorId || item.selectedColorId);
        if (validColorId) {
          detail.selectedColorId = validColorId;
        }

        if (item.lensInfo) {
          const validTypeId = getValidGuid(item.lensInfo.typeId);
          const validFeatureId = getValidGuid(item.lensInfo.featureId);
          const validPrescriptionId = getValidGuid(item.lensInfo.prescriptionId);

          if (validTypeId) detail.lensTypeId = validTypeId;
          if (validFeatureId) detail.featureId = validFeatureId;
          if (validPrescriptionId) detail.prescriptionId = validPrescriptionId;
        }

        return detail;
      });

      // 2. Payload tạo đơn hàng
      const payload = {
        // ⚡ TRICK: Nhồi Họ tên, SĐT và Email vào đầu chuỗi địa chỉ
        shippingAddress: `[${form.fullName.trim()} - ${form.phone.trim()} - ${form.email.trim()}] ${form.address.trim()}`,
        shippingMethod: "standard",
        items: formattedItems
      };

      const res = await fetch("https://myspectra.runasp.net/api/Orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const result = await res.json();
        const createdId = result.id || result.orderId || result.orderSummaryId;

        // 3. Xử lý logic Payment

        if (form.paymentMethod === "VNPAY") {
          try {
            const paymentRes = await fetch("https://myspectra.runasp.net/api/Payments", {
              method: "POST",
              headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
              body: JSON.stringify({ paymentMethod: "vnpay", orderId: createdId })
            });

            if (paymentRes.ok) {
              const paymentData = await paymentRes.json();
              if (paymentData.paymentUrl) {

                clearCart();
                window.location.href = paymentData.paymentUrl;
                return;
              } else { alert("Lỗi: Backend không trả về Link VNPay!"); }
            } else { alert("Lỗi kết nối tạo VNPay!"); }
          } catch (err) { alert("Lỗi mạng khi tạo thanh toán VNPay"); }
        } else {

          // ⚡ ĐÃ FIX LỖI CRASH KHI TRUYỀN DỮ LIỆU SANG CHECKOUT-SUCCESS
          clearCart();
          navigate("/checkout-success", {
            state: {
              orderId: createdId, 
              customer: {
                fullName: form.fullName,
                phone: form.phone,
                address: form.address
              },
              total: total, // Truyền đúng tổng tiền thực tế
              items: items, // Truyền đúng giỏ hàng thực tế
              createdAt: new Date().toISOString() 
            }

          });
        }
      } else {
        const errData = await res.json();
        const detailedError = errData.errors ? JSON.stringify(errData.errors) : errData.message;
        setErrorMsg(detailedError || "Lỗi tạo đơn hàng từ Server.");
      }
    } catch (err) {
      setErrorMsg("Lỗi mạng! Không thể kết nối tới Server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) return <div style={{ textAlign: "center", padding: "50px" }}>Giỏ hàng trống. Không thể thanh toán.</div>;

  return (
    <div className="checkout">
      <div className="checkout__container">
        <h1 className="checkout__title">Thanh Toán</h1>

        <form className="checkout__grid" onSubmit={placeOrder}>
          <div className="checkout__form">
            <h2>Thông tin giao hàng</h2>

            {errorMsg && <div style={{ color: 'red', backgroundColor: '#fee2e2', padding: '10px', borderRadius: '5px', marginBottom: '15px' }}>{errorMsg}</div>}

            <div className="form-row">
              <div className="form-group">
                <label>Họ và tên <span className="req">*</span></label>
                <input type="text" name="fullName" value={form.fullName} onChange={onChange} required />
              </div>
              <div className="form-group">
                <label>Số điện thoại (Cố định)</label>

                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  readOnly
                  style={{ backgroundColor: '#e5e7eb', color: '#6b7280', cursor: 'not-allowed', outline: 'none' }}
                  title="Vui lòng cập nhật số điện thoại ở phần hồ sơ cá nhân"
                  placeholder={form.phone ? "" : "Đang tải SĐT..."}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Email liên hệ</label>
              <input type="email" name="email" value={form.email} onChange={onChange} />
            </div>

            <div className="form-group">
              <label>Địa chỉ giao hàng <span className="req">*</span></label>
              <input type="text" name="address" value={form.address} onChange={onChange} required />
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
                  lineHeight: "1.5"
                }}
              ></textarea>
            </div>

            <div className="form-group" style={{ marginTop: '20px' }}>
              <label style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px', display: 'block' }}>Phương thức thanh toán <span className="req">*</span></label>
              <select name="paymentMethod" value={form.paymentMethod} onChange={onChange} style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none', backgroundColor: '#f9fafb', fontSize: '15px' }}>

                <option value="COD">💵 Thanh toán tiền mặt (COD)</option>
                <option value="VNPAY">💳 Thanh toán qua VNPay (Quét mã QR / Thẻ ATM)</option>
              </select>
            </div>
          </div>

          <div className="checkout__summary">
            <h2>Đơn hàng của bạn</h2>
            <div className="summary__items">
              {items.map((item, idx) => (

                <div className="summary__item" key={idx} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '10px' }}>
                  <div>
                    <div className="item__name" style={{ fontWeight: 'bold' }}>{item.name}</div>
                    {item.lensInfo && <div style={{ fontSize: '12px', color: '#666' }}>+ {item.lensInfo.type} / {item.lensInfo.feature}</div>}
                    <div className="item__qty" style={{ fontSize: '13px' }}>SL: {item.quantity} | Màu: {item.color || "Mặc định"}</div>
                  </div>
                  <div className="item__price" style={{ fontWeight: 'bold', color: '#10b981' }}>
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            <div className="summary__row"><span>Tạm tính</span><span>{formatPrice(subtotal)}</span></div>
            <div className="summary__row"><span>Phí giao hàng</span><span>{shippingFee === 0 ? "Miễn phí" : formatPrice(shippingFee)}</span></div>
            <div className="summary__row summary__total" style={{ fontSize: '20px', marginTop: '15px', paddingTop: '15px', borderTop: '2px solid #ccc' }}>
              <span>Tổng thanh toán</span><span style={{ color: '#10b981' }}>{formatPrice(total)}</span>
            </div>

            <button type="submit" disabled={isSubmitting} className="checkout__btn" style={{ width: '100%', padding: '15px', backgroundColor: isSubmitting ? '#9ca3af' : '#111827', color: 'white', fontWeight: 'bold', border: 'none', borderRadius: '8px', marginTop: '20px', cursor: isSubmitting ? 'not-allowed' : 'pointer', fontSize: '16px' }}>
              {isSubmitting ? "Đang xử lý..." : `Xác Nhận Đặt Hàng - ${formatPrice(total)}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}