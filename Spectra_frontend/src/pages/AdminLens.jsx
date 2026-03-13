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
        alert(isEditing ? "Cập nhật thành công!" : "Thêm mới thành công!");
        setShowModal(false);
        fetchLensTypes();
      } else { alert("Lỗi khi lưu dữ liệu!"); }
    } catch (err) { alert("Lỗi kết nối server"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa loại tròng này không?")) return;
    try {
      const res = await fetch(`https://myspectra.runasp.net/api/LensTypes/${id}`, { method: "DELETE", headers });
      if (res.ok || res.status === 204) {
        alert("Xóa thành công!");
        fetchLensTypes();
      } else { 
        // ⚡ Nâng cấp: Hiển thị lỗi từ Backend nếu đang dính Order
        const errorData = await res.json();
        alert("Xóa thất bại: " + (errorData.message || "Đang được sử dụng")); 
      }
    } catch (err) { alert("Lỗi server"); }
  };

  return (
    <div className="admin-lens-container">
      <div className="admin-lens-header">
        <h2 className="admin-lens-title">👓 Quản Lý Loại Tròng Kính (Lens Types)</h2>
        <button onClick={() => handleOpenModal()} className="btn-add">+ Thêm Loại Tròng</button>
      </div>

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Thông số / Tên Tròng</th>
              <th>Yêu cầu Toa Thuốc (Cận/Viễn)</th>
              <th>Giá Cơ Bản ($)</th>
              <th className="col-action">Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? <tr><td colSpan="4" className="col-action">⏳ Đang tải dữ liệu...</td></tr> : 
             lensTypes.length === 0 ? <tr><td colSpan="4" className="col-action">Chưa có loại tròng nào.</td></tr> :
             lensTypes.map((lens, index) => (
                <tr key={index}>
                  <td className="col-name">{lens.lensSpecification}</td>
                  <td>
                    {lens.requiresPrescription 
                      ? <span className="badge-yes">⚠️ Bắt buộc có toa</span> 
                      : <span className="badge-no">✅ Không cần toa</span>}
                  </td>
                  <td className="col-price">${lens.basePrice}</td>
                  <td className="col-action">
                    <button onClick={() => handleOpenModal(lens)} className="btn-edit">Sửa</button>
                    <button onClick={() => handleDelete(lens.id || lens.lensTypeId)} className="btn-delete">Xóa</button>
                  </td>
                </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">{isEditing ? "✏️ Sửa Loại Tròng" : "✨ Thêm Loại Tròng"}</h3>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Tên / Thông số tròng (VD: Tròng chống lóa 1.56):</label>
                <input type="text" name="lensSpecification" value={formData.lensSpecification} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Giá Cơ Bản ($):</label>
                <input type="number" name="basePrice" value={formData.basePrice} onChange={handleChange} required min="0" step="0.01" />

              </div>
              
              <div className="checkbox-wrapper">
                <input type="checkbox" id="reqPrescription" name="requiresPrescription" checked={formData.requiresPrescription} onChange={handleChange} />
                <label htmlFor="reqPrescription">Loại tròng này bắt buộc khách phải nhập độ cận/viễn (Có toa thuốc)</label>
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn-cancel">Hủy</button>
                <button type="submit" className="btn-save">Lưu Thông Tin</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}