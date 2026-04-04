import React, { useState, useEffect, useContext } from "react";
import { UserContext } from "../context/UserContext";
import "./AdminLensFeatures.css"; // Reuse same CSS

export default function AdminLensIndices() {
  const { user } = useContext(UserContext);
  const [lensIndices, setLensIndices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  const initialForm = {
    indexValue: 1.5,
    name: "",
    description: "",
    additionalPrice: 0,
    minPrescription: "",
    maxPrescription: "",
  };
  const [formData, setFormData] = useState(initialForm);

  const token = user?.token || JSON.parse(localStorage.getItem("user"))?.token;
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const fetchLensIndices = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        "https://myspectra.runasp.net/api/LensIndices?page=1&pageSize=100",
        { headers },
      );
      if (res.ok) {
        const data = await res.json();
        setLensIndices(data.items || data || []);
      } else {
        setLensIndices([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLensIndices();
  }, []);

  const handleOpenModal = (index = null) => {
    if (index) {
      setIsEditing(true);
      setCurrentId(index.lensIndexId || index.id);
      setFormData({
        indexValue: index.indexValue,
        name: index.name || "",
        description: index.description || "",
        additionalPrice: index.additionalPrice || 0,
        minPrescription: index.minPrescription ?? "",
        maxPrescription: index.maxPrescription ?? "",
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
      [name]: type === "number" ? (value === "" ? "" : Number(value)) : value,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const payload = {
      indexValue: Number(formData.indexValue),
      name: formData.name,
      description: formData.description,
      additionalPrice: Number(formData.additionalPrice),
      minPrescription:
        formData.minPrescription !== ""
          ? Number(formData.minPrescription)
          : null,
      maxPrescription:
        formData.maxPrescription !== ""
          ? Number(formData.maxPrescription)
          : null,
    };

    const method = isEditing ? "PUT" : "POST";
    const url = isEditing
      ? `https://myspectra.runasp.net/api/LensIndices/${currentId}`
      : "https://myspectra.runasp.net/api/LensIndices";

    try {
      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      });
      if (res.ok || res.status === 201 || res.status === 204) {
        alert(isEditing ? "Updated successfully!" : "Added successfully!");
        setShowModal(false);
        fetchLensIndices();
      } else {
        const err = await res.json();
        alert(
          "Error: " +
            (err.message || JSON.stringify(err.errors || "Unknown error")),
        );
      }
    } catch (err) {
      alert("Server connection error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this lens index?")) return;
    try {
      const res = await fetch(
        `https://myspectra.runasp.net/api/LensIndices/${id}`,
        { method: "DELETE", headers },
      );
      if (res.ok || res.status === 204) {
        alert("Deleted successfully!");
        fetchLensIndices();
      } else {
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
          Lens Indices Management
        </h2>
        <button onClick={() => handleOpenModal()} className="btn-add">
          + Add Lens Index
        </button>
      </div>

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Index Value</th>
              <th>Name</th>
              <th>Description</th>
              <th>Extra Price ($)</th>
              <th>Min Rx</th>
              <th>Max Rx</th>
              <th>Status</th>
              <th className="col-action">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: "center" }}>
                  Loading data...
                </td>
              </tr>
            ) : lensIndices.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: "center" }}>
                  No lens indices found.
                </td>
              </tr>
            ) : (
              lensIndices.map((item, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: "bold", fontSize: "16px" }}>
                    {item.indexValue}
                  </td>
                  <td>{item.name || "—"}</td>
                  <td
                    style={{
                      fontSize: "13px",
                      color: "#6b7280",
                      maxWidth: "200px",
                    }}
                  >
                    {item.description || "—"}
                  </td>
                  <td className="col-price">+${item.additionalPrice || 0}</td>
                  <td>{item.minPrescription ?? "—"}</td>
                  <td>{item.maxPrescription ?? "—"}</td>
                  <td>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "bold",
                        backgroundColor:
                          item.status === "active" || !item.status
                            ? "#d1fae5"
                            : "#fee2e2",
                        color:
                          item.status === "active" || !item.status
                            ? "#065f46"
                            : "#991b1b",
                      }}
                    >
                      {item.status === "active" || !item.status
                        ? "Active"
                        : "Hidden"}
                    </span>
                  </td>
                  <td className="col-action">
                    <button
                      onClick={() => handleOpenModal(item)}
                      className="btn-edit"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.lensIndexId || item.id)}
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
              {isEditing ? "Edit Lens Index" : "Add New Lens Index"}
            </h3>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Index Value:</label>
                <select
                  name="indexValue"
                  value={formData.indexValue}
                  onChange={handleChange}
                  required
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                  }}
                >
                  <option value={1.5}>1.50 (Standard)</option>
                  <option value={1.56}>1.56 (Mid-thin)</option>
                  <option value={1.6}>1.60 (Thin)</option>
                  <option value={1.61}>1.61 (Thin)</option>
                  <option value={1.67}>1.67 (Super thin)</option>
                  <option value={1.74}>1.74 (Ultra thin)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Display Name:</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. 1.67 Super Thin Index"
                />
              </div>
              <div className="form-group">
                <label>Description:</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Detailed description..."
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    resize: "vertical",
                  }}
                />
              </div>
              <div className="form-group">
                <label>Extra Price ($):</label>
                <input
                  type="number"
                  name="additionalPrice"
                  value={formData.additionalPrice}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "15px",
                }}
              >
                <div className="form-group">
                  <label>Min Prescription (SPH):</label>
                  <input
                    type="number"
                    name="minPrescription"
                    value={formData.minPrescription}
                    onChange={handleChange}
                    step="0.25"
                    placeholder="e.g. -8.00"
                  />
                </div>
                <div className="form-group">
                  <label>Max Prescription (SPH):</label>
                  <input
                    type="number"
                    name="maxPrescription"
                    value={formData.maxPrescription}
                    onChange={handleChange}
                    step="0.25"
                    placeholder="e.g. +4.00"
                  />
                </div>
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