import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../context/UserContext';
import './AdminProducts.css';

export default function AdminProducts() {
  const { user } = useContext(UserContext);
  const [allFrames, setAllFrames] = useState([]);
  
  const [brands, setBrands] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [colors, setColors] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [saveError, setSaveError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  const [showBrandModal, setShowBrandModal] = useState(false);
  const [brandForm, setBrandForm] = useState({ brandId: '', brandName: '' });

  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [materialForm, setMaterialForm] = useState({ materialId: '', materialName: '' });

  const initialForm = {
    frameName: '', brandId: '', materialId: '', colorIds: [],
    shape: '', size: '',
    lensWidth: 0, bridgeWidth: 0, frameWidth: 0, templeLength: 0,
    basePrice: 0, stockQuantity: 0, reorderLevel: 5,
  };
  const [formData, setFormData] = useState(initialForm);

  const shapeOptions = ["Square", "Round", "Oval", "Rectangle", "Cat Eye", "Aviator", "Wayfarer"];

  // ⚡ HÀM LẤY TOKEN THÔNG MINH (Khắc phục lỗi xác thực 401)
  const getToken = () => {
    if (user?.token) return user.token;
    try {
      const storedUser = JSON.parse(localStorage.getItem('user'));
      if (storedUser && storedUser.token) return storedUser.token;
    } catch (e) {}
    return localStorage.getItem('token');
  };

  // ================= FETCH DỮ LIỆU BAN ĐẦU =================
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchFrames(), fetchBrands(), fetchMaterials(), fetchColors()
      ]);
    } catch (error) {
      console.error("Lỗi khi fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFrames = async () => {
    const res = await fetch('https://localhost:7296/api/Frames');
    if (res.ok) setAllFrames(await res.json());
  };

  const fetchBrands = async () => {
    const res = await fetch('https://localhost:7296/api/Brands');
    if (res.ok) setBrands(await res.json());
  };

  const fetchMaterials = async () => {
    const res = await fetch('https://localhost:7296/api/Materials');
    if (res.ok) setMaterials(await res.json());
  };

  const fetchColors = async () => {
    const res = await fetch('https://localhost:7296/api/Colors');
    if (res.ok) setColors(await res.json());
  };

  // ================= XỬ LÝ FORM KÍNH (FRAMES) =================
  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'number' ? Number(value) : value
    });
  };

  const handleColorChange = (colorId) => {
    setFormData(prev => ({
      ...prev,
      colorIds: prev.colorIds.includes(colorId) 
        ? prev.colorIds.filter(id => id !== colorId) 
        : [...prev.colorIds, colorId]
    }));
  };

  const openAddModal = () => {
    setFormData(initialForm);
    setIsEditing(false);
    setShowModal(true);
    setSaveError('');
  };

  const openEditModal = (frame) => {
    setFormData({
      frameName: frame.frameName || '',
      brandId: frame.brand?.brandId || '',
      materialId: frame.material?.materialId || '',
      colorIds: frame.frameColors?.map(c => c.colorId) || [],
      shape: frame.shape || '',
      size: frame.size || '',
      lensWidth: frame.lensWidth || 0,
      bridgeWidth: frame.bridgeWidth || 0,
      frameWidth: frame.frameWidth || 0,
      templeLength: frame.templeLength || 0,
      basePrice: frame.basePrice || 0,
      stockQuantity: frame.stockQuantity || 0,
      reorderLevel: frame.reorderLevel || 5,
    });
    setCurrentId(frame.frameId);
    setIsEditing(true);
    setShowModal(true);
    setSaveError('');
  };

  const handleSaveFrame = async (e) => {
    e.preventDefault();
    setSaveError('');
    const url = isEditing ? `https://localhost:7296/api/Frames/${currentId}` : 'https://localhost:7296/api/Frames';
    const method = isEditing ? 'PUT' : 'POST';

    // Xóa colorIds ra khỏi payload gửi đi vì API tạo Frame không nhận trường này trực tiếp
    const { colorIds, ...payloadData } = formData;

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(payloadData)
      });
      
      if (response.ok) {
        setShowModal(false);
        fetchFrames(); 
        alert(isEditing ? "Cập nhật kính thành công!" : "Thêm kính thành công!");
      } else {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'Lỗi từ Backend khi lưu Kính');
      }
    } catch (error) {
      setSaveError(error.message);
      alert(`Lỗi: ${error.message}`);
    }
  };

  const handleDeleteFrame = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa kính này?")) return;
    try {
      const res = await fetch(`https://localhost:7296/api/Frames/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.ok) {
        fetchFrames();
        alert("Đã xóa kính thành công!");
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`Không thể xóa: ${errData.message || 'Lỗi không xác định'}`);
      }
    } catch (error) {
      alert(`Lỗi kết nối: ${error.message}`);
    }
  };

  // ================= ⚡ QUẢN LÝ THƯƠNG HIỆU (BRANDS) =================
  const handleSaveBrand = async (e) => {
    e.preventDefault();
    const url = brandForm.brandId ? `https://localhost:7296/api/Brands/${brandForm.brandId}` : 'https://localhost:7296/api/Brands';
    const method = brandForm.brandId ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${getToken()}` 
        },
        body: JSON.stringify({ brandName: brandForm.brandName })
      });
      if (res.ok) {
        setBrandForm({ brandId: '', brandName: '' });
        fetchBrands(); 
        alert(brandForm.brandId ? "Cập nhật thương hiệu thành công!" : "Thêm thương hiệu mới thành công!");
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`Lỗi: ${errData.message || 'Không thể lưu thương hiệu. Vui lòng kiểm tra lại quyền truy cập.'}`);
      }
    } catch (err) { 
      alert(`Lỗi mạng: ${err.message}`);
    }
  };

  const handleDeleteBrand = async (id) => {
    if (!window.confirm("Xóa thương hiệu này? (Sẽ bị lỗi nếu có Kính đang dùng thương hiệu này)")) return;
    try {
      const res = await fetch(`https://localhost:7296/api/Brands/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.ok) {
        fetchBrands();
        alert("Đã xóa thương hiệu!");
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`Lỗi khi xóa: ${errData.message || 'Thương hiệu này có thể đang được sử dụng.'}`);
      }
    } catch (err) { 
       alert(`Lỗi mạng: ${err.message}`);
    }
  };

  // ================= ⚡ QUẢN LÝ CHẤT LIỆU (MATERIALS) =================
  const handleSaveMaterial = async (e) => {
    e.preventDefault();
    const url = materialForm.materialId ? `https://localhost:7296/api/Materials/${materialForm.materialId}` : 'https://localhost:7296/api/Materials';
    const method = materialForm.materialId ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${getToken()}` 
        },
        body: JSON.stringify({ materialName: materialForm.materialName })
      });
      if (res.ok) {
        setMaterialForm({ materialId: '', materialName: '' });
        fetchMaterials(); 
        alert(materialForm.materialId ? "Cập nhật chất liệu thành công!" : "Thêm chất liệu mới thành công!");
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`Lỗi: ${errData.message || 'Không thể lưu chất liệu.'}`);
      }
    } catch (err) { 
      alert(`Lỗi mạng: ${err.message}`);
    }
  };

  const handleDeleteMaterial = async (id) => {
    if (!window.confirm("Xóa chất liệu này? (Sẽ bị lỗi nếu có Kính đang dùng chất liệu này)")) return;
    try {
      const res = await fetch(`https://localhost:7296/api/Materials/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.ok) {
        fetchMaterials();
        alert("Đã xóa chất liệu!");
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`Lỗi khi xóa: ${errData.message || 'Chất liệu này có thể đang được sử dụng.'}`);
      }
    } catch (err) { 
      alert(`Lỗi mạng: ${err.message}`);
    }
  };

  // ================= RENDER GIAO DIỆN =================
  return (
    <div className="admin-products-container">
      <div className="admin-products-header" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <h2 className="admin-products-title" style={{ marginRight: 'auto' }}>Quản Lý Kính</h2>
        
        <button className="btn-edit" style={{ padding: '10px' }} onClick={() => setShowBrandModal(true)}>+ Quản lý Thương hiệu</button>
        <button className="btn-edit" style={{ padding: '10px' }} onClick={() => setShowMaterialModal(true)}>+ Quản lý Chất liệu</button>
        <button className="btn-add" onClick={openAddModal}>+ Thêm Kính Mới</button>
      </div>

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Tên Kính</th>
              <th>Thương Hiệu</th>
              <th>Chất Liệu</th>
              <th>Giá ($)</th>
              <th>Tồn Kho</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {allFrames.map(frame => (
              <tr key={frame.frameId}>
                <td className="col-name">{frame.frameName}</td>
                <td className="col-text">{frame.brand?.brandName || 'N/A'}</td>
                <td className="col-text">{frame.material?.materialName || 'N/A'}</td>
                <td className="col-price">${frame.basePrice}</td>
                <td>{frame.stockQuantity}</td>
                <td className="col-action">
                  <button onClick={() => openEditModal(frame)} className="btn-edit">Sửa</button>
                  <button onClick={() => handleDeleteFrame(frame.frameId)} className="btn-delete">Xóa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ================= MODAL THÊM / SỬA KÍNH ================= */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{isEditing ? 'Sửa Thông Tin Kính' : 'Thêm Kính Mới'}</h3>
            {saveError && <p className="error-msg" style={{color: 'red'}}>{saveError}</p>}
            
            <form onSubmit={handleSaveFrame} className="admin-form">
              <div className="form-group">
                <label>Tên Kính:</label>
                <input type="text" name="frameName" value={formData.frameName} onChange={handleInputChange} required />
              </div>

              <div className="form-group">
                <label>Thương Hiệu:</label>
                <select name="brandId" value={formData.brandId} onChange={handleInputChange} required>
                  <option value="">-- Chọn Thương Hiệu --</option>
                  {brands.map(b => <option key={b.brandId} value={b.brandId}>{b.brandName}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>Chất Liệu:</label>
                <select name="materialId" value={formData.materialId} onChange={handleInputChange} required>
                  <option value="">-- Chọn Chất Liệu --</option>
                  {materials.map(m => <option key={m.materialId} value={m.materialId}>{m.materialName}</option>)}
                </select>
              </div>

               <div className="form-group">
                <label>Kiểu Dáng:</label>
                <select name="shape" value={formData.shape} onChange={handleInputChange}>
                  <option value="">-- Chọn Kiểu Dáng --</option>
                  {shapeOptions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Màu Sắc:</label>
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                  {colors.map(c => (
                    <label key={c.colorId} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <input 
                        type="checkbox" 
                        checked={formData.colorIds.includes(c.colorId)}
                        onChange={() => handleColorChange(c.colorId)}
                      />
                      {c.colorName}
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Giá ($):</label>
                <input type="number" name="basePrice" value={formData.basePrice} onChange={handleInputChange} required min="0" />
              </div>

              <div className="form-group">
                <label>Tồn Kho:</label>
                <input type="number" name="stockQuantity" value={formData.stockQuantity} onChange={handleInputChange} required min="0" />
              </div>

              <div className="form-group"><label>Rộng tròng (mm):</label><input type="number" name="lensWidth" value={formData.lensWidth} onChange={handleInputChange} /></div>
              <div className="form-group"><label>Cầu kính (mm):</label><input type="number" name="bridgeWidth" value={formData.bridgeWidth} onChange={handleInputChange} /></div>
              <div className="form-group"><label>Càng kính (mm):</label><input type="number" name="templeLength" value={formData.templeLength} onChange={handleInputChange} /></div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn-cancel">Hủy</button>
                <button type="submit" className="btn-save">{isEditing ? 'Lưu Thay Đổi' : 'Thêm Kính'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL QUẢN LÝ THƯƠNG HIỆU ================= */}
      {showBrandModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <h3>Quản Lý Thương Hiệu</h3>
            
            <form onSubmit={handleSaveBrand} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <input type="text" value={brandForm.brandName} onChange={(e) => setBrandForm({...brandForm, brandName: e.target.value})} placeholder="Nhập tên thương hiệu mới..." required style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
              <button type="submit" className="btn-save">{brandForm.brandId ? 'Cập nhật' : 'Thêm'}</button>
              {brandForm.brandId && <button type="button" onClick={() => setBrandForm({brandId:'', brandName:''})} className="btn-cancel">Hủy</button>}
            </form>

            <ul style={{ listStyle: 'none', padding: 0, maxHeight: '300px', overflowY: 'auto' }}>
              {brands.map(b => (
                <li key={b.brandId} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #eee' }}>
                  <span>{b.brandName}</span>
                  <div>
                    <button onClick={() => setBrandForm({brandId: b.brandId, brandName: b.brandName})} style={{ marginRight: '15px', color: '#3b82f6', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Sửa</button>
                    <button onClick={() => handleDeleteBrand(b.brandId)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Xóa</button>
                  </div>
                </li>
              ))}
              {brands.length === 0 && <p style={{ textAlign: 'center', color: '#666' }}>Chưa có thương hiệu nào.</p>}
            </ul>

            <div className="modal-actions">
              <button type="button" onClick={() => { setShowBrandModal(false); setBrandForm({brandId:'', brandName:''}); }} className="btn-cancel">Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL QUẢN LÝ CHẤT LIỆU ================= */}
      {showMaterialModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <h3>Quản Lý Chất Liệu</h3>
            
            <form onSubmit={handleSaveMaterial} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <input type="text" value={materialForm.materialName} onChange={(e) => setMaterialForm({...materialForm, materialName: e.target.value})} placeholder="Nhập tên chất liệu mới..." required style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
              <button type="submit" className="btn-save">{materialForm.materialId ? 'Cập nhật' : 'Thêm'}</button>
              {materialForm.materialId && <button type="button" onClick={() => setMaterialForm({materialId:'', materialName:''})} className="btn-cancel">Hủy</button>}
            </form>

            <ul style={{ listStyle: 'none', padding: 0, maxHeight: '300px', overflowY: 'auto' }}>
              {materials.map(m => (
                <li key={m.materialId} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #eee' }}>
                  <span>{m.materialName}</span>
                  <div>
                    <button onClick={() => setMaterialForm({materialId: m.materialId, materialName: m.materialName})} style={{ marginRight: '15px', color: '#3b82f6', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Sửa</button>
                    <button onClick={() => handleDeleteMaterial(m.materialId)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Xóa</button>
                  </div>
                </li>
              ))}
              {materials.length === 0 && <p style={{ textAlign: 'center', color: '#666' }}>Chưa có chất liệu nào.</p>}
            </ul>

            <div className="modal-actions">
              <button type="button" onClick={() => { setShowMaterialModal(false); setMaterialForm({materialId:'', materialName:''}); }} className="btn-cancel">Đóng</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}