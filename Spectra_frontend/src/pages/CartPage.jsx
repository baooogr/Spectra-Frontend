import React, { useMemo, useState } from "react";
import "./CartPage.css";
import { useNavigate } from "react-router-dom";

export default function CartPage() {
  const [cartItems, setCartItems] = useState([
    {
      id: 1,
      name: "Kính râm Aviator Cổ điển",
      variant: "Màu: Đen",
      price: 1250000,
      quantity: 1,
      image:
        "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=200&q=80",
    },
    {
      id: 2,
      name: "Kính cận chống ánh sáng xanh",
      variant: "Độ: -2.00 | Gọng: Trong suốt",
      price: 850000,
      quantity: 2,
      image:
        "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?auto=format&fit=crop&w=200&q=80",
    },
  ]);

  const navigate = useNavigate();

  const shippingFee = 30000;

  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cartItems]);

  const total = subtotal + (cartItems.length > 0 ? shippingFee : 0);

  const formatVND = (n) =>
    n.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

  const updateQty = (id, nextQty) => {
    if (nextQty < 1) return;
    setCartItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, quantity: nextQty } : it))
    );
  };

  const removeItem = (id) => {
    setCartItems((prev) => prev.filter((it) => it.id !== id));
  };

  const clearCart = () => setCartItems([]);

  const goCheckout = () => {
    if (cartItems.length === 0) return;
    
    navigate("/checkout");
  };

  return (
    <div className="cart">
      <div className="cart__container">
        <h1 className="cart__title">Giỏ hàng</h1>

        <div className="cart__grid">
          {/* LEFT */}
          <div className="cart__left">
            {cartItems.length === 0 ? (
              <div className="cart__empty">
                <p>Giỏ hàng đang trống.</p>
                <small>Hãy thêm sản phẩm để tiếp tục mua sắm.</small>

                {/* Nút đi mua sắm (tuỳ chọn) */}
                <div style={{ marginTop: 12 }}>
                  <button
                    className="btn btn--primary"
                    onClick={() => navigate("/")}
                  >
                    Quay lại mua sắm
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="cart__list">
                  {cartItems.map((item) => (
                    <div className="cart-item" key={item.id}>
                      <img
                        className="cart-item__img"
                        src={item.image}
                        alt={item.name}
                      />

                      <div className="cart-item__info">
                        <div className="cart-item__name">{item.name}</div>
                        <div className="cart-item__variant">{item.variant}</div>

                        <div className="cart-item__bottom">
                          <div className="qty">
                            <button
                              className="qty__btn"
                              onClick={() =>
                                updateQty(item.id, item.quantity - 1)
                              }
                              aria-label="Giảm số lượng"
                            >
                              -
                            </button>
                            <span className="qty__value">{item.quantity}</span>
                            <button
                              className="qty__btn"
                              onClick={() =>
                                updateQty(item.id, item.quantity + 1)
                              }
                              aria-label="Tăng số lượng"
                            >
                              +
                            </button>
                          </div>

                          <div className="cart-item__price">
                            {formatVND(item.price * item.quantity)}
                          </div>
                        </div>
                      </div>

                      <button
                        className="cart-item__remove"
                        onClick={() => removeItem(item.id)}
                        title="Xóa sản phẩm"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                <div className="cart__actions">
                  <button className="btn btn--ghost" onClick={clearCart}>
                    Xóa tất cả
                  </button>

                  <button
                    className="btn btn--primary"
                    onClick={goCheckout}
                    disabled={cartItems.length === 0}
                    title={
                      cartItems.length === 0
                        ? "Giỏ hàng trống"
                        : "Sang trang thanh toán"
                    }
                  >
                    Tiếp tục thanh toán
                  </button>
                </div>

                {/* Hiển thị nhanh tổng tiền (tuỳ chọn) */}
                <div style={{ marginTop: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Tạm tính</span>
                    <span>{formatVND(subtotal)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Phí vận chuyển</span>
                    <span>{formatVND(shippingFee)}</span>
                  </div>
                  <div style={{ height: 1, background: "#eaeaea", margin: "10px 0" }} />
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontWeight: 700,
                    }}
                  >
                    <span>Tổng</span>
                    <span>{formatVND(total)}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* RIGHT */}
          {/*
          <div className="cart__right">
            <div className="summary">
              ...
            </div>
          </div>
          */}
        </div>
      </div>
    </div>
  );
}