import React, { useMemo } from "react";
import "./CartPage.css";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useExchangeRate } from "../api";

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

  const handleIncreaseQty = (currentItem) => {

    const totalFramesInCart = cartItems
      .filter((item) => item.id === currentItem.id)
      .reduce((sum, item) => sum + item.quantity, 0);

    const maxStock = currentItem.maxStock || currentItem.stockQuantity || Infinity;

    if (totalFramesInCart >= maxStock) {
      alert(`Cannot add more! The total quantity of the "${currentItem.name || currentItem.frameName}" frame in your cart has reached the maximum stock limit (only ${maxStock} available).`);
      return;
    }

    updateQty(currentItem.cartKey, currentItem.quantity + 1);
  };

  const goCheckout = () => {
    if (cartItems.length === 0) return;

    const hasPreorder = cartItems.some((item) => item.isPreorder);
    const hasNormal = cartItems.some((item) => !item.isPreorder);

    if (hasPreorder && hasNormal) {
      alert(
        "Your cart contains both available and pre-order items. Please checkout each type separately by removing one type from the cart!",
      );
      return;
    }

    for (let i = 0; i < cartItems.length; i++) {
      const currentItem = cartItems[i];

      const totalFramesInCart = cartItems
        .filter((item) => item.id === currentItem.id)
        .reduce((sum, item) => sum + item.quantity, 0);

      const maxStock = currentItem.maxStock || currentItem.stockQuantity || Infinity;

      if (totalFramesInCart > maxStock) {
        alert(
          `Checkout failed: The frame "${currentItem.name || currentItem.frameName || "this item"}" exceeds our available stock (only ${maxStock} left). Please reduce the quantity in your cart!`
        );
        return;
      }
    }

    if (hasPreorder) {
      navigate("/checkout-preorder", { state: { cartItems } });
    } else {
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
          Your shopping cart
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
                <p>Your cart is empty.</p>
                <Link
                  to="/"
                  style={{ color: "#2563eb", textDecoration: "underline" }}
                >
                  Continue Shopping
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
                          - <strong>Color:</strong> {item.color}
                        </p>
                        {item.lensInfo ? (
                          <>
                            <p style={{ margin: 0 }}>
                              - <strong>Lens type:</strong>{" "}
                              {item.lensInfo.type}{" "}
                            </p>
                            <p style={{ margin: 0 }}>
                              - <strong>Features:</strong>{" "}
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
                            Frame only.
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
                            Expected delivery:{" "}
                            {new Date(
                              item.estimatedDeliveryDate,
                            ).toLocaleDateString("en-US")}
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
                        style={{ padding: "5px 10px", cursor: "pointer" }}
                      >
                        -
                      </button>
                      <span style={{ minWidth: "20px", textAlign: "center" }}>
                        {item.quantity}
                      </span>
                      {/* ĐÃ LẮP CHỐT CHẶN VÀO NÚT CỘNG TẠI ĐÂY */}
                      <button
                        onClick={() => handleIncreaseQty(item)}
                        style={{ padding: "5px 10px", cursor: "pointer" }}
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeItem(item.cartKey)}
                        style={{
                          color: "#ef4444",
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                          fontSize: "18px",
                          marginLeft: "10px",
                        }}
                        title="Remove item"
                      >
                        ✕
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
                Order summary
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
                        <p style={{ margin: "2px 0" }}>- Color: {item.color}</p>
                        {item.lensInfo && (
                          <>
                            <p style={{ margin: "2px 0" }}>
                              - Lens: {item.lensInfo.type}{" "}
                              {item.lensInfo.typePrice > 0 &&
                                `(+${formatUSD(item.lensInfo.typePrice)})`}
                            </p>
                            <p style={{ margin: "2px 0" }}>
                              - Features: {item.lensInfo.feature}{" "}
                              {item.lensInfo.featurePrice > 0 &&
                                `(+${formatUSD(item.lensInfo.featurePrice)})`}
                            </p>
                          </>
                        )}
                      </div>
                      <div style={{ marginTop: "8px" }}>
                        <div
                          style={{
                            fontWeight: "bold",
                            color: "#10b981",
                            fontSize: "16px",
                          }}
                        >
                          {formatUSD(item.price)}
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
                <span>Total:</span>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: "#10b981" }}>{formatUSD(subtotal)}</div>
                </div>
              </div>
              <button
                onClick={goCheckout}
                disabled={cartItems.length === 0}
                style={{
                  width: "100%",
                  padding: "15px",
                  background: cartItems.length === 0 ? "#9ca3af" : "#111827",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "bold",
                  cursor: cartItems.length === 0 ? "not-allowed" : "pointer",
                  marginTop: "10px",
                  transition: "0.2s",
                }}
              >
                PROCEED TO CHECKOUT
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}