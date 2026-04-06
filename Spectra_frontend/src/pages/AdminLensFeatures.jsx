import React, { useState, useEffect, useContext } from "react";
import { UserContext } from "../context/UserContext";
import "./AdminLensFeatures.css";

export default function AdminLensFeatures() {
  const { user } = useContext(UserContext);
  const [lensFeatures, setLensFeatures] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  // ⚡ CẬP NHẬT: Loại bỏ lensIndex khỏi form theo API mới
  const initialForm = { featureSpecification: "", extraPrice: 0 };
  const [formData, setFormData] = useState(initialForm);

  const token = user?.token || JSON.parse(localStorage.getItem("user"))?.token;
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const fetchLensFeatures = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        "https://myspectra.runasp.net/api/LensFeatures?page=1&pageSize=100",
        { headers },
      );
      if (res.ok) {
        const data = await res.json();
        setLensFeatures(data.items || data || []);
      } else {
        setLensFeatures([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLensFeatures();
  }, []);

  const handleOpenModal = (feature = null) => {
    if (feature) {
      setIsEditing(true);
      setCurrentId(feature.featureId);
      setFormData({

        featureSpecification: feature.featureSpecification,
        extraPrice: feature.extraPrice,
      });
    } else {
      setIsEditing(false);
      setCurrentId(null);
      setFormData(initialForm);
    }
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({

      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const method = isEditing ? "PUT" : "POST";
    const url = isEditing
      ? `https://myspectra.runasp.net/api/LensFeatures/${currentId}`
      : "https://myspectra.runasp.net/api/LensFeatures";

    try {
      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(formData),
      });
      if (res.ok || res.status === 201 || res.status === 204) {
        alert(isEditing ? "Updated successfully!" : "Added successfully!");
        setShowModal(false);
        fetchLensFeatures();
      } else {
        alert("Failed to save data.");
      }
    } catch (err) {
      alert("Server connection error");
    }
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to permanently delete this lens feature?",
      )
    )
      return;
    try {
      const res = await fetch(
        `https://myspectra.runasp.net/api/LensFeatures/${id}`,
        { method: "DELETE", headers },
      );
      if (res.ok || res.status === 204) {
        alert("Deleted successfully!");
        fetchLensFeatures();
      } else {
        // ⚡ Nâng cấp: Hiển thị lỗi từ Backend nếu đang dính Order
        const errorData = await res.json();
        alert("Delete failed: " + (errorData.message || "Currently in use"));
      }
    } catch (err) {
      alert("Server error");
    }
  };

  return (
    <div className="admin-lens-container">
      <div className="admin-lens-header">

        <h2 className="admin-lens-title">
          Lens Features Management
        </h2>
        <button onClick={() => handleOpenModal()} className="btn-add">
          + Add Feature
        </button>

      </div>

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>

              <th>Feature / Technology</th>
              <th>Extra Price ($)</th>
              <th className="col-action">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="3" style={{ textAlign: "center" }}>
                  Loading data...
                </td>
              </tr>
            ) : lensFeatures.length === 0 ? (
              <tr>
                <td colSpan="3" style={{ textAlign: "center" }}>
                  No features found.
                </td>
              </tr>
            ) : (
              lensFeatures.map((feature, index) => (

                <tr key={index}>

                  <td className="col-name">{feature.featureSpecification}</td>
                  <td className="col-price">+ ${feature.extraPrice}</td>
                  <td className="col-action">
                    <button
                      onClick={() => handleOpenModal(feature)}
                      className="btn-edit"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(feature.featureId)}
                      className="btn-delete"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">

            <h3 className="modal-title">
              {isEditing ? "Edit Feature" : "Add New Feature"}
            </h3>

            <form onSubmit={handleSave}>
              <div className="form-group">

                <label>Feature Description / Coating (Specification):</label>

                <input
                  type="text"
                  name="featureSpecification"
                  value={formData.featureSpecification}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Blue light filter, Photochromic..."
                />
              </div>
              <div className="form-group">
                <label>Extra Price ($):</label>
                <input
                  type="number"
                  name="extraPrice"
                  value={formData.extraPrice}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-cancel"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-save">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}