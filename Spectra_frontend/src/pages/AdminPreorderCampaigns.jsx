import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../context/UserContext';
// Tái sử dụng lại CSS của trang AdminProducts để giao diện đồng bộ
import '../components/layout/AdminLayout.css'; 
import './AdminProducts.css'; 

export default function AdminPreorderCampaigns() {
  const { user } = useContext(UserContext);
  const [campaigns, setCampaigns] = useState([]);
  const [outOfStockFrames, setOutOfStockFrames] = useState([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Khởi tạo Form theo đúng API Backend yêu cầu
  const initialForm = {
    campaignName: "",
    description: "",
    startDate: "",
    endDate: "",
    maxSlots: 100,
    estimatedDeliveryDate: "",
    frames: [] // Sẽ chứa mảng các Frame: { frameId, campaignPrice, maxQuantityPerOrder }
  };
  const [formData, setFormData] = useState(initialForm);

  const token = user?.token || JSON.parse(localStorage.getItem("user"))?.token;
  const headers = { 
    "Content-Type": "application/json", 
    "Authorization": `Bearer ${token}` 
  };

  // Lấy danh sách Campaign để hiển thị ra bảng
  const fetchCampaigns = async () => {
    setIsLoading(true);
    try {
      // Gọi API lấy chiến dịch đang Active. 
      // (Nếu BE có viết API GET /api/PreorderCampaigns chung cho Admin thì đổi lại url nhé)
      const res = await fetch("https://myspectra.runasp.net/api/PreorderCampaigns/active", { headers });
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.items || data || []);
      }
    } catch (err) {
      console.error("Lỗi fetch campaigns:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // FLOW: Chỉ lấy danh sách Kính Đang Hết Hàng (Out of Stock) để đưa vào Pre-order
  const fetchOutOfStockFrames = async () => {
    try {
      const res = await fetch("https://myspectra.runasp.net/api/Frames/inventory/out-of-stock", { headers });
      if (res.ok) {
        const data = await res.json();
        setOutOfStockFrames(data.items || data || []);
      }
    } catch (err) {
      console.error("Lỗi fetch out of stock frames:", err);
    }
  };

  useEffect(() => {
    if (token) fetchCampaigns();
  }, [token]);

  const handleOpenModal = () => {
    setFormData(initialForm);
    fetchOutOfStockFrames(); // Mở modal thì mới bắt đầu gọi API check kho
    setIsModalOpen(true);
  };

  // Xử lý Tích chọn/Bỏ chọn sản phẩm đưa vào chiến dịch
  const handleToggleFrame = (frame) => {
    const isSelected = formData.frames.some(f => f.frameId === (frame.id || frame.frameId));
    if (isSelected) {
      // Nếu đã có thì xóa khỏi mảng
      setFormData(prev => ({
        ...prev,
        frames: prev.frames.filter(f => f.frameId !== (frame.id || frame.frameId))
      }));
    } else {
      // Nếu chưa có thì thêm vào mảng, thiết lập giá trị mặc định cho Giá Pre-order và Giới hạn mua
      setFormData(prev => ({
        ...prev,
        frames: [...prev.frames, {
          frameId: frame.id || frame.frameId,
          frameName: frame.frameName,
          basePrice: frame.basePrice,
          campaignPrice: frame.basePrice, // Khởi tạo Giá Pre-order = Giá Gốc (Admin tự sửa lại sau)
          maxQuantityPerOrder: 2 // Theo rule Backend là mặc định 2
        }]
      }));
    }
  };

  // Xử lý khi Admin tự gõ thay đổi Giá Preorder hoặc Số lượng giới hạn
  const handleFrameConfigChange = (frameId, field, value) => {
    setFormData(prev => ({
      ...prev,
      frames: prev.frames.map(f => f.frameId === frameId ? { ...f, [field]: Number(value) } : f)
    }));
  };

  // Gửi thông tin tạo Chiến dịch
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.frames.length === 0) {
      alert("Bạn phải chọn ít nhất 1 sản phẩm hết hàng để đưa vào chiến dịch này!");
      return;
    }
    
    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      alert("Lỗi: Ngày bắt đầu phải TRƯỚC ngày kết thúc!");
      return;
    }

    setIsSubmitting(true);
    
    
    const formatDt = (dt) => dt.length === 16 ? dt + ":00" : dt;

    const payload = {
      campaignName: formData.campaignName,
      description: formData.description,
      startDate: formatDt(formData.startDate),
      endDate: formatDt(formData.endDate),
      maxSlots: Number(formData.maxSlots),
      estimatedDeliveryDate: formatDt(formData.estimatedDeliveryDate),
      frames: formData.frames.map(f => ({
        frameId: f.frameId,
        campaignPrice: f.campaignPrice,
        maxQuantityPerOrder: f.maxQuantityPerOrder
      }))
    };

    try {
      const res = await fetch("https://myspectra.runasp.net/api/PreorderCampaigns", {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });
      
      if (res.ok || res.status === 201) {
        alert("Tạo chiến dịch Pre-order thành công! Sản phẩm này đã sống lại trên trang chủ.");
        setIsModalOpen(false);
        fetchCampaigns();
      } else {
        const err = await res.json();
        alert("Lỗi khi tạo: " + (err.message || res.status));
      }
    } catch (err) {
      alert("Lỗi kết nối tới máy chủ.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xử lý nút Kết thúc sớm Chiến dịch
  const handleEndCampaign = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn KẾT THÚC SỚM chiến dịch này? Sản phẩm sẽ lập tức bị ẩn khỏi trang chủ vì Out of Stock.")) return;
    
    try {
      const res = await fetch(`https://myspectra.runasp.net/api/PreorderCampaigns/${id}/end`, {
        method: "PATCH",
        headers
      });
      
      if (res.ok) {
        alert("Đã ép kết thúc chiến dịch!");
        fetchCampaigns();
      } else {
        alert("Lỗi khi kết thúc chiến dịch.");
      }
    } catch (err) {
      alert("Lỗi kết nối mạng.");
    }
  };

  return (
    <div className="admin-products-container">
      <div className="admin-products-header">
        <h2 className="admin-products-title">Quản Lý Chiến Dịch Pre-order</h2>
        <button onClick={handleOpenModal} className="btn-add">+ Tạo Chiến Dịch Mới</button>
      </div>

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Tên Chiến Dịch</th>
              <th>Thời gian chạy</th>
              <th>Ngày giao (Dự kiến)</th>
              <th>Số Suất (Slots)</th>
              <th>Trạng thái</th>
              <th className="col-action">Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? <tr><td colSpan="6" className="col-action">⏳ Đang tải dữ liệu...</td></tr> : 
             campaigns.length === 0 ? <tr><td colSpan="6" className="col-action">Chưa có chiến dịch nào.</td></tr> :
             campaigns.map((camp) => {
                const isActive = camp.status === "active";
                return (
                  <tr key={camp.campaignId || camp.id}>
                    <td className="col-name">
                      <div style={{fontWeight: 'bold', fontSize: '15px'}}>{camp.campaignName}</div>
                      <div style={{fontSize: '13px', color: '#6b7280'}}>Gồm {camp.frames?.length || 0} sản phẩm</div>
                    </td>
                    <td style={{fontSize: '14px', lineHeight: '1.5'}}>
                      <span style={{color: '#047857'}}>Bắt đầu: {new Date(camp.startDate).toLocaleDateString('vi-VN')}</span> <br/>
                      <span style={{color: '#be123c'}}>Kết thúc: {new Date(camp.endDate).toLocaleDateString('vi-VN')}</span>
                    </td>
                    <td style={{fontWeight: 'bold'}}>{new Date(camp.estimatedDeliveryDate).toLocaleDateString('vi-VN')}</td>
                    <td>
                      <span style={{fontWeight: 'bold', fontSize: '15px', color: camp.currentSlots >= camp.maxSlots ? 'red' : '#10b981'}}>
                        {camp.currentSlots || 0} / {camp.maxSlots}
                      </span>
                    </td>
                    <td>
                      {isActive 
                        ? <span style={{padding: '4px 8px', background: '#d1fae5', color: '#065f46', borderRadius: '4px', fontWeight: 'bold', fontSize: '12px'}}>Đang chạy</span>
                        : <span style={{padding: '4px 8px', background: '#fee2e2', color: '#991b1b', borderRadius: '4px', fontWeight: 'bold', fontSize: '12px'}}>Đã kết thúc</span>
                      }
                    </td>
                    <td className="col-action">
                      {isActive && (
                        <button onClick={() => handleEndCampaign(camp.campaignId || camp.id)} style={{padding: '8px 15px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'}}>
                          Kết Thúc Sớm
                        </button>
                      )}
                    </td>
                  </tr>
                );
             })}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 9999}}>
          <div className="modal-content" style={{background: 'white', padding: '30px', borderRadius: '12px', width: '800px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'}}>
            <h2 style={{marginTop: 0, borderBottom: '2px solid #f3f4f6', paddingBottom: '15px'}}>✨ Tạo Chiến Dịch Kích Cầu (Pre-order)</h2>
            
            <form onSubmit={handleSubmit}>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px'}}>
                <div>
                  <label style={{display: 'block', fontWeight: 'bold', marginBottom: '5px'}}>Tên Chiến Dịch (*)</label>
                  <input type="text" required value={formData.campaignName} onChange={e => setFormData({...formData, campaignName: e.target.value})} style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px'}} placeholder="VD: Mở bán giới hạn Kính Râm Hè 2026..." />
                </div>
                <div>
                  <label style={{display: 'block', fontWeight: 'bold', marginBottom: '5px'}}>Tổng Số Suất Cho Phép (*)</label>
                  <input type="number" required min="1" value={formData.maxSlots} onChange={e => setFormData({...formData, maxSlots: e.target.value})} style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px'}} />
                </div>
                <div style={{gridColumn: '1 / span 2'}}>
                  <label style={{display: 'block', fontWeight: 'bold', marginBottom: '5px'}}>Mô tả chiến dịch (Tùy chọn)</label>
                  <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', minHeight: '60px', fontFamily: 'inherit'}} placeholder="Khách hàng sẽ nhận được mức giá cực sốc..." />
                </div>
                <div>
                  <label style={{display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#047857'}}>Ngày Bắt Đầu Mở Bán (*)</label>
                  <input type="datetime-local" required value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #047857', backgroundColor: '#f0fdf4'}} />
                </div>
                <div>
                  <label style={{display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#be123c'}}>Ngày Kết Thúc (*)</label>
                  <input type="datetime-local" required value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #be123c', backgroundColor: '#fff1f2'}} />
                </div>
                <div style={{gridColumn: '1 / span 2'}}>
                  <label style={{display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#2563eb'}}>Ngày Dự Kiến Giao Hàng (*)</label>
                  <input type="datetime-local" required value={formData.estimatedDeliveryDate} onChange={e => setFormData({...formData, estimatedDeliveryDate: e.target.value})} style={{width: '100%', padding: '10px', borderRadius: '6px', border: '2px dashed #2563eb', backgroundColor: '#eff6ff'}} />
                </div>
              </div>

              
              <div style={{borderTop: '2px solid #f3f4f6', paddingTop: '20px', marginBottom: '25px'}}>
                <h3 style={{margin: '0 0 10px 0'}}>Chọn Sản Phẩm (Kho Đang Báo Hết Hàng)</h3>
                <p style={{fontSize: '13px', color: '#6b7280', margin: '0 0 15px 0'}}>Tích chọn sản phẩm Out of stock để đưa vào đợt Pre-order, tự thiết lập giá ưu đãi (Campaign Price) và Giới hạn mua mỗi người.</p>
                
                <div style={{maxHeight: '250px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#f9fafb'}}>
                  {outOfStockFrames.length === 0 ? (
                    <div style={{padding: '20px', textAlign: 'center', color: '#9ca3af', fontWeight: 'bold'}}>Không có sản phẩm nào đang hết hàng (out of stock) để chạy chiến dịch lúc này.</div>
                  ) : (
                    outOfStockFrames.map(frame => {
                      const isChecked = formData.frames.some(f => f.frameId === (frame.id || frame.frameId));
                      const frameConfig = formData.frames.find(f => f.frameId === (frame.id || frame.frameId));
                      
                      return (
                        <div key={frame.id || frame.frameId} style={{display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', borderBottom: '1px solid #e5e7eb', backgroundColor: isChecked ? '#eff6ff' : 'transparent', transition: '0.2s'}}>
                          <input type="checkbox" checked={isChecked} onChange={() => handleToggleFrame(frame)} style={{transform: 'scale(1.5)', cursor: 'pointer', marginLeft: '5px'}} />
                          <div style={{flex: 1, marginLeft: '10px'}}>
                            <strong style={{fontSize: '15px'}}>{frame.frameName}</strong> <br/>
                            <span style={{fontSize: '13px', color: '#6b7280'}}>Giá đang bán: <strong style={{textDecoration: 'line-through'}}>${frame.basePrice}</strong></span>
                          </div>
                          
                         
                          {isChecked && (
                            <div style={{display: 'flex', gap: '15px'}}>
                              <div>
                                <label style={{fontSize: '11px', display: 'block', fontWeight: 'bold', color: '#059669'}}>Giá KM Pre-order ($)</label>
                                <input type="number" step="0.01" min="0" value={frameConfig?.campaignPrice || 0} onChange={(e) => handleFrameConfigChange(frame.id || frame.frameId, 'campaignPrice', e.target.value)} style={{width: '120px', padding: '8px', borderRadius: '4px', border: '2px solid #059669', outline: 'none', fontWeight: 'bold', color: '#059669'}} />
                              </div>
                              <div>
                                <label style={{fontSize: '11px', display: 'block', fontWeight: 'bold'}}>Giới hạn Mua/Đơn</label>
                                <input type="number" min="1" value={frameConfig?.maxQuantityPerOrder || 2} onChange={(e) => handleFrameConfigChange(frame.id || frame.frameId, 'maxQuantityPerOrder', e.target.value)} style={{width: '100px', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', outline: 'none'}} />
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              <div style={{display: 'flex', justifyContent: 'flex-end', gap: '15px'}}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{padding: '12px 25px', backgroundColor: '#f3f4f6', color: '#111827', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px'}}>Hủy Bỏ</button>
                <button type="submit" disabled={isSubmitting} style={{padding: '12px 25px', backgroundColor: '#111827', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}>
                  {isSubmitting ? "Đang xử lý..." : "Chạy Chiến Dịch Ngay"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}