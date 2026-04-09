import React from "react";
import { useNavigate } from "react-router-dom";
import "./Modal.css";

export default function Modal({ isOpen, onClose }) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const goToCart = () => {
    onClose();
    navigate("/cart");
  };

  return (
    <div className="modal-overlay" onClick={onClose}>

      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <svg className="animated-check" viewBox="0 0 52 52">
          <circle className="animated-check-circle" cx="26" cy="26" r="25" fill="none" />
          <path className="animated-check-path" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
        </svg>
        <h3 className="modal-title">Added Successfully!</h3>
        <p style={{ color: "#666" }}>
          The item has been added to your cart.
        </p>

        <div className="modal-actions">
          <button className="modal-btn modal-btn--outline" onClick={onClose}>
            Continue Shopping
          </button>
          <button className="modal-btn modal-btn--primary" onClick={goToCart}>
            View Cart
          </button>
        </div>
      </div>
    </div>
  );
}