import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../context/UserContext';
import './AdminProducts.css';

export default function AdminProducts() {
  const { user } = useContext(UserContext);
  
  
  const [allFrames, setAllFrames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'low', 'out'

  // States cho Form Thêm/Sửa Kính (Form chính)
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [existingImages, setExistingImages] = useState([]); 
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadMsg, setUploadMsg] = useState("");

  const initialForm = {
    frameName: "", brand: "", color: "", material: "", shape: "", size: "",
    lensWidth: 0, bridgeWidth: 0, frameWidth: 0, templeLength: 0,
    basePrice: 0, stockQuantity: 0, reorderLevel: 5, status: "Active" 
  };
  const [formData, setFormData] = useState(initialForm);

  // States cho Form Cập Nhật Kho Nhanh (Mini Modal)
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [inventoryData, setInventoryData] = useState({ id: null, name: "", quantity: 0, reorderLevel: 5 }); 

  const token = user?.token || JSON.parse(localStorage.getItem("user"))?.token;
  const headers = { "Content-Type": "application/json", "Authorization": `Bearer ${token}` };


  const fetchFrames = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("https://myspectra.runasp.net/api/Frames?page=1&pageSize=100", { headers });
      if (res.ok) {
        const data = await res.json();
        setAllFrames(data.items || data || []); 
      } else {
        setAllFrames([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { 
    fetchFrames(); 
  }, []);

  
  const displayedFrames = allFrames.filter(frame => {
    if (activeTab === 'out') return frame.stockQuantity <= 0;
    if (activeTab === 'low') return frame.stockQuantity > 0 && frame.stockQuantity <= 5; 
    return true; // tab 'all'
  });


  const handleOpenInventory = (frame) => {
    setInventoryData({
      id: frame.id || frame.frameId,
      name: frame.frameName,
      quantity: frame.stockQuantity || 0,
      reorderLevel: frame.reorderLevel || 5 
    });
    setShowInventoryModal(true);
  };

  const handleSaveInventory = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`https://myspectra.runasp.net/api/Frames/${inventoryData.id}/inventory`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ quantity: Number(inventoryData.quantity), reorderLevel: Number(inventoryData.reorderLevel) })
      });

      if (res.ok) {
        alert("✅ Cập nhật kho thành công!");
        setShowInventoryModal(false);
        fetchFrames(); 
      } else {
        alert("❌ Cập nhật kho thất bại!");
      }
    } catch (error) {
      alert("Lỗi kết nối server!");
    }
  };


 
  const fetchExistingImages = async (frameId) => {
    try {
      const res = await fetch(`https://myspectra.runasp.net/api/FrameMedia/frame/${frameId}`);
      if (res.ok) setExistingImages(await res.json());
      else setExistingImages([]);
    } catch (error) { setExistingImages([]); }
  };

  const handleOpenModal = (frame = null) => {
    setUploadMsg(""); setSelectedFiles([]);
    if (frame) {
      setIsEditing(true);
      const id = frame.id || frame.frameId;
      setCurrentId(id);
      setFormData(frame);
      fetchExistingImages(id);
    } else {
      setIsEditing(false); setCurrentId(null);
      setFormData(initialForm); setExistingImages([]);
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
        setShowModal(false); fetchFrames();
      } else alert(`Lỗi khi lưu!`);
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
        method: "POST", headers: { "Authorization": `Bearer ${token}` }, body: formUpload
      });
      if (res.ok) {
        setUploadMsg("✅ Tải ảnh thành công!"); setSelectedFiles([]); fetchExistingImages(currentId);
      } else setUploadMsg("❌ Tải ảnh thất bại!");
    } catch (err) { setUploadMsg("❌ Lỗi server!"); }
  };

  const handleDeleteImage = async (mediaId) => {
    if (!window.confirm("Xóa ảnh này vĩnh viễn?")) return;
    try {
      const res = await fetch(`https://myspectra.runasp.net/api/FrameMedia/${mediaId}`, { method: "DELETE", headers: { "Authorization": `Bearer ${token}` } });
      if (res.ok || res.status === 204) { alert("Đã xóa ảnh!"); fetchExistingImages(currentId); }
    } catch (error) { alert("Lỗi kết nối khi xóa ảnh."); }
  };


  return (
    <div className="admin-products-container">
      <div className="admin-products-header">
        <h2 className="admin-products-title">👓 Quản Lý Kính & Tồn Kho</h2>
        <button onClick={() => handleOpenModal()} className="btn-add">
          + Thêm Kính Mới
        </button>
      </div>

      {/* TABS CẢNH BÁO TỒN KHO */}
      <div className="admin-tabs">
        <button className={`admin-tab-btn ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
          Tất cả Sản phẩm
        </button>
        <button className={`admin-tab-btn ${activeTab === 'low' ? 'active' : ''}`} onClick={() => setActiveTab('low')}>
          Sắp hết hàng <span className="badge-low">Cảnh báo</span>
        </button>
        <button className={`admin-tab-btn ${activeTab === 'out' ? 'active' : ''}`} onClick={() => setActiveTab('out')}>
          Hết hàng <span className="badge-out">Khẩn cấp</span>
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
             displayedFrames.length === 0 ? <tr><td colSpan="5" className="col-action empty-msg">Không có dữ liệu trong mục này.</td></tr> :
             displayedFrames.map((frame, index) => (
                <tr key={index}>
                  <td className="col-name">{frame.frameName}</td>
                  <td className="col-text">{frame.brand}</td>
                  <td className="col-price">${frame.basePrice}</td>
                  
                 
                  <td style={{ fontWeight: 'bold', color: frame.stockQuantity <= 0 ? '#b91c1c' : frame.stockQuantity <= 5 ? '#d97706' : '#111827' }}>
                    {frame.stockQuantity} 
                    
                    {frame.stockQuantity <= 0 ? (
                      <span className="badge-out">Hết hàng</span>
                    ) : frame.stockQuantity <= 5 ? (
                      <span className="badge-low">Sắp hết</span>
                    ) : null}
                  </td>

                  <td className="col-action">
                    <button onClick={() => handleOpenInventory(frame)} className="btn-inventory" title="Nhập thêm hàng">📦 Nhập kho</button>
                    <button onClick={() => handleOpenModal(frame)} className="btn-edit">Sửa</button>
                    <button onClick={() => handleDelete(frame.id || frame.frameId)} className="btn-delete">Xóa</button>
                  </td>
                </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL CẬP NHẬT TỒN KHO NHANH (MINI MODAL) */}
      {showInventoryModal && (
        <div className="modal-overlay">
          <div className="mini-modal-content">
            <h3 style={{ marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '10px' }}>📦 Nhập Kho Kính</h3>
            <p style={{ fontWeight: 'bold', color: '#3b82f6', marginBottom: '15px' }}>{inventoryData.name}</p>
            
            <form onSubmit={handleSaveInventory}>
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label>Số lượng tồn kho mới:</label>
                <input type="number" value={inventoryData.quantity} onChange={(e) => setInventoryData({...inventoryData, quantity: e.target.value})} required min="0" />
              </div>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label>Mức cảnh báo sắp hết (Reorder Level):</label>
                <input type="number" value={inventoryData.reorderLevel} onChange={(e) => setInventoryData({...inventoryData, reorderLevel: e.target.value})} required min="0" />
              </div>
              
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowInventoryModal(false)} className="btn-cancel">Hủy</button>
                <button type="submit" className="btn-save" style={{ backgroundColor: '#f59e0b' }}>Lưu Tồn Kho</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL THÊM / SỬA KÍNH CHI TIẾT */}
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
              <div className="form-group"><label>Tồn Kho:</label><input type="number" name="stockQuantity" value={formData.stockQuantity} onChange={handleChange} required disabled={isEditing} title={isEditing ? "Vui lòng dùng nút 'Nhập kho' để thay đổi số lượng" : ""} /></div>
              <div className="form-group"><label>Màu sắc:</label><input type="text" name="color" value={formData.color} onChange={handleChange} /></div>
              <div className="form-group"><label>Chất liệu:</label><input type="text" name="material" value={formData.material} onChange={handleChange} /></div>
              
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
          </div>
        </div>
      )}
    </div>
  );
}