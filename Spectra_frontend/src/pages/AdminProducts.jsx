import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../context/UserContext';
import './AdminProducts.css'; // IMPORT FILE CSS VỪA TẠO

export default function AdminProducts() {
  const { user } = useContext(UserContext);
  const [frames, setFrames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [existingImages, setExistingImages] = useState([]); 

  const initialForm = {
    frameName: "", brand: "", color: "", material: "", shape: "", size: "",
    lensWidth: 0, bridgeWidth: 0, frameWidth: 0, templeLength: 0,
    basePrice: 0, stockQuantity: 0, reorderLevel: 0, status: "Active"
  };
  const [formData, setFormData] = useState(initialForm);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadMsg, setUploadMsg] = useState("");

  const token = user?.token || JSON.parse(localStorage.getItem("user"))?.token;
  const headers = { "Content-Type": "application/json", "Authorization": `Bearer ${token}` };

  const fetchFrames = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("https://myspectra.runasp.net/api/Frames?page=1&pageSize=100", { headers });
      if (res.ok) {
        const data = await res.json();
        setFrames(data.items || data || []); 
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchFrames(); }, []);

  const fetchExistingImages = async (frameId) => {
    try {
      const res = await fetch(`https://myspectra.runasp.net/api/FrameMedia/frame/${frameId}`);
      if (res.ok) {
        const data = await res.json();
        setExistingImages(data);
      } else {
        setExistingImages([]);
      }
    } catch (error) {
      setExistingImages([]);
    }
  };

  const handleOpenModal = (frame = null) => {
    setUploadMsg("");
    setSelectedFiles([]);
    
    if (frame) {
      setIsEditing(true);
      const id = frame.id || frame.frameId;
      setCurrentId(id);
      setFormData(frame);
      fetchExistingImages(id);
    } else {
      setIsEditing(false);
      setCurrentId(null);
      setFormData(initialForm);
      setExistingImages([]);
    }
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === "number" ? Number(value) : value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const method = isEditing ? "PUT" : "POST";
    const url = isEditing ? `https://myspectra.runasp.net/api/Frames/${currentId}` : "https://myspectra.runasp.net/api/Frames";
    
    try {
      const res = await fetch(url, { method, headers, body: JSON.stringify(formData) });
      if (res.ok || res.status === 201 || res.status === 204) {
        alert(isEditing ? "Cập nhật thành công!" : "Thêm mới thành công!");
        setShowModal(false);
        fetchFrames();
      } else {
        const error = await res.json();
        alert(`Lỗi: ${error.message || 'Không thể lưu'}`);
      }
    } catch (err) { alert("Lỗi kết nối server"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa kính này?")) return;
    try {
      const res = await fetch(`https://myspectra.runasp.net/api/Frames/${id}`, { method: "DELETE", headers });
      if (res.ok || res.status === 204) { alert("Xóa thành công!"); fetchFrames(); }
      else alert("Xóa thất bại!");
    } catch (err) { alert("Lỗi server"); }
  };

  const handleUploadImages = async () => {
    if (selectedFiles.length === 0) return alert("Chưa chọn ảnh!");
    setUploadMsg("⏳ Đang tải ảnh...");
    const formUpload = new FormData();
    selectedFiles.forEach(file => formUpload.append("files", file));

    try {
      const res = await fetch(`https://myspectra.runasp.net/api/FrameMedia/upload-multiple/${currentId}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formUpload
      });
      if (res.ok) {
        setUploadMsg("✅ Tải ảnh thành công!");
        setSelectedFiles([]);
        fetchExistingImages(currentId);
      } else {
        setUploadMsg("❌ Tải ảnh thất bại!");
      }
    } catch (err) { setUploadMsg("❌ Lỗi server!"); }
  };

  const handleDeleteImage = async (mediaId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa tấm ảnh này? Nó sẽ bị xóa khỏi Cloudinary vĩnh viễn.")) return;
    try {
      const res = await fetch(`https://myspectra.runasp.net/api/FrameMedia/${mediaId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok || res.status === 204) {
        alert("Đã xóa ảnh!");
        fetchExistingImages(currentId);
      } else {
        alert("Xóa ảnh thất bại. Có thể do lỗi API.");
      }
    } catch (error) {
      alert("Lỗi kết nối khi xóa ảnh.");
    }
  };

  return (
    <div className="admin-products-container">
      <div className="admin-products-header">
        <h2 className="admin-products-title">👓 Quản Lý Kính (Frames)</h2>
        <button onClick={() => handleOpenModal()} className="btn-add">
          + Thêm Kính Mới
        </button>
      </div>

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Tên Kính</th>
              <th>Thương Hiệu</th>
              <th>Giá ($)</th>
              <th>Tồn Kho</th>
              <th className="col-action">Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? <tr><td colSpan="5" className="col-action">⏳ Đang tải dữ liệu...</td></tr> : 
             frames.map((frame, index) => (
                <tr key={index}>
                  <td className="col-name">{frame.frameName}</td>
                  <td className="col-text">{frame.brand}</td>
                  <td className="col-price">${frame.basePrice}</td>
                  <td>{frame.stockQuantity}</td>
                  <td className="col-action">
                    <button onClick={() => handleOpenModal(frame)} className="btn-edit">Sửa & Quản lý Ảnh</button>
                    <button onClick={() => handleDelete(frame.id || frame.frameId)} className="btn-delete">Xóa</button>
                  </td>
                </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">
              {isEditing ? "✏️ Sửa Thông Tin Kính" : "✨ Thêm Kính Mới"}
            </h3>
            
            <form onSubmit={handleSave} className="form-grid">
              <div className="form-group"><label>Tên Kính:</label><input type="text" name="frameName" value={formData.frameName} onChange={handleChange} required /></div>
              <div className="form-group"><label>Thương Hiệu:</label><input type="text" name="brand" value={formData.brand} onChange={handleChange} required /></div>
              <div className="form-group"><label>Giá Cơ Bản ($):</label><input type="number" name="basePrice" value={formData.basePrice} onChange={handleChange} required /></div>
              <div className="form-group"><label>Tồn Kho:</label><input type="number" name="stockQuantity" value={formData.stockQuantity} onChange={handleChange} required /></div>
              
              <div className="form-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn-cancel">Đóng</button>
                <button type="submit" className="btn-save">Lưu Thông Tin</button>
              </div>
            </form>

            {isEditing && (
              <div className="image-management">
                <h4 className="image-title">🖼️ Quản Lý Hình Ảnh</h4>
                
                <div className="image-list">
                  {existingImages.map((img) => (
                    <div key={img.mediaId} className="image-item">
                      <img src={img.mediaUrl} alt="Kính" onError={(e) => { e.target.style.opacity = '0.3'; }} />
                      <button onClick={() => handleDeleteImage(img.mediaId)} title="Xóa ảnh này" className="btn-delete-img">X</button>
                    </div>
                  ))}
                  {existingImages.length === 0 && <p className="empty-msg">Sản phẩm này chưa có ảnh nào.</p>}
                </div>

                <div className="image-upload-area">
                  <input type="file" multiple accept="image/*" onChange={(e) => setSelectedFiles(Array.from(e.target.files))} />
                  <button onClick={handleUploadImages} type="button" className="btn-upload">+ Tải Ảnh Lên</button>
                </div>
                {uploadMsg && <p className={`upload-msg ${uploadMsg.includes('✅') ? 'success' : 'error'}`}>{uploadMsg}</p>}
              </div>
            )}
            
            {!isEditing && (
              <div className="info-msg">
                💡 Vui lòng "Lưu Thông Tin" để tạo sản phẩm trước. Sau đó bấm "Sửa" để có thể tải ảnh lên.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}