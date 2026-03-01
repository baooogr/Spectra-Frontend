import React, { useState } from "react";
import "./Modal.css";

const Modal = ({ isOpen, onClose }) => {
  const [form, setForm] = useState({
    leftSPH: "",
    leftCYL: "",
    rightSPH: "",
    rightCYL: "",
  });

  const [imagePreview, setImagePreview] = useState(null);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(form);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <h2 className="modal-title">Eye Prescription Form</h2>

        <form onSubmit={handleSubmit}>

          <div className="eye-section">
            <h4>Left Eye</h4>
            <div className="input-row">
              <input
                type="text"
                name="leftSPH"
                placeholder="SPH (e.g -2.50)"
                value={form.leftSPH}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                name="leftCYL"
                placeholder="CYL (optional)"
                value={form.leftCYL}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="eye-section">
            <h4>Right Eye</h4>
            <div className="input-row">
              <input
                type="text"
                name="rightSPH"
                placeholder="SPH (e.g -1.75)"
                value={form.rightSPH}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                name="rightCYL"
                placeholder="CYL (optional)"
                value={form.rightCYL}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="upload-section">
            <label>Upload Prescription Image</label>
            <input type="file" accept="image/*" onChange={handleImageUpload} />
          </div>

          {imagePreview && (
            <div className="image-preview">
              <img src={imagePreview} alt="Preview" />
            </div>
          )}

          <div className="modal-buttons">
            <button type="submit" className="btn-submit">
              Submit
            </button>
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default Modal;