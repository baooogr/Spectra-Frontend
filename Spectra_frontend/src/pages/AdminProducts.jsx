import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../context/UserContext';
import './AdminProducts.css';

export default function AdminProducts() {
  const { user } = useContext(UserContext);
  const [allFrames, setAllFrames] = useState([]); 
  
  const [brands, setBrands] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [colors, setColors] = useState([]);
  // ⚡ MỚI: State lưu danh sách Kiểu dáng từ API
  const [shapes, setShapes] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [fieldErrors, setFieldErrors] = useState({});

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  const [showBrandModal, setShowBrandModal] = useState(false);
  const [brandForm, setBrandForm] = useState({ brandId: '', brandName: '' });

  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [materialForm, setMaterialForm] = useState({ materialId: '', materialName: '' });

  const [showColorModal, setShowColorModal] = useState(false);
  const [colorForm, setColorForm] = useState({ colorId: '', colorName: '', hexCode: '#000000' });

  // ⚡ MỚI: State cho Modal Quản lý Kiểu dáng
  const [showShapeModal, setShowShapeModal] = useState(false);
  const [shapeForm, setShapeForm] = useState({ shapeId: '', shapeName: '' });

  // ⚡ SỬA: Đổi shape (string) thành shapeId (Object ID)
  const initialForm = {
    frameName: '', brandId: '', materialId: '', shapeId: '', colorIds: [],
    size: '', lensWidth: '', bridgeWidth: '', frameWidth: '', templeLength: '', 
    basePrice: 0, stockQuantity: 0, reorderLevel: 5,
  };
  const [formData, setFormData] = useState(initialForm);

  const sizeOptions = ["Small", "Medium", "Large"];

  const getToken = () => {
    if (user?.token) return user.token;
    try {
      const storedUser = JSON.parse(localStorage.getItem('user'));
      if (storedUser && storedUser.token) return storedUser.token;
    } catch (e) {}
    return localStorage.getItem('token');
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchFrames(), fetchBrands(), fetchMaterials(), fetchColors(), fetchShapes() // ⚡ MỚI: Load Shapes
      ]);
    } catch (error) {
      console.error("Lỗi khi fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFrames = async () => {
    try {
      const res = await fetch('https://myspectra.runasp.net/api/Frames');
      if (res.ok) {
        const data = await res.json();
        setAllFrames(data.items || data || []); 
      }
    } catch (error) { console.error("Lỗi fetch Kính", error); }
  };

  const fetchBrands = async () => {
    const res = await fetch('https://myspectra.runasp.net/api/Brands');
    if (res.ok) setBrands(await res.json());
  };

  const fetchMaterials = async () => {
    const res = await fetch('https://myspectra.runasp.net/api/Materials');
    if (res.ok) setMaterials(await res.json());
  };

  const fetchColors = async () => {
    const res = await fetch('https://myspectra.runasp.net/api/Colors');
    if (res.ok) setColors(await res.json());
  };

  // ⚡ MỚI: API Lấy danh sách Kiểu dáng
  const fetchShapes = async () => {
    const res = await fetch('https://myspectra.runasp.net/api/Shapes');
    if (res.ok) setShapes(await res.json());
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    const newValue = type === 'number' ? (value === '' ? '' : Number(value)) : value;

    setFormData(prev => ({ ...prev, [name]: newValue }));
    
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: null }));
    }
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
    setFieldErrors({}); 
  };

  const openEditModal = (frame) => {
    setFormData({
      frameName: frame.frameName || '',
      brandId: frame.brand?.brandId || '',
      materialId: frame.material?.materialId || '',
      // ⚡ SỬA MÀU SẮC & KIỂU DÁNG: Trích xuất đúng ID từ Object
      shapeId: frame.shape?.shapeId || frame.shapeId || '',
      colorIds: frame.frameColors?.map(c => c.colorId || c.color?.colorId) || [],
      size: frame.size || '',
      lensWidth: frame.lensWidth || '',
      bridgeWidth: frame.bridgeWidth || '',
      frameWidth: frame.frameWidth || '',
      templeLength: frame.templeLength || '',
      basePrice: frame.basePrice || 0,
      stockQuantity: frame.stockQuantity || 0,
      reorderLevel: frame.reorderLevel || 5,
    });
    setCurrentId(frame.frameId);
    setIsEditing(true);
    setShowModal(true);
    setFieldErrors({}); 
  };

  const handleSaveFrame = async (e) => {
    e.preventDefault();
    
    let errors = {};
    if (!formData.frameName) errors.frameName = "Vui lòng nhập tên kính";
    if (!formData.brandId) errors.brandId = "Vui lòng chọn thương hiệu";
    if (!formData.materialId) errors.materialId = "Vui lòng chọn chất liệu";
    if (!formData.shapeId) errors.shapeId = "Vui lòng chọn kiểu dáng"; // ⚡ MỚI
    if (!formData.size) errors.size = "Vui lòng chọn kích cỡ";
    
    const lw = Number(formData.lensWidth || 0);
    const bw = Number(formData.bridgeWidth || 0);
    const tl = Number(formData.templeLength || 0);
    const fw = Number(formData.frameWidth || 0);

    if (lw <= 0) errors.lensWidth = "Rộng tròng phải lớn hơn 0mm";
    if (bw <= 0) errors.bridgeWidth = "Cầu kính phải lớn hơn 0mm";
    if (tl <= 0) errors.templeLength = "Càng kính phải lớn hơn 0mm";
    if (fw <= 0) errors.frameWidth = "Rộng khung kính phải lớn hơn 0mm";

    if (lw > 0 && bw > 0 && fw > 0) {
        const expectedFrameWidth = (2 * lw) + bw;
        if (fw !== expectedFrameWidth) {
            errors.frameWidth = `Sai công thức! Rộng khung bắt buộc phải bằng: (2 x ${lw}) + ${bw} = ${expectedFrameWidth}mm`;
        }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return; 
    }

    const url = isEditing ? `https://myspectra.runasp.net/api/Frames/${currentId}` : 'https://myspectra.runasp.net/api/Frames';
    const method = isEditing ? 'PUT' : 'POST';
    const payloadData = { ...formData }; // ⚡ Đảm bảo gửi kèm colorIds và shapeId

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify(payloadData)
      });
      
      if (response.ok) {
        setShowModal(false);
        fetchFrames(); 
        alert(isEditing ? "Cập nhật kính thành công!" : "Thêm kính thành công!");
      } else {
        const errData = await response.json().catch(() => ({}));
        const backendError = errData.message || 'Lỗi từ Backend khi lưu Kính';
        
        if (backendError.toLowerCase().includes("frame width")) {
          setFieldErrors({ frameWidth: backendError });
        } else if (backendError.toLowerCase().includes("lens width")) {
          setFieldErrors({ lensWidth: backendError });
        } else {
          alert(`Lỗi Backend: ${backendError}`);
        }
      }
    } catch (error) {
      alert(`Lỗi kết nối: ${error.message}`);
    }
  };

  const handleDeleteFrame = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa kính này?")) return;
    try {
      const res = await fetch(`https://myspectra.runasp.net/api/Frames/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.ok) { fetchFrames(); alert("Đã xóa kính thành công!"); }
    } catch (error) { alert(`Lỗi kết nối: ${error.message}`); }
  };

  // ================= QUẢN LÝ CÁC DANH MỤC KHÁC =================
  const handleSaveBrand = async (e) => {
    e.preventDefault();
    const url = brandForm.brandId ? `https://myspectra.runasp.net/api/Brands/${brandForm.brandId}` : 'https://myspectra.runasp.net/api/Brands';
    const method = brandForm.brandId ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` }, body: JSON.stringify({ brandName: brandForm.brandName }) });
      if (res.ok) { setBrandForm({ brandId: '', brandName: '' }); fetchBrands(); alert(brandForm.brandId ? "Thành công!" : "Thêm thành công!"); }
    } catch (err) { alert(`Lỗi mạng: ${err.message}`); }
  };

  const handleDeleteBrand = async (id) => {
    if (!window.confirm("Xóa thương hiệu này?")) return;
    try { const res = await fetch(`https://myspectra.runasp.net/api/Brands/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${getToken()}` } }); if (res.ok) { fetchBrands(); alert("Đã xóa!"); } } catch (err) { alert(`Lỗi mạng: ${err.message}`); }
  };

  const handleSaveMaterial = async (e) => {
    e.preventDefault();
    const url = materialForm.materialId ? `https://myspectra.runasp.net/api/Materials/${materialForm.materialId}` : 'https://myspectra.runasp.net/api/Materials';
    const method = materialForm.materialId ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` }, body: JSON.stringify({ materialName: materialForm.materialName }) });
      if (res.ok) { setMaterialForm({ materialId: '', materialName: '' }); fetchMaterials(); alert(materialForm.materialId ? "Thành công!" : "Thêm thành công!"); }
    } catch (err) { alert(`Lỗi mạng: ${err.message}`); }
  };

  const handleDeleteMaterial = async (id) => {
    if (!window.confirm("Xóa chất liệu này?")) return;
    try { const res = await fetch(`https://myspectra.runasp.net/api/Materials/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${getToken()}` } }); if (res.ok) { fetchMaterials(); alert("Đã xóa!"); } } catch (err) { alert(`Lỗi mạng: ${err.message}`); }
  };

  const handleSaveColor = async (e) => {
    e.preventDefault();
    const url = colorForm.colorId ? `https://myspectra.runasp.net/api/Colors/${colorForm.colorId}` : 'https://myspectra.runasp.net/api/Colors';
    const method = colorForm.colorId ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` }, body: JSON.stringify({ colorName: colorForm.colorName, hexCode: colorForm.hexCode }) });
      if (res.ok) { setColorForm({ colorId: '', colorName: '', hexCode: '#000000' }); fetchColors(); alert(colorForm.colorId ? "Thành công!" : "Thêm thành công!"); }
    } catch (err) { alert(`Lỗi mạng: ${err.message}`); }
  };

  const handleDeleteColor = async (id) => {
    if (!window.confirm("Xóa màu sắc này?")) return;
    try { const res = await fetch(`https://myspectra.runasp.net/api/Colors/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${getToken()}` } }); if (res.ok) { fetchColors(); alert("Đã xóa!"); } } catch (err) { alert(`Lỗi mạng: ${err.message}`); }
  };

  // ⚡ MỚI: Quản lý Kiểu Dáng (Shape)
  const handleSaveShape = async (e) => {
    e.preventDefault();
    const url = shapeForm.shapeId ? `https://myspectra.runasp.net/api/Shapes/${shapeForm.shapeId}` : 'https://myspectra.runasp.net/api/Shapes';
    const method = shapeForm.shapeId ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` }, body: JSON.stringify({ shapeName: shapeForm.shapeName }) });
      if (res.ok) { setShapeForm({ shapeId: '', shapeName: '' }); fetchShapes(); alert(shapeForm.shapeId ? "Thành công!" : "Thêm thành công!"); }
    } catch (err) { alert(`Lỗi mạng: ${err.message}`); }
  };

  const handleDeleteShape = async (id) => {
    if (!window.confirm("Xóa kiểu dáng này?")) return;
    try { const res = await fetch(`https://myspectra.runasp.net/api/Shapes/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${getToken()}` } }); if (res.ok) { fetchShapes(); alert("Đã xóa!"); } } catch (err) { alert(`Lỗi mạng: ${err.message}`); }
  };

  const errorStyle = { color: '#ef4444', fontSize: '13px', marginTop: '4px', display: 'block', fontWeight: 'bold' };

  return (
    <div className="admin-products-container">
      <div className="admin-products-header" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <h2 className="admin-products-title" style={{ marginRight: 'auto' }}>Quản Lý Kính</h2>
        <button className="btn-edit" style={{ padding: '8px' }} onClick={() => setShowBrandModal(true)}>🏷️ Thương hiệu</button>
        <button className="btn-edit" style={{ padding: '8px' }} onClick={() => setShowMaterialModal(true)}>💎 Chất liệu</button>
        <button className="btn-edit" style={{ padding: '8px' }} onClick={() => setShowColorModal(true)}>🎨 Màu sắc</button>
        <button className="btn-edit" style={{ padding: '8px' }} onClick={() => setShowShapeModal(true)}>📐 Kiểu dáng</button>
        <button className="btn-add" onClick={openAddModal}>+ Thêm Kính Mới</button>
      </div>

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Tên Kính</th>
              <th>Thương Hiệu</th>
              <th>Chất Liệu</th>
              <th>Kiểu Dáng</th>
              <th>Giá ($)</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {allFrames && allFrames.length > 0 ? (
              allFrames.map(frame => (
                <tr key={frame.frameId}>
                  <td className="col-name">{frame.frameName}</td>
                  <td className="col-text">{frame.brand?.brandName || 'N/A'}</td>
                  <td className="col-text">{frame.material?.materialName || 'N/A'}</td>
                  <td className="col-text">{frame.shape?.shapeName || frame.shape || 'N/A'}</td>
                  <td className="col-price">${frame.basePrice}</td>
                  <td className="col-action">
                    <button onClick={() => openEditModal(frame)} className="btn-edit">Sửa</button>
                    <button onClick={() => handleDeleteFrame(frame.frameId)} className="btn-delete">Xóa</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="6" style={{ textAlign: 'center' }}>Đang tải hoặc chưa có dữ liệu kính.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ================= MODAL THÊM / SỬA KÍNH ================= */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <h3>{isEditing ? 'Sửa Thông Tin Kính' : 'Thêm Kính Mới'}</h3>
            
            <form onSubmit={handleSaveFrame} className="admin-form" noValidate>
              
              <div className="form-group">
                <label>Tên Kính:</label>
                <input type="text" name="frameName" value={formData.frameName} onChange={handleInputChange} />
                {fieldErrors.frameName && <span style={errorStyle}>{fieldErrors.frameName}</span>}
              </div>

              <div className="form-group">
                <label>Thương Hiệu:</label>
                <select name="brandId" value={formData.brandId} onChange={handleInputChange}>
                  <option value="">-- Chọn Thương Hiệu --</option>
                  {brands.map(b => <option key={b.brandId} value={b.brandId}>{b.brandName}</option>)}
                </select>
                {fieldErrors.brandId && <span style={errorStyle}>{fieldErrors.brandId}</span>}
              </div>

              <div className="form-group">
                <label>Chất Liệu:</label>
                <select name="materialId" value={formData.materialId} onChange={handleInputChange}>
                  <option value="">-- Chọn Chất Liệu --</option>
                  {materials.map(m => <option key={m.materialId} value={m.materialId}>{m.materialName}</option>)}
                </select>
                {fieldErrors.materialId && <span style={errorStyle}>{fieldErrors.materialId}</span>}
              </div>

               {/* ⚡ SỬA KIỂU DÁNG: Trỏ ID thay vì String cứng */}
               <div className="form-group">
                <label>Kiểu Dáng:</label>
                <select name="shapeId" value={formData.shapeId} onChange={handleInputChange}>
                  <option value="">-- Chọn Kiểu Dáng --</option>
                  {shapes.map(s => <option key={s.shapeId} value={s.shapeId}>{s.shapeName}</option>)}
                </select>
                {fieldErrors.shapeId && <span style={errorStyle}>{fieldErrors.shapeId}</span>}
              </div>

              <div className="form-group">
                <label>Kích cỡ (Size):</label>
                <select name="size" value={sizeOptions.find(s => s.toLowerCase() === (formData.size || '').toLowerCase()) || ''} onChange={handleInputChange}>
                  <option value="">-- Chọn Size --</option>
                  {sizeOptions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {fieldErrors.size && <span style={errorStyle}>{fieldErrors.size}</span>}
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Màu Sắc:</label>
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                  {colors.map(c => (
                    <label key={c.colorId} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={formData.colorIds.includes(c.colorId)} onChange={() => handleColorChange(c.colorId)}/>
                      <span style={{ display:'inline-block', width:'15px', height:'15px', backgroundColor: c.hexCode || '#ccc', borderRadius:'50%', border:'1px solid #999'}}></span>
                      {c.colorName}
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Giá ($):</label>
                <input type="number" name="basePrice" value={formData.basePrice} onChange={handleInputChange} min="0" />
                {fieldErrors.basePrice && <span style={errorStyle}>{fieldErrors.basePrice}</span>}
              </div>
              
              <div className="form-group">
                <label>Tồn Kho (Số lượng):</label>
                <input type="number" name="stockQuantity" value={formData.stockQuantity} onChange={handleInputChange} min="0" />
                {fieldErrors.stockQuantity && <span style={errorStyle}>{fieldErrors.stockQuantity}</span>}
              </div>
              
              <div className="form-group">
                <label>Cảnh báo hết hàng (Mức Reorder):</label>
                <input type="number" name="reorderLevel" value={formData.reorderLevel} onChange={handleInputChange} min="0" />
                {fieldErrors.reorderLevel && <span style={errorStyle}>{fieldErrors.reorderLevel}</span>}
              </div>

              <div className="form-group">
                <label>Rộng tròng (mm):</label>
                <input type="number" name="lensWidth" value={formData.lensWidth} onChange={handleInputChange} min="0" />
                {fieldErrors.lensWidth && <span style={errorStyle}>{fieldErrors.lensWidth}</span>}
              </div>
              
              <div className="form-group">
                <label>Cầu kính (mm):</label>
                <input type="number" name="bridgeWidth" value={formData.bridgeWidth} onChange={handleInputChange} min="0" />
                {fieldErrors.bridgeWidth && <span style={errorStyle}>{fieldErrors.bridgeWidth}</span>}
              </div>
              
              <div className="form-group">
                <label>Càng kính (mm):</label>
                <input type="number" name="templeLength" value={formData.templeLength} onChange={handleInputChange} min="0" />
                {fieldErrors.templeLength && <span style={errorStyle}>{fieldErrors.templeLength}</span>}
              </div>

              <div className="form-group">
                <label>Rộng khung kính (mm):</label>
                <input type="number" name="frameWidth" value={formData.frameWidth} onChange={handleInputChange} min="0" title="Yêu cầu phải bằng: (2 x Rộng tròng) + Cầu kính" />
                {fieldErrors.frameWidth && <span style={errorStyle}>{fieldErrors.frameWidth}</span>}
              </div>

              <div className="modal-actions" style={{ gridColumn: '1 / -1' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-cancel">Hủy</button>
                <button type="submit" className="btn-save">{isEditing ? 'Lưu Thay Đổi' : 'Thêm Kính'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL QUẢN LÝ KIỂU DÁNG (SHAPES) ================= */}
      {showShapeModal && (
        <div className="modal-overlay"><div className="modal-content" style={{ maxWidth: '500px' }}>
            <h3>Quản Lý Kiểu Dáng</h3>
            <form onSubmit={handleSaveShape} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <input type="text" value={shapeForm.shapeName} onChange={(e) => setShapeForm({...shapeForm, shapeName: e.target.value})} placeholder="Tên kiểu dáng..." required style={{ flex: 1, padding: '8px' }} />
              <button type="submit" className="btn-save">{shapeForm.shapeId ? 'Cập nhật' : 'Thêm'}</button>
              {shapeForm.shapeId && <button type="button" onClick={() => setShapeForm({shapeId:'', shapeName:''})} className="btn-cancel">Hủy</button>}
            </form>
            <ul style={{ listStyle: 'none', padding: 0, maxHeight: '300px', overflowY: 'auto' }}>
              {shapes.map(s => (
                <li key={s.shapeId} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #eee' }}>
                  <span>{s.shapeName}</span>
                  <div>
                    <button onClick={() => setShapeForm({shapeId: s.shapeId, shapeName: s.shapeName})} style={{ marginRight: '15px', color: '#3b82f6', border: 'none', background: 'none', cursor: 'pointer' }}>Sửa</button>
                    <button onClick={() => handleDeleteShape(s.shapeId)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }}>Xóa</button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="modal-actions"><button type="button" onClick={() => { setShowShapeModal(false); setShapeForm({shapeId:'', shapeName:''}); }} className="btn-cancel">Đóng</button></div>
        </div></div>
      )}

      {/* MODAL QUẢN LÝ THƯƠNG HIỆU */}
      {showBrandModal && (
        <div className="modal-overlay"><div className="modal-content" style={{ maxWidth: '500px' }}>
            <h3>Quản Lý Thương Hiệu</h3>
            <form onSubmit={handleSaveBrand} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <input type="text" value={brandForm.brandName} onChange={(e) => setBrandForm({...brandForm, brandName: e.target.value})} placeholder="Tên thương hiệu..." required style={{ flex: 1, padding: '8px' }} />
              <button type="submit" className="btn-save">{brandForm.brandId ? 'Cập nhật' : 'Thêm'}</button>
              {brandForm.brandId && <button type="button" onClick={() => setBrandForm({brandId:'', brandName:''})} className="btn-cancel">Hủy</button>}
            </form>
            <ul style={{ listStyle: 'none', padding: 0, maxHeight: '300px', overflowY: 'auto' }}>
              {brands.map(b => (
                <li key={b.brandId} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #eee' }}>
                  <span>{b.brandName}</span>
                  <div>
                    <button onClick={() => setBrandForm({brandId: b.brandId, brandName: b.brandName})} style={{ marginRight: '15px', color: '#3b82f6', border: 'none', background: 'none', cursor: 'pointer' }}>Sửa</button>
                    <button onClick={() => handleDeleteBrand(b.brandId)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }}>Xóa</button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="modal-actions"><button type="button" onClick={() => { setShowBrandModal(false); setBrandForm({brandId:'', brandName:''}); }} className="btn-cancel">Đóng</button></div>
        </div></div>
      )}

      {/* MODAL QUẢN LÝ CHẤT LIỆU */}
      {showMaterialModal && (
        <div className="modal-overlay"><div className="modal-content" style={{ maxWidth: '500px' }}>
            <h3>Quản Lý Chất Liệu</h3>
            <form onSubmit={handleSaveMaterial} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <input type="text" value={materialForm.materialName} onChange={(e) => setMaterialForm({...materialForm, materialName: e.target.value})} placeholder="Tên chất liệu..." required style={{ flex: 1, padding: '8px' }} />
              <button type="submit" className="btn-save">{materialForm.materialId ? 'Cập nhật' : 'Thêm'}</button>
              {materialForm.materialId && <button type="button" onClick={() => setMaterialForm({materialId:'', materialName:''})} className="btn-cancel">Hủy</button>}
            </form>
            <ul style={{ listStyle: 'none', padding: 0, maxHeight: '300px', overflowY: 'auto' }}>
              {materials.map(m => (
                <li key={m.materialId} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #eee' }}>
                  <span>{m.materialName}</span>
                  <div>
                    <button onClick={() => setMaterialForm({materialId: m.materialId, materialName: m.materialName})} style={{ marginRight: '15px', color: '#3b82f6', border: 'none', background: 'none', cursor: 'pointer' }}>Sửa</button>
                    <button onClick={() => handleDeleteMaterial(m.materialId)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }}>Xóa</button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="modal-actions"><button type="button" onClick={() => { setShowMaterialModal(false); setMaterialForm({materialId:'', materialName:''}); }} className="btn-cancel">Đóng</button></div>
        </div></div>
      )}

      {/* MODAL QUẢN LÝ MÀU SẮC */}
      {showColorModal && (
        <div className="modal-overlay"><div className="modal-content" style={{ maxWidth: '500px' }}>
            <h3>Quản Lý Màu Sắc</h3>
            <form onSubmit={handleSaveColor} style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center' }}>
              <input type="color" value={colorForm.hexCode} onChange={(e) => setColorForm({...colorForm, hexCode: e.target.value})} style={{ width: '40px', height: '40px', padding: '0', border: 'none' }} title="Chọn màu" />
              <input type="text" value={colorForm.colorName} onChange={(e) => setColorForm({...colorForm, colorName: e.target.value})} placeholder="Tên màu (VD: Đen nhám)..." required style={{ flex: 1, padding: '8px' }} />
              <button type="submit" className="btn-save">{colorForm.colorId ? 'Cập nhật' : 'Thêm'}</button>
              {colorForm.colorId && <button type="button" onClick={() => setColorForm({colorId:'', colorName:'', hexCode:'#000000'})} className="btn-cancel">Hủy</button>}
            </form>
            <ul style={{ listStyle: 'none', padding: 0, maxHeight: '300px', overflowY: 'auto' }}>
              {colors.map(c => (
                <li key={c.colorId} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #eee', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '20px', height: '20px', backgroundColor: c.hexCode, borderRadius: '50%', border: '1px solid #ddd' }}></div>
                    <span>{c.colorName}</span>
                  </div>
                  <div>
                    <button onClick={() => setColorForm({colorId: c.colorId, colorName: c.colorName, hexCode: c.hexCode || '#000000'})} style={{ marginRight: '15px', color: '#3b82f6', border: 'none', background: 'none', cursor: 'pointer' }}>Sửa</button>
                    <button onClick={() => handleDeleteColor(c.colorId)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }}>Xóa</button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="modal-actions"><button type="button" onClick={() => { setShowColorModal(false); setColorForm({colorId:'', colorName:'', hexCode:'#000000'}); }} className="btn-cancel">Đóng</button></div>
        </div></div>
      )}

    </div>
  );
}