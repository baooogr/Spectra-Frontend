
import React, { useMemo } from "react";
import "./CartPage.css";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useExchangeRate } from "../api";
import { formatVNDNumber, roundVND } from "../utils/validation";

export default function CartPage() {
  const navigate = useNavigate();
  const { cartItems, updateQty, removeItem } = useCart();
  const { rate: exchangeRate } = useExchangeRate();

  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cartItems]);

  const formatUSD = (n) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(n);
  const formatVND = (usd) => {
    const vnd = usd * exchangeRate;
    return `${formatVNDNumber(vnd)} VND`;
  };

  const goCheckout = () => {
    if (cartItems.length === 0) return;

    // Kiểm tra xem trong giỏ hàng có sản phẩm pre-order không
    const hasPreorder = cartItems.some((item) => item.isPreorder);
    const hasNormal = cartItems.some((item) => !item.isPreorder);

    if (hasPreorder && hasNormal) {
      alert(
        "Giỏ hàng của bạn đang chứa cả Hàng có sẵn và Hàng đặt trước. Vui lòng thanh toán riêng từng loại bằng cách xóa bớt 1 loại khỏi giỏ hàng!",
      );
      return;
    }

    if (hasPreorder) {
      // Nếu là hàng đặt trước -> Chuyển sang trang Checkout Preorder
      navigate("/checkout-preorder");
    } else {
      // Nếu là hàng bình thường -> Chuyển sang trang Checkout cũ
      navigate("/checkout", { state: { cartItems } });
    }
  };

  return (
    <div className="cart" style={{ padding: "40px" }}>
      <div
        className="cart__container"
        style={{ maxWidth: "1200px", margin: "0 auto" }}
      >
        <h1 style={{ fontSize: "24px", marginBottom: "20px" }}>
          Giỏ hàng của bạn
        </h1>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: "30px",
          }}
        >
          {/* CỘT TRÁI: DANH SÁCH SẢN PHẨM */}
          <div className="cart__left">
            {cartItems.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "50px",
                  background: "#f9f9f9",
                  borderRadius: "10px",
                }}
              >
                <p>Giỏ hàng đang trống.</p>
                <Link
                  to="/"
                  style={{ color: "#2563eb", textDecoration: "underline" }}
                >
                  Tiếp tục mua sắm
                </Link>
              </div>
            ) : (
              cartItems.map((item) => {
                return (
                  <div
                    key={item.cartKey}
                    style={{
                      display: "flex",
                      gap: "20px",
                      padding: "15px",
                      borderBottom: "1px solid #eee",
                      alignItems: "center",
                    }}
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      style={{
                        width: "100px",
                        height: "100px",
                        objectFit: "contain",
                        borderRadius: "8px",
                        background: "#f9f9f9",
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: "0 0 8px 0" }}>
                        {item.name}
                        {item.isPreorder && (
                          <span
                            style={{
                              fontSize: "11px",
                              backgroundColor: "#2563eb",
                              color: "white",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              marginLeft: "10px",
                              verticalAlign: "middle",
                            }}
                          >
                            Pre-order
                          </span>
                        )}
                      </h3>
                      <div
                        style={{
                          fontSize: "14px",
                          color: "#555",
                          lineHeight: "1.6",
                        }}
                      >
                        <p style={{ margin: 0 }}>
                          - <strong>Màu sắc:</strong> {item.color}
                        </p>
                        {item.lensInfo ? (
                          <>
                            <p style={{ margin: 0 }}>
                              - <strong>Loại tròng:</strong>{" "}
                              {item.lensInfo.type}{" "}
                            </p>
                            <p style={{ margin: 0 }}>
                              - <strong>Tính năng tròng:</strong>{" "}
                              {item.lensInfo.feature}{" "}
                            </p>
                          </>
                        ) : (
                          <p
                            style={{
                              margin: 0,
                              color: "#999",
                              fontStyle: "italic",
                            }}
                          >
                            Chỉ mua gọng kính
                          </p>
                        )}
                        {item.isPreorder && item.estimatedDeliveryDate && (
                          <p
                            style={{
                              margin: "5px 0 0",
                              color: "#2563eb",
                              fontSize: "12px",
                              fontWeight: "bold",
                            }}
                          >
                            Dự kiến giao:{" "}
                            {new Date(
                              item.estimatedDeliveryDate,
                            ).toLocaleDateString("vi-VN")}
                          </p>
                        )}
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <button
                        onClick={() =>
                          updateQty(
                            item.cartKey,
                            Math.max(1, item.quantity - 1),
                          )
                        }
                        style={{ padding: "5px 10px" }}
                      >
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        onClick={() =>
                          updateQty(item.cartKey, item.quantity + 1)
                        }
                        style={{ padding: "5px 10px" }}
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeItem(item.cartKey)}
                        style={{
                          color: "red",
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                          fontSize: "18px",
                        }}
                      >
                        X
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* CỘT PHẢI: TÓM TẮT ĐƠN HÀNG */}
          <div className="cart__right">
            <div
              style={{
                background: "#f9fafb",
                padding: "20px",
                borderRadius: "12px",
                border: "1px solid #eee",
                position: "sticky",
                top: "20px",
              }}
            >
              <h2
                style={{
                  fontSize: "18px",
                  marginBottom: "15px",
                  borderBottom: "1px solid #e5e7eb",
                  paddingBottom: "10px",
                }}
              >
                Tóm tắt đơn hàng
              </h2>
              <div
                style={{
                  marginBottom: "20px",
                  borderBottom: "1px solid #e5e7eb",
                  paddingBottom: "10px",
                  maxHeight: "350px",
                  overflowY: "auto",
                }}
              >
                {cartItems.map((item) => {
                  return (
                    <div key={item.cartKey} style={{ marginBottom: "15px" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#111827",
                            flex: 1,
                          }}
                        >
                          {item.quantity}x {item.name}
                        </span>
                        <div style={{ textAlign: "right" }}>
                          <div
                            style={{
                              fontSize: "14px",
                              fontWeight: "600",
                              color: "#111827",
                            }}
                          >
                            {formatUSD(item.price * item.quantity)}
                          </div>
                          <div style={{ fontSize: "11px", color: "#6b7280" }}>
                            ({formatVND(item.price * item.quantity)})
                          </div>
                        </div>
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#6b7280",
                          marginTop: "4px",
                          paddingLeft: "10px",
                          borderLeft: "2px solid #e5e7eb",
                        }}
                      >
                        <p style={{ margin: "2px 0" }}>- Màu: {item.color}</p>
                        {item.lensInfo && (
                          <>
                            <p style={{ margin: "2px 0" }}>
                              - Tròng: {item.lensInfo.type}{" "}
                              {item.lensInfo.typePrice > 0 &&
                                `(+${formatUSD(item.lensInfo.typePrice)})`}
                            </p>
                            <p style={{ margin: "2px 0" }}>
                              - Tính năng: {item.lensInfo.feature}{" "}
                              {item.lensInfo.featurePrice > 0 &&
                                `(+${formatUSD(item.lensInfo.featurePrice)})`}
                            </p>
                          </>
                        )}
                      </div>
                      <div style={{ marginTop: "12px" }}>
                        <div
                          style={{
                            fontWeight: "bold",
                            color: "#10b981",
                            fontSize: "18px",
                            display: "block",
                          }}
                        >
                          {formatUSD(item.price)}
                        </div>
                        <div
                          style={{
                            color: "#6b7280",
                            fontSize: "14px",
                            display: "block",
                            marginTop: "2px",
                          }}
                        >
                          ({formatVND(item.price)})
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "10px",
                  fontSize: "20px",
                  fontWeight: "bold",
                }}
              >
                <span>Tổng cộng:</span>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: "#10b981" }}>{formatUSD(subtotal)}</div>
                  <div
                    style={{
                      fontSize: "14px",
                      color: "#666",
                      fontWeight: "normal",
                    }}
                  >
                    ({formatVND(subtotal)})
                  </div>
                </div>
              </div>
              <button
                onClick={goCheckout}
                style={{
                  width: "100%",
                  padding: "15px",
                  background: "#111827",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  marginTop: "10px",
                  transition: "0.2s",
                }}
              >
                TIẾN HÀNH THANH TOÁN
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
