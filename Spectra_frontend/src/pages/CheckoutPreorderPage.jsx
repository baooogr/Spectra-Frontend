import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { UserContext } from "../../context/UserContext";
import "./Checkout.css"; // Dùng chung CSS với trang Checkout thường để giữ nguyên bố cục

const EXCHANGE_RATE = 25400;

const formatPrice = (n) => {
    const usd = new Intl.NumberFormat("en-US", { 
        style: "currency", 
        currency: "USD", 
        minimumFractionDigits: 0, 
        maximumFractionDigits: 0 
    }).format(n || 0);
    const vnd = new Intl.NumberFormat("vi-VN").format((n || 0) * EXCHANGE_RATE);
    return `${usd} (${vnd} VND)`;
};

export default function CheckoutPreorderPage() {
    const navigate = useNavigate();
    const { cartItems, clearCart } = useCart();
    const { user } = useContext(UserContext);

    // Lọc ra các sản phẩm đặt trước
    const preorderItems = cartItems.filter(item => item.isPreorder);

    const [form, setForm] = useState({
        fullName: user?.fullName || "",
        phone: user?.phone || "",
        email: user?.email || "",
        address: user?.address || "",
        paymentMethod: "VNPAY" // Đặt trước bắt buộc phải thanh toán 100%
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    // Tính tổng tiền (Không có phí ship ở giai đoạn Preorder)
    const subtotal = preorderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shippingFee = 0; 
    const total = subtotal + shippingFee;

    useEffect(() => {
        if (preorderItems.length === 0) {
            navigate("/cart");
        }
    }, [preorderItems, navigate]);

    const onChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const placeOrder = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMsg("");

        const token = user?.token || JSON.parse(localStorage.getItem("user"))?.token;
        if (!token) {
            alert("Vui lòng đăng nhập để tiến hành đặt trước!");
            navigate("/login");
            return;
        }

        // Lấy campaignId từ sản phẩm đầu tiên
        const campaignId = preorderItems[0].campaignId;
        const expectedDate = preorderItems[0].estimatedDeliveryDate || new Date().toISOString();

        // 1. Chuẩn bị payload Items theo đúng chuẩn Swagger API
        const formattedItems = preorderItems.map(item => {
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
            if (validColorId) detail.selectedColorId = validColorId;

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

        // 2. Payload gọi API POST /api/Preorders
        // (Không truyền shippingAddress vì BE không nhận ở bước này)
        const payload = {
            campaignId: campaignId,
            expectedDate: expectedDate,
            items: formattedItems
        };

        try {
            const res = await fetch("https://myspectra.runasp.net/api/Preorders", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const result = await res.json();
                const createdPreorderId = result.id || result.preorderId;

                // 3. Gọi API thanh toán VNPay ngay lập tức
                const paymentRes = await fetch("https://myspectra.runasp.net/api/Payments", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({ 
                        paymentMethod: "vnpay", 
                        preorderId: createdPreorderId 
                    })
                });

                if (paymentRes.ok) {
                    const paymentData = await paymentRes.json();
                    if (paymentData.paymentUrl) {
                        clearCart(); 
                        window.location.href = paymentData.paymentUrl;
                        return;
                    } else {
                        setErrorMsg("Lỗi: Backend không trả về đường dẫn VNPay!");
                    }
                } else {
                    setErrorMsg("Lỗi kết nối Cổng thanh toán VNPay!");
                }
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

    if (preorderItems.length === 0) return <div style={{ textAlign: "center", padding: "50px" }}>Chưa có sản phẩm đặt trước.</div>;

    return (
        <div className="checkout">
            <div className="checkout__container">
                <h1 className="checkout__title">Thanh Toán Đặt Trước</h1>
                
                <form className="checkout__grid" onSubmit={placeOrder}>
                    <div className="checkout__form">
                        <h2>Thông tin liên hệ</h2>
                        
                        <div style={{ backgroundColor: "#eff6ff", padding: "15px", borderRadius: "8px", marginBottom: "20px", border: "1px solid #bfdbfe", fontSize: "14px", color: "#1e40af", lineHeight: "1.5" }}>
                            ℹ️ <b>Lưu ý dành cho hàng Đặt trước (Pre-order):</b><br/>
                            Địa chỉ giao hàng sẽ được hệ thống yêu cầu bạn xác nhận lại một lần nữa khi hàng về tới kho để tính cước phí. Hiện tại bạn chỉ cần điền thông tin cơ bản để chúng tôi liên hệ.
                        </div>

                        {errorMsg && <div style={{ color: 'red', backgroundColor: '#fee2e2', padding: '10px', borderRadius: '5px', marginBottom: '15px' }}>{errorMsg}</div>}
                        
                        <div className="form-row">
                            <div className="form-group">
                                <label>Họ và tên <span className="req">*</span></label>
                                <input type="text" name="fullName" value={form.fullName} onChange={onChange} required />
                            </div>
                            <div className="form-group">
                                <label>Số điện thoại (Cố định)</label>
                                <input type="tel" name="phone" value={form.phone} readOnly style={{ backgroundColor: '#e5e7eb', color: '#6b7280', cursor: 'not-allowed', outline: 'none' }} title="Vui lòng cập nhật số điện thoại ở phần hồ sơ cá nhân" placeholder={form.phone ? "" : "Đang tải SĐT..."} />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Email liên hệ</label>
                            <input type="email" name="email" value={form.email} onChange={onChange} required />
                        </div>

                        <div className="form-group">
                            <label>Địa chỉ tạm thời <span className="req">*</span></label>
                            <input type="text" name="address" value={form.address} onChange={onChange} required placeholder="Nhập địa chỉ giao hàng dự kiến" />
                        </div>

                        <div className="form-group" style={{ marginTop: '20px' }}>
                            <label style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px', display: 'block' }}>Phương thức thanh toán <span className="req">*</span></label>
                            <select name="paymentMethod" value={form.paymentMethod} disabled style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #2563eb', outline: 'none', backgroundColor: '#eff6ff', fontSize: '15px', color: "#1e40af", fontWeight: "bold" }}>
                                <option value="VNPAY">💳 Thanh toán VNPay (Bắt buộc cọc 100%)</option>
                            </select>
                        </div>
                    </div>

                    <div className="checkout__summary">
                        <h2>Đơn đặt trước của bạn</h2>
                        <div className="summary__items">
                            {preorderItems.map((item, idx) => (
                                <div className="summary__item" key={idx} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '10px' }}>
                                    <div>
                                        <div className="item__name" style={{ fontWeight: 'bold' }}>{item.name}</div>
                                        {item.lensInfo && <div style={{ fontSize: '12px', color: '#666' }}>+ {item.lensInfo.type} / {item.lensInfo.feature}</div>}
                                        <div className="item__qty" style={{ fontSize: '13px', marginTop: '4px' }}>SL: {item.quantity} | Màu: {item.color || "Mặc định"}</div>
                                        <div style={{ fontSize: "11px", backgroundColor: "#2563eb", color: "white", display: "inline-block", padding: "3px 8px", borderRadius: "12px", marginTop: "8px", fontWeight: "bold" }}>
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
                        <div className="summary__row"><span>Phí giao hàng</span><span style={{ color: "#6b7280", fontStyle: "italic", fontSize: "13px" }}>Tính sau khi hàng về</span></div>

                        <div className="summary__row summary__total" style={{ fontSize: '20px', marginTop: '15px', paddingTop: '15px', borderTop: '2px solid #ccc' }}>
                            <span>Tổng thanh toán</span><span style={{ color: '#10b981' }}>{formatPrice(total)}</span>
                        </div>

                        <button type="submit" disabled={isSubmitting} className="checkout__btn" style={{ width: '100%', padding: '16px', backgroundColor: isSubmitting ? '#9ca3af' : '#2563eb', color: 'white', fontWeight: 'bold', border: 'none', borderRadius: '8px', marginTop: '20px', cursor: isSubmitting ? 'not-allowed' : 'pointer', fontSize: '16px', transition: "0.2s" }}>
                            {isSubmitting ? "Đang chuyển hướng VNPay..." : `Thanh Toán VNPay - ${formatPrice(total)}`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}