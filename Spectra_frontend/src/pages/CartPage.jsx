import React, { useMemo, useState } from "react";
import "./CartPage.css";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

export default function CartPage() {
  const navigate = useNavigate();
  const { cartItems, updateQty, removeItem, clearCart } = useCart();

  const shippingFee = 0; 

  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cartItems]);

  const total = subtotal + (cartItems.length > 0 ? shippingFee : 0);

  
  const formatUSD = (n) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(n);

  const goCheckout = () => {
    if (cartItems.length === 0) return;
    navigate("/checkout", { state: { cartItems } }); 
  };
   
  return (
    <div className="cart">
      <div className="cart__container">
        <h1 className="cart__title">🛒 Giỏ hàng của bạn</h1>

        <div className="cart__grid">
          {/* CỘT TRÁI */}
          <div className="cart__left">
            {cartItems.length === 0 ? (
              <div className="empty-cart" style={{textAlign: "center", padding: "40px", backgroundColor: "#f9fafb", borderRadius: "8px"}}>
                <p>Giỏ hàng trống.</p>
                <Link to="/" className="btn-continue" style={{display: "inline-block", marginTop: "10px", padding: "10px 20px", backgroundColor: "#111827", color: "white", textDecoration: "none", borderRadius: "6px"}}>Tiếp tục mua sắm</Link>
              </div>
            ) : (
              <ul className="cart__list">
                {cartItems.map((item, idx) => (
                  <li key={idx} className="cart__item" style={{display: "flex", alignItems: "center", padding: "15px", borderBottom: "1px solid #eee"}}>
                    <img src={item.image[0]} alt={item.name} style={{width: "80px", height: "80px", objectFit: "cover", borderRadius: "8px", marginRight: "15px"}} />
                    <div className="item__info" style={{flex: 1}}>
                      <h3 style={{margin: "0 0 5px 0", fontSize: "16px"}}>{item.name}</h3>
                      {/* Hiển thị kèm Tròng kính nếu có */}
                      {item.lensInfo && (
                        <p style={{margin: "0 0 5px 0", fontSize: "13px", color: "#6b7280"}}>
                          👓 Tròng: {item.lensInfo.type} - {item.lensInfo.feature} (Idx {item.lensInfo.index})
                        </p>
                      )}
                      <p style={{margin: 0, fontWeight: "bold", color: "#10b981"}}>{formatUSD(item.price)}</p>
                    </div>
                    
                    <div className="item__actions" style={{display: "flex", alignItems: "center", gap: "10px"}}>
                      <div className="quantity-ctrl" style={{display: "flex", border: "1px solid #ccc", borderRadius: "4px"}}>
                        <button onClick={() => updateQty(item.id, Math.max(1, item.quantity - 1))} style={{padding: "5px 10px", background: "none", border: "none", cursor: "pointer"}}>-</button>
                        <span style={{padding: "5px 10px", borderLeft: "1px solid #ccc", borderRight: "1px solid #ccc"}}>{item.quantity}</span>
                        <button onClick={() => updateQty(item.id, item.quantity + 1)} style={{padding: "5px 10px", background: "none", border: "none", cursor: "pointer"}}>+</button>
                      </div>
                      <button onClick={() => removeItem(item.id)} style={{background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "18px", padding: "5px"}}>🗑️</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* CỘT PHẢI */}
          {cartItems.length > 0 && (
            <div className="cart__right">
              <div className="cart__summary" style={{backgroundColor: "#f9fafb", padding: "20px", borderRadius: "8px", border: "1px solid #e5e7eb"}}>
                <h2 style={{marginTop: 0, borderBottom: "1px solid #ccc", paddingBottom: "10px"}}>Tóm tắt đơn hàng</h2>
                <div style={{display: "flex", justifyContent: "space-between", marginBottom: "10px"}}>
                  <span>Tạm tính:</span>
                  <span>{formatUSD(subtotal)}</span>
                </div>
                <div style={{display: "flex", justifyContent: "space-between", marginBottom: "15px", borderBottom: "1px solid #ccc", paddingBottom: "10px"}}>
                  <span>Phí giao hàng:</span>
                  <span>{shippingFee === 0 ? "Miễn phí" : formatUSD(shippingFee)}</span>
                </div>
                <div style={{display: "flex", justifyContent: "space-between", fontSize: "18px", fontWeight: "bold", marginBottom: "20px"}}>
                  <span>Tổng tiền:</span>
                  <span style={{color: "#10b981"}}>{formatUSD(total)}</span>
                </div>
                <button onClick={goCheckout} style={{width: "100%", padding: "12px", backgroundColor: "#111827", color: "white", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", fontSize: "16px"}}>
                  Tiến Hành Thanh Toán
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}