import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../context/UserContext';
import './AdminProducts.css';

export default function AdminProducts() {
  const { user } = useContext(UserContext);
  const [allFrames, setAllFrames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [saveError, setSaveError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [existingImages, setExistingImages] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadMsg, setUploadMsg] = useState('');

  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [inventoryData, setInventoryData] = useState({ id: null, name: '', quantity: 0, reorderLevel: 5 });

  // ✅ initialForm khớp đúng với POST /api/Frames schema (không có status)
  const initialForm = {
    frameName: '', brand: '', color: '', material: '',
    shape: '', size: '',
    lensWidth: 0, bridgeWidth: 0, frameWidth: 0, templeLength: 0,
    basePrice: 0, stockQuantity: 0, reorderLevel: 5,
  };
  const [formData, setFormData] = useState(initialForm);

  const token = user?.token || JSON.parse(localStorage.getItem('user'))?.token;
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

  const fetchFrames = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('https://myspectra.runasp.net/api/Frames?page=1&pageSize=100', { headers });
      if (res.ok) {
        const data = await res.json();
        setAllFrames(data.items || data || []);
      } else setAllFrames([]);
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchFrames(); }, []);

  const displayedFrames = allFrames.filter(frame => {
    if (activeTab === 'out') return frame.stockQuantity <= 0;
    if (activeTab === 'low') return frame.stockQuantity > 0 && frame.stockQuantity <= frame.reorderLevel;
    return true;
  });

  const handleOpenInventory = (frame) => {
    setInventoryData({
      id: frame.id || frame.frameId,
      name: frame.frameName,
      quantity: frame.stockQuantity || 0,
      reorderLevel: frame.reorderLevel || 5,
    });
    setShowInventoryModal(true);
  };

  const handleSaveInventory = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`https://myspectra.runasp.net/api/Frames/${inventoryData.id}/inventory`, {
        method: 'PATCH', headers,
        body: JSON.stringify({ quantity: Number(inventoryData.quantity), reorderLevel: Number(inventoryData.reorderLevel) }),
      });
      if (res.ok) { alert('Cập nhật kho thành công!'); setShowInventoryModal(false); fetchFrames(); }
      else alert('Cập nhật kho thất bại!');
    } catch { alert('Lỗi server!'); }
  };

  const fetchExistingImages = async (frameId) => {
    try {
      const res = await fetch(`https://myspectra.runasp.net/api/FrameMedia/frame/${frameId}`);
      if (res.ok) setExistingImages(await res.json());
      else setExistingImages([]);
    } catch { setExistingImages([]); }
  };

  const handleOpenModal = (frame = null) => {
    setSaveError(''); setUploadMsg(''); setSelectedFiles([]);
    if (frame) {
      setIsEditing(true);
      const id = frame.id || frame.frameId;
      setCurrentId(id);
      // Điền form với dữ liệu hiện tại
      setFormData({
        frameName: frame.frameName || '',
        brand: frame.brand || '',
        color: frame.color || '',
        material: frame.material || '',
        shape: frame.shape || '',
        size: frame.size || '',
        lensWidth: frame.lensWidth || 0,
        bridgeWidth: frame.bridgeWidth || 0,
        frameWidth: frame.frameWidth || 0,
        templeLength: frame.templeLength || 0,
        basePrice: frame.basePrice || 0,
        stockQuantity: frame.stockQuantity || 0,
        reorderLevel: frame.reorderLevel || 5,
        status: frame.status || 'Active', // chỉ dùng khi PUT
      });
      fetchExistingImages(id);
    } else {
      setIsEditing(false); setCurrentId(null);
      setFormData(initialForm); setExistingImages([]);
    }
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'number' ? Number(value) : value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveError('');

    const method = isEditing ? 'PUT' : 'POST';
    const url = isEditing
      ? `https://myspectra.runasp.net/api/Frames/${currentId}`
      : 'https://myspectra.runasp.net/api/Frames';

    // ✅ POST payload: không có status (không có trong schema)
    // ✅ PUT payload: có status
    const postPayload = {
      frameName: formData.frameName,
      brand: formData.brand,
      color: formData.color,
      material: formData.material,
      shape: formData.shape,
      size: formData.size,
      lensWidth: Number(formData.lensWidth),
      bridgeWidth: Number(formData.bridgeWidth),
      frameWidth: Number(formData.frameWidth),
      templeLength: Number(formData.templeLength),
      basePrice: Number(formData.basePrice),
      stockQuantity: Number(formData.stockQuantity),
      reorderLevel: Number(formData.reorderLevel),
    };

    const putPayload = {
      ...postPayload,
      status: formData.status || 'Active',
    };

    const payload = isEditing ? putPayload : postPayload;

    console.log(`📤 ${method} /api/Frames payload:`, JSON.stringify(payload, null, 2));

    try {
      const res = await fetch(url, { method, headers, body: JSON.stringify(payload) });

      if (res.ok || res.status === 201 || res.status === 204) {
        alert(isEditing ? 'Cập nhật kính thành công!' : 'Thêm kính mới thành công!');
        setShowModal(false);
        fetchFrames();
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error('❌ API Error:', errData);
        // Hiển thị lỗi validation chi tiết
        if (errData.errors) {
          const details = Object.entries(errData.errors)
            .map(([f, msgs]) => `• ${f}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
            .join('\n');
          setSaveError(`Lỗi validation:\n${details}`);
        } else {
          setSaveError(errData.message || errData.title || `Lỗi ${res.status} khi lưu.`);
        }
      }
    } catch (err) {
      setSaveError('Lỗi kết nối server.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa kính này không?')) return;
    try {
      const res = await fetch(`https://myspectra.runasp.net/api/Frames/${id}`, { method: 'DELETE', headers });
      if (res.ok || res.status === 204) { alert('Xóa thành công!'); fetchFrames(); }
      else alert('Xóa thất bại!');
    } catch { alert('Lỗi server.'); }
  };

  const handleUploadImages = async () => {
    if (selectedFiles.length === 0) return alert('Chưa chọn ảnh!');
    setUploadMsg('Đang tải ảnh...');
    const formUpload = new FormData();
    selectedFiles.forEach(file => formUpload.append('files', file));
    try {
      const res = await fetch(`https://myspectra.runasp.net/api/FrameMedia/upload-multiple/${currentId}`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formUpload,
      });
      if (res.ok) { setUploadMsg('✅ Tải ảnh thành công!'); setSelectedFiles([]); fetchExistingImages(currentId); }
      else setUploadMsg('❌ Tải ảnh thất bại!');
    } catch { setUploadMsg('❌ Lỗi server!'); }
  };

  const handleDeleteImage = async (mediaId) => {
    if (!window.confirm('Xóa ảnh này?')) return;
    try {
      const res = await fetch(`https://myspectra.runasp.net/api/FrameMedia/${mediaId}`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok || res.status === 204) fetchExistingImages(currentId);
    } catch { alert('Lỗi khi xóa ảnh.'); }
  };

  return (
    <div className="admin-products-container">
      <div className="admin-products-header">
        <h2 className="admin-products-title">Quản Lý Kính & Tồn Kho</h2>
        <button onClick={() => handleOpenModal()} className="btn-add">+ Thêm Kính Mới</button>
      </div>

      {/* TABS */}
      <div className="admin-tabs">
        <button className={`admin-tab-btn ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
          Tất cả sản phẩm
        </button>
        <button className={`admin-tab-btn ${activeTab === 'low' ? 'active' : ''}`} onClick={() => setActiveTab('low')}>
          Sắp hết <span className="badge-low">Cảnh báo</span>
        </button>
        <button className={`admin-tab-btn ${activeTab === 'out' ? 'active' : ''}`} onClick={() => setActiveTab('out')}>
          Hết hàng <span className="badge-out">Không còn</span>
        </button>
      </div>

      {/* TABLE */}
      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Tên kính</th>
              <th>Thương Hiệu</th>
              <th>Giá ($)</th>
              <th>Tồn Kho</th>
              <th className="col-action">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="5" className="col-action">Đang tải...</td></tr>
            ) : displayedFrames.length === 0 ? (
              <tr><td colSpan="5" className="col-action empty-msg">Không có sản phẩm nào.</td></tr>
            ) : (
              displayedFrames.map((frame, index) => (
                <tr key={index}>
                  <td className="col-name">{frame.frameName}</td>
                  <td className="col-text">{frame.brand}</td>
                  <td className="col-price">${frame.basePrice}</td>
                  <td style={{ fontWeight: 'bold', color: frame.stockQuantity <= 0 ? '#b91c1c' : frame.stockQuantity <= (frame.reorderLevel || 5) ? '#d97706' : '#111827' }}>
                    {frame.stockQuantity}
                    {frame.stockQuantity <= 0 ? (
                      <span className="badge-out">Hết</span>
                    ) : frame.stockQuantity <= (frame.reorderLevel || 5) ? (
                      <span className="badge-low">Sắp hết</span>
                    ) : null}
                  </td>
                  <td className="col-action">
                    <button onClick={() => handleOpenInventory(frame)} className="btn-inventory" title="Nhập thêm hàng">Nhập kho</button>
                    <button onClick={() => handleOpenModal(frame)} className="btn-edit">Sửa</button>
                    <button onClick={() => handleDelete(frame.id || frame.frameId)} className="btn-delete">Xóa</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MINI MODAL NHẬP KHO */}
      {showInventoryModal && (
        <div className="modal-overlay">
          <div className="mini-modal-content">
            <h3 style={{ marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Nhập Kho Kính</h3>
            <p style={{ fontWeight: 'bold', color: '#3b82f6', marginBottom: '15px' }}>{inventoryData.name}</p>
            <form onSubmit={handleSaveInventory}>
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label>Số lượng tồn kho mới:</label>
                <input type="number" value={inventoryData.quantity}
                  onChange={(e) => setInventoryData({ ...inventoryData, quantity: e.target.value })}
                  required min="0" />
              </div>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label>Mức cảnh báo (Reorder Level):</label>
                <input type="number" value={inventoryData.reorderLevel}
                  onChange={(e) => setInventoryData({ ...inventoryData, reorderLevel: e.target.value })}
                  required min="0" />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowInventoryModal(false)} className="btn-cancel">Hủy</button>
                <button type="submit" className="btn-save" style={{ backgroundColor: '#f59e0b' }}>Lưu Kho</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL THÊM / SỬA */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">
              {isEditing ? '✏️ Chỉnh Sửa Kính' : '➕ Thêm Kính Mới'}
            </h3>

            {/* Hiển thị lỗi nếu có */}
            {saveError && (
              <div style={{
                backgroundColor: '#fee2e2', color: '#b91c1c', padding: '12px 16px',
                borderRadius: '6px', marginBottom: '16px', fontSize: '14px', whiteSpace: 'pre-line',
                border: '1px solid #fecaca',
              }}>
                {saveError}
              </div>
            )}

            <form onSubmit={handleSave} className="form-grid">
              {/* Hàng 1: Tên & Thương hiệu */}
              <div className="form-group">
                <label>Tên kính: <span style={{ color: 'red' }}>*</span></label>
                <input type="text" name="frameName" value={formData.frameName} onChange={handleChange} required placeholder="Ví dụ: Ray-Ban Aviator" />
              </div>
              <div className="form-group">
                <label>Thương hiệu: <span style={{ color: 'red' }}>*</span></label>
                <input type="text" name="brand" value={formData.brand} onChange={handleChange} required placeholder="Ví dụ: Ray-Ban" />
              </div>

              {/* Hàng 2: Giá & Tồn kho */}
              <div className="form-group">
                <label>Giá bán ($): <span style={{ color: 'red' }}>*</span></label>
                <input type="number" name="basePrice" value={formData.basePrice} onChange={handleChange} required min="0" step="0.01" />
              </div>
              <div className="form-group">
                <label>Tồn kho ban đầu: <span style={{ color: 'red' }}>*</span></label>
                <input type="number" name="stockQuantity" value={formData.stockQuantity} onChange={handleChange}
                  required min="0"
                  disabled={isEditing}
                  title={isEditing ? 'Dùng nút Nhập Kho để thay đổi tồn kho' : ''}
                  style={isEditing ? { backgroundColor: '#f3f4f6', cursor: 'not-allowed' } : {}}
                />
                {isEditing && <small style={{ color: '#6b7280', fontSize: '11px' }}>Dùng "Nhập kho" để cập nhật</small>}
              </div>

              {/* Hàng 3: Màu sắc & Chất liệu */}
              <div className="form-group">
                <label>Màu sắc:</label>
                <input type="text" name="color" value={formData.color} onChange={handleChange} placeholder="Ví dụ: Đen, Vàng kim" />
              </div>
              <div className="form-group">
                <label>Chất liệu:</label>
                <input type="text" name="material" value={formData.material} onChange={handleChange} placeholder="Ví dụ: Kim loại, Nhựa" />
              </div>

              {/* Hàng 4: Hình dáng & Kích cỡ */}
              <div className="form-group">
                <label>Hình dáng (Shape):</label>
                <input type="text" name="shape" value={formData.shape} onChange={handleChange} placeholder="Ví dụ: Oval, Square, Round" />
              </div>
              <div className="form-group">
                <label>Kích cỡ (Size):</label>
                <input type="text" name="size" value={formData.size} onChange={handleChange} placeholder="Ví dụ: Small, Medium, Large" />
              </div>

              {/* Hàng 5: Thông số kỹ thuật */}
              <div className="form-group">
                <label>Chiều rộng tròng (mm):</label>
                <input type="number" name="lensWidth" value={formData.lensWidth} onChange={handleChange} min="0" step="0.1" />
              </div>
              <div className="form-group">
                <label>Cầu kính (Bridge mm):</label>
                <input type="number" name="bridgeWidth" value={formData.bridgeWidth} onChange={handleChange} min="0" step="0.1" />
              </div>
              <div className="form-group">
                <label>Chiều rộng gọng (mm):</label>
                <input type="number" name="frameWidth" value={formData.frameWidth} onChange={handleChange} min="0" step="0.1" />
              </div>
              <div className="form-group">
                <label>Chiều dài gọng (mm):</label>
                <input type="number" name="templeLength" value={formData.templeLength} onChange={handleChange} min="0" step="0.1" />
              </div>

              {/* Mức cảnh báo kho */}
              <div className="form-group">
                <label>Mức cảnh báo kho:</label>
                <input type="number" name="reorderLevel" value={formData.reorderLevel} onChange={handleChange} min="0" />
              </div>

              {/* Status chỉ hiển thị khi sửa */}
              {isEditing && (
                <div className="form-group">
                  <label>Trạng thái:</label>
                  <select name="status" value={formData.status || 'Active'} onChange={handleChange}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}>
                    <option value="Active">Active (Đang bán)</option>
                    <option value="Inactive">Inactive (Ngừng bán)</option>
                    <option value="OutOfStock">OutOfStock (Hết hàng)</option>
                  </select>
                </div>
              )}

              <div className="form-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn-cancel">Đóng</button>
                <button type="submit" className="btn-save">
                  {isEditing ? '💾 Lưu Thay Đổi' : '➕ Thêm Kính'}
                </button>
              </div>
            </form>

            {/* Quản lý ảnh (chỉ khi sửa) */}
            {isEditing && (
              <div className="image-management">
                <h4 className="image-title">🖼️ Quản Lý Hình Ảnh</h4>
                <div className="image-list">
                  {existingImages.map((img) => (
                    <div key={img.mediaId} className="image-item">
                      <img src={img.mediaUrl} alt="Kính" onError={(e) => { e.target.style.opacity = '0.3'; }} />
                      <button onClick={() => handleDeleteImage(img.mediaId)} title="Xóa ảnh này" className="btn-delete-img">×</button>
                    </div>
                  ))}
                  {existingImages.length === 0 && <p className="empty-msg">Sản phẩm chưa có ảnh nào.</p>}
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