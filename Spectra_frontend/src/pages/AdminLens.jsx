import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../context/UserContext';
import './AdminLensTypes.css';

export default function AdminLens() {
  const { user } = useContext(UserContext);
  const [lensTypes, setLensTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  // ⚡ CẬP NHẬT: Đổi extraPrice thành basePrice theo đúng API
  const initialForm = { lensSpecification: "", requiresPrescription: false, basePrice: 0 };

  const [formData, setFormData] = useState(initialForm);

  const token = user?.token || JSON.parse(localStorage.getItem("user"))?.token;
  const headers = { "Content-Type": "application/json", "Authorization": `Bearer ${token}` };

  const fetchLensTypes = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("https://myspectra.runasp.net/api/LensTypes?page=1&pageSize=100", { headers });
      if (res.ok) {
        const data = await res.json();
        setLensTypes(data.items || data || []);
      } else { setLensTypes([]); }
    } catch (err) { console.error(err); } 
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchLensTypes(); }, []);

  const handleOpenModal = (lens = null) => {
    if (lens) {
      setIsEditing(true);
      setCurrentId(lens.id || lens.lensTypeId);
      setFormData({
        lensSpecification: lens.lensSpecification,
        requiresPrescription: lens.requiresPrescription,
        basePrice: lens.basePrice // ⚡ Lấy đúng trường basePrice
      });
    } else {
      setIsEditing(false);
      setCurrentId(null);
      setFormData(initialForm);
    }
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "number" ? Number(value) : value
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const method = isEditing ? "PUT" : "POST";
    const url = isEditing 
      ? `https://myspectra.runasp.net/api/LensTypes/${currentId}` 
      : "https://myspectra.runasp.net/api/LensTypes";

    try {
      const res = await fetch(url, { method, headers, body: JSON.stringify(formData) });
      if (res.ok || res.status === 201 || res.status === 204) {
        alert(isEditing ? "Updated successfully!" : "Added successfully!");
        setShowModal(false);
        fetchLensTypes();
      } else { alert("Failed to save data!"); }
    } catch (err) { alert("Server connection error"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this lens type?")) return;
    try {
      const res = await fetch(`https://myspectra.runasp.net/api/LensTypes/${id}`, { method: "DELETE", headers });
      if (res.ok || res.status === 204) {
        alert("Deleted successfully!");
        fetchLensTypes();
      } else { 
        // ⚡ Nâng cấp: Hiển thị lỗi từ Backend nếu đang dính Order
        const errorData = await res.json();
        alert("Delete failed: " + (errorData.message || "Currently in use")); 
      }
    } catch (err) { alert("Server error"); }
  };

  return (
    <div className="admin-lens-container">
      <div className="admin-lens-header">

        <h2 className="admin-lens-title">Lens Types Management</h2>
        <button onClick={() => handleOpenModal()} className="btn-add">+ Add Lens Type</button>

      </div>

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Specification / Lens Name</th>
              <th>Requires Prescription (Near/Far)</th>
              <th>Base Price ($)</th>
              <th className="col-action">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? <tr><td colSpan="4" className="col-action">⏳ Loading data...</td></tr> : 
             lensTypes.length === 0 ? <tr><td colSpan="4" className="col-action">No lens types found.</td></tr> :
             lensTypes.map((lens, index) => (
                <tr key={index}>
                  <td className="col-name">{lens.lensSpecification}</td>
                  <td>
                    {lens.requiresPrescription 
                      ? <span className="badge-yes">Prescription required</span> 
                      : <span className="badge-no">No prescription needed</span>}
                  </td>
                  <td className="col-price">${lens.basePrice}</td>
                  <td className="col-action">
                    <button onClick={() => handleOpenModal(lens)} className="btn-edit">Edit</button>
                    <button onClick={() => handleDelete(lens.id || lens.lensTypeId)} className="btn-delete">Delete</button>
                  </td>
                </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">

            <h3 className="modal-title">{isEditing ? "Edit Lens Type" : "Add Lens Type"}</h3>

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Lens Name / Specification (e.g. Anti-glare 1.56):</label>
                <input type="text" name="lensSpecification" value={formData.lensSpecification} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Base Price ($):</label>
                <input type="number" name="basePrice" value={formData.basePrice} onChange={handleChange} required min="0" step="0.01" />

              </div>
              
              <div className="checkbox-wrapper">
                <input type="checkbox" id="reqPrescription" name="requiresPrescription" checked={formData.requiresPrescription} onChange={handleChange} />
                <label htmlFor="reqPrescription">This lens type requires customer to enter prescription (Near/Farsighted)</label>
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn-cancel">Cancel</button>
                <button type="submit" className="btn-save">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}