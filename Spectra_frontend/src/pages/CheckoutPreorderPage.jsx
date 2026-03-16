
import React, { useState, useEffect, useContext, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import { useCart } from "../context/CartContext";
import "./CheckoutPage.css"; // Dùng chung CSS với trang Checkout thường để giữ đúng bố cục

export default function CheckoutPreorderPage() {
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const { cartItems, clearCart } = useCart();
  const location = useLocation();
  
  // Lấy items từ state hoặc cartItems, sau đó lọc CHỈ lấy hàng Pre-order
  const allItems = location.state?.cartItems || cartItems;
  const items = allItems.filter(item => item.isPreorder);

  const currentUser = user || JSON.parse(localStorage.getItem("user")) || {};

  const [form, setForm] = useState({
    fullName: currentUser.fullName || "",
    phone: "", // Sẽ được tự động điền từ API
    email: currentUser.email || "",
    address: "", // Sẽ được tự động điền từ API
    note: "",
    paymentMethod: "VNPAY" // Preorder bắt buộc thanh toán trước qua VNPay
  });

  // ⚡ GỌI API LẤY THÔNG TIN USER (Đồng bộ với Checkout thường)
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

  // Điều hướng về giỏ hàng nếu không có hàng đặt trước
  useEffect(() => {
    if (items.length === 0) {
      navigate("/cart");
    }
  }, [items, navigate]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const shippingFee = 0; // Chưa tính phí ship ở bước Pre-order
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);
  const total = subtotal + shippingFee;

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // ⚡ ĐỒNG BỘ ĐỊNH DẠNG FORMAT GIÁ TIỀN ÉP SÁT NGOẶC
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
          quantity: Number(item.quantity),
          selectedSize: item.size || "M"
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
          const validIndexId = getValidGuid(item.lensInfo.lensIndexId);

          if (validTypeId) detail.lensTypeId = validTypeId;
          if (validFeatureId) detail.featureId = validFeatureId;
          if (validPrescriptionId) detail.prescriptionId = validPrescriptionId;
          if (validIndexId) detail.lensIndexId = validIndexId;
        }

        return detail;
      });

      // 2. Payload tạo đơn ĐẶT TRƯỚC (TUÂN THỦ API Swagger)
      const payload = {
  campaignId: items[0].campaignId,
  expectedDate: items[0].estimatedDeliveryDate || new Date().toISOString(),
  shippingAddress: `[${form.fullName.trim()} - ${form.phone.trim()} - ${form.email.trim()}] ${form.address.trim()}`,
  items: formattedItems
};

      const res = await fetch("https://myspectra.runasp.net/api/Preorders", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const result = await res.json();
        const createdId = result.id || result.preorderId || result.preOrderId;

        // 3. Xử lý logic Payment VNPay (Bắt buộc)
        try {
          const paymentRes = await fetch("https://myspectra.runasp.net/api/Payments", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify({ paymentMethod: "vnpay", preorderId: createdId })
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
        const errData = await res.json();
        const detailedError = errData.errors ? JSON.stringify(errData.errors) : errData.message;
        setErrorMsg(detailedError || "Lỗi tạo đơn đặt trước từ Server.");
      }
    } catch (err) {
      setErrorMsg("Lỗi mạng! Không thể kết nối tới Server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) return <div style={{ textAlign: "center", padding: "50px" }}>Chưa có sản phẩm đặt trước nào.</div>;

  return (
    <div className="checkout">
      <div className="checkout__container">
        <h1 className="checkout__title">Thanh Toán Đặt Trước</h1>

        <form className="checkout__grid" onSubmit={placeOrder}>
          <div className="checkout__form">
            <h2>Thông tin liên hệ & Giao hàng</h2>

            {/* Thông báo đặc biệt cho đơn Pre-order */}
            

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
              <label>Địa chỉ hiện tại <span className="req">*</span></label>
              <input type="text" name="address" value={form.address} onChange={onChange} required placeholder="" />
            </div>

            <div className="form-group">
              <label>Ghi chú đơn hàng (Tùy chọn)</label>
              <textarea
                name="note"
                value={form.note}
                onChange={onChange}
                placeholder="Ghi chú thêm cho chúng tôi về đơn đặt trước..."
                style={{ width: "95%", minHeight: "110px", padding: "12px", borderRadius: "6px", border: "1px solid #d1d5db", outline: "none", fontFamily: "inherit", resize: "vertical", fontSize: "14px", lineHeight: "1.5" }}
              ></textarea>
            </div>

            <div className="form-group" style={{ marginTop: '20px' }}>
              <label style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px', display: 'block' }}>Phương thức thanh toán <span className="req">*</span></label>
              <select name="paymentMethod" value={form.paymentMethod} disabled style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #2563eb', outline: 'none', backgroundColor: '#eff6ff', fontSize: '15px', color: "#1d4ed8", fontWeight: "bold" }}>
                <option value="VNPAY">💳 Thanh toán trước 100% qua VNPay</option>
              </select>
            </div>
          </div>

          <div className="checkout__summary">
            <h2>Sản phẩm đặt trước</h2>
            <div className="summary__items">
              {items.map((item, idx) => (
                <div className="summary__item" key={idx} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '10px' }}>
                  <div>
                    <div className="item__name" style={{ fontWeight: 'bold' }}>{item.name}</div>
                    {item.lensInfo && <div style={{ fontSize: '12px', color: '#666' }}>+ {item.lensInfo.type} / {item.lensInfo.feature}</div>}
                    <div className="item__qty" style={{ fontSize: '13px' }}>SL: {item.quantity} | Màu: {item.color || "Mặc định"}</div>
                    <div style={{ fontSize: "11px", backgroundColor: "#2563eb", color: "white", display: "inline-block", padding: "2px 6px", borderRadius: "4px", marginTop: "5px" }}>
                        Giao dự kiến: {new Date(item.estimatedDeliveryDate).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                  <div className="item__price" style={{ fontWeight: 'bold', color: '#10b981', textAlign: "right" }}>
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            <div className="summary__row"><span>Tạm tính</span><span>{formatPrice(subtotal)}</span></div>
            <div className="summary__row"><span>Phí giao hàng</span><span style={{ fontStyle: "italic", fontSize: "13px", color: "#6b7280" }}>Tính sau khi hàng về</span></div>
            <div className="summary__row summary__total" style={{ fontSize: '20px', marginTop: '15px', paddingTop: '15px', borderTop: '2px solid #ccc' }}>
              <span>Tổng thanh toán</span><span style={{ color: '#10b981' }}>{formatPrice(total)}</span>
            </div>

            <button type="submit" disabled={isSubmitting} className="checkout__btn" style={{ width: '100%', padding: '15px', backgroundColor: isSubmitting ? '#9ca3af' : '#2563eb', color: 'white', fontWeight: 'bold', border: 'none', borderRadius: '8px', marginTop: '20px', cursor: isSubmitting ? 'not-allowed' : 'pointer', fontSize: '16px', transition: "0.2s" }}>
              {isSubmitting ? "Đang chuyển hướng VNPay..." : `Thanh Toán VNPay`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}