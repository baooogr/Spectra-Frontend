import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import './UserProfile.css';

export default function UserProfile() {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("info");
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ fullName: '', phone: '', address: '' });
  const [isLoading, setIsLoading] = useState(true);

  
  const [prescriptions, setPrescriptions] = useState([]);
  const [isAddingPrescription, setIsAddingPrescription] = useState(false);
  const [prescriptionForm, setPrescriptionForm] = useState({
    sphereRight: 0, cylinderRight: 0, axisRight: 0, addRight: 0,
    sphereLeft: 0, cylinderLeft: 0, axisLeft: 0, addLeft: 0,
    pupillaryDistance: 60, doctorName: "", clinicName: ""
  });

  const token = user?.token || JSON.parse(localStorage.getItem("user"))?.token;

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchProfile();
    fetchPrescriptions(); 
  }, [token, navigate]);

  const fetchProfile = async () => {
    try {
      const res = await fetch("https://myspectra.runasp.net/api/Users/me", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setFormData({ fullName: data.fullName || '', phone: data.phone || '', address: data.address || '' });
      }
    } catch (err) { console.error("Lỗi profile"); } 
    finally { setIsLoading(false); }
  };

  
  const fetchPrescriptions = async () => {
    try {
      const res = await fetch("https://myspectra.runasp.net/api/Prescriptions/my?page=1&pageSize=10", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPrescriptions(data.items || data || []);
      }
    } catch (err) { console.error("Lỗi lấy toa thuốc"); }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("https://myspectra.runasp.net/api/Users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        alert("Cập nhật thành công!");
        setEditMode(false);
        fetchProfile();
      }
    } catch (err) { alert("Lỗi khi cập nhật"); }
  };

  
 const handleSavePrescription = async (e) => {
    e.preventDefault();
    
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 6);

    // ⚡ XỬ LÝ LỖI VALIDATION: Dùng null nếu không có giá trị thay vì dùng 0
    const payload = {
      sphereRight: prescriptionForm.sphereRight ? Number(prescriptionForm.sphereRight) : null,
      cylinderRight: prescriptionForm.cylinderRight ? Number(prescriptionForm.cylinderRight) : null,
      axisRight: prescriptionForm.axisRight ? Number(prescriptionForm.axisRight) : null,
      addRight: prescriptionForm.addRight ? Number(prescriptionForm.addRight) : null,
      
      sphereLeft: prescriptionForm.sphereLeft ? Number(prescriptionForm.sphereLeft) : null,
      cylinderLeft: prescriptionForm.cylinderLeft ? Number(prescriptionForm.cylinderLeft) : null,
      axisLeft: prescriptionForm.axisLeft ? Number(prescriptionForm.axisLeft) : null,
      addLeft: prescriptionForm.addLeft ? Number(prescriptionForm.addLeft) : null,
      
      pupillaryDistance: prescriptionForm.pupillaryDistance ? Number(prescriptionForm.pupillaryDistance) : 60,
      doctorName: prescriptionForm.doctorName || "Khách tự nhập",
      clinicName: prescriptionForm.clinicName || "Khách tự nhập",
      expirationDate: expiryDate.toISOString()
    };

    try {
      const res = await fetch("https://myspectra.runasp.net/api/Prescriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        alert("Đã lưu toa thuốc thành công!");
        setIsAddingPrescription(false);
        fetchPrescriptions(); 
      } else {
        const err = await res.json(); // Đọc dạng JSON để báo lỗi cụ thể
        alert("Lỗi nhập liệu: " + (err.message || "Kiểm tra lại các thông số."));
      }
    } catch (err) {
      alert("Lỗi kết nối.");
    }
  };

  if (isLoading) return <div style={{textAlign: 'center', padding: '50px'}}>Đang tải...</div>;

  return (
    <div className="profile-container" style={{maxWidth: '800px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif'}}>
      <h2 style={{borderBottom: '2px solid #000', paddingBottom: '10px'}}>Quản Lý Tài Khoản</h2>
      
      <div style={{display: 'flex', gap: '20px', marginBottom: '20px'}}>
        <button onClick={() => setActiveTab("info")} style={{padding: '10px 20px', fontWeight: 'bold', background: activeTab === 'info' ? '#000' : '#f3f4f6', color: activeTab === 'info' ? '#fff' : '#000', border: 'none', borderRadius: '5px', cursor: 'pointer'}}>Thông tin cá nhân</button>
        <button onClick={() => setActiveTab("prescription")} style={{padding: '10px 20px', fontWeight: 'bold', background: activeTab === 'prescription' ? '#000' : '#f3f4f6', color: activeTab === 'prescription' ? '#fff' : '#000', border: 'none', borderRadius: '5px', cursor: 'pointer'}}>Toa thuốc của tôi</button>
      </div>

      
      {activeTab === "info" && (
        <div style={{background: '#f9fafb', padding: '20px', borderRadius: '8px'}}>
          {!editMode ? (
            <div>
              <p><b>Họ và tên:</b> {profile?.fullName}</p>
              <p><b>Email:</b> {profile?.email}</p>
              <p><b>Số điện thoại:</b> {profile?.phone || 'Chưa cập nhật'}</p>
              <p><b>Địa chỉ:</b> {profile?.address || 'Chưa cập nhật'}</p>
              <button onClick={() => setEditMode(true)} style={{marginTop: '15px', padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer'}}>Sửa Thông Tin</button>
            </div>
          ) : (
            <form onSubmit={handleUpdateProfile} style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
              <input type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} placeholder="Họ và tên" required style={{padding: '10px'}} />
              <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="Số điện thoại" required style={{padding: '10px'}} />
              <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Địa chỉ giao hàng" required style={{padding: '10px'}} />
              <div style={{display: 'flex', gap: '10px'}}>
                <button type="submit" style={{padding: '10px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer'}}>Lưu thay đổi</button>
                <button type="button" onClick={() => setEditMode(false)} style={{padding: '10px 20px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer'}}>Hủy</button>
              </div>
            </form>
          )}
        </div>
      )}

     
      {activeTab === "prescription" && (
        <div style={{background: '#f9fafb', padding: '20px', borderRadius: '8px'}}>
          
          {!isAddingPrescription ? (
            <>
              <button onClick={() => setIsAddingPrescription(true)} style={{padding: '10px 20px', background: '#111827', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginBottom: '20px'}}>+ Thêm toa đo mắt mới</button>
              
              {prescriptions.length === 0 ? <p>Bạn chưa lưu toa thuốc nào.</p> : (
                prescriptions.map((p, idx) => (
                  <div key={idx} style={{background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '15px', position: 'relative'}}>
                    {p.isExpired && <span style={{position: 'absolute', top: '10px', right: '10px', background: '#fee2e2', color: '#b91c1c', padding: '3px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold'}}>Đã hết hạn</span>}
                    <h4 style={{marginTop: 0, color: '#4338ca'}}>Toa thuốc {new Date(p.createdAt).toLocaleDateString('vi-VN')}</h4>
                    <p style={{margin: '5px 0', fontSize: '14px'}}><b>Bác sĩ/Phòng khám:</b> {p.doctorName} - {p.clinicName}</p>
                    <p style={{margin: '5px 0', fontSize: '14px'}}><b>Ngày hết hạn:</b> {new Date(p.expirationDate).toLocaleDateString('vi-VN')}</p>
                    
                    <div style={{display: 'flex', gap: '20px', marginTop: '15px', padding: '10px', background: '#f3f4f6', borderRadius: '6px'}}>
                      <div>
                        <strong style={{color: '#dc2626'}}>Mắt Phải (R):</strong>
                        <div style={{fontSize: '14px'}}>Cận/Viễn (SPH): {p.sphereRight} | Loạn (CYL): {p.cylinderRight} | Trục (AXIS): {p.axisRight}</div>
                      </div>
                      <div style={{borderLeft: '1px solid #ccc', paddingLeft: '20px'}}>
                        <strong style={{color: '#2563eb'}}>Mắt Trái (L):</strong>
                        <div style={{fontSize: '14px'}}>Cận/Viễn (SPH): {p.sphereLeft} | Loạn (CYL): {p.cylinderLeft} | Trục (AXIS): {p.axisLeft}</div>
                      </div>
                    </div>
                    <p style={{margin: '10px 0 0 0', fontWeight: 'bold'}}>Khoảng cách đồng tử (PD): {p.pupillaryDistance} mm</p>
                  </div>
                ))
              )}
            </>
          ) : (
            <form onSubmit={handleSavePrescription} style={{background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb'}}>
              <h3 style={{marginTop: 0}}>Thêm Toa Thuốc Mới</h3>
              <p style={{fontSize: '13px', color: '#666', marginBottom: '20px'}}>Vui lòng điền các thông số theo giấy khám mắt của bạn. (Số âm là cận, số dương là viễn).</p>
              
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
                <div style={{border: '1px solid #fca5a5', padding: '15px', borderRadius: '6px'}}>
                  <h4 style={{color: '#dc2626', marginTop: 0}}>Mắt Phải (OD/Right)</h4>
                  <label style={{display: 'block', fontSize: '13px', marginBottom: '5px'}}>Độ Cầu (SPH):</label>
                  <input type="number" step="0.25" value={prescriptionForm.sphereRight} onChange={e => setPrescriptionForm({...prescriptionForm, sphereRight: parseFloat(e.target.value)})} style={{width: '100%', padding: '8px', marginBottom: '10px'}} />
                  
                  <label style={{display: 'block', fontSize: '13px', marginBottom: '5px'}}>Độ Loạn (CYL):</label>
                  <input type="number" step="0.25" value={prescriptionForm.cylinderRight} onChange={e => setPrescriptionForm({...prescriptionForm, cylinderRight: parseFloat(e.target.value)})} style={{width: '100%', padding: '8px', marginBottom: '10px'}} />
                  
                  <label style={{display: 'block', fontSize: '13px', marginBottom: '5px'}}>Trục (AXIS) 0-180:</label>
                  <input type="number" value={prescriptionForm.axisRight} onChange={e => setPrescriptionForm({...prescriptionForm, axisRight: parseInt(e.target.value)})} style={{width: '100%', padding: '8px'}} />
                </div>

                <div style={{border: '1px solid #93c5fd', padding: '15px', borderRadius: '6px'}}>
                  <h4 style={{color: '#2563eb', marginTop: 0}}>Mắt Trái (OS/Left)</h4>
                  <label style={{display: 'block', fontSize: '13px', marginBottom: '5px'}}>Độ Cầu (SPH):</label>
                  <input type="number" step="0.25" value={prescriptionForm.sphereLeft} onChange={e => setPrescriptionForm({...prescriptionForm, sphereLeft: parseFloat(e.target.value)})} style={{width: '100%', padding: '8px', marginBottom: '10px'}} />
                  
                  <label style={{display: 'block', fontSize: '13px', marginBottom: '5px'}}>Độ Loạn (CYL):</label>
                  <input type="number" step="0.25" value={prescriptionForm.cylinderLeft} onChange={e => setPrescriptionForm({...prescriptionForm, cylinderLeft: parseFloat(e.target.value)})} style={{width: '100%', padding: '8px', marginBottom: '10px'}} />
                  
                  <label style={{display: 'block', fontSize: '13px', marginBottom: '5px'}}>Trục (AXIS) 0-180:</label>
                  <input type="number" value={prescriptionForm.axisLeft} onChange={e => setPrescriptionForm({...prescriptionForm, axisLeft: parseInt(e.target.value)})} style={{width: '100%', padding: '8px'}} />
                </div>
              </div>

              <div style={{marginTop: '20px'}}>
                <label style={{fontWeight: 'bold', display: 'block', marginBottom: '5px'}}>Khoảng cách đồng tử (PD - mm):</label>
                <input type="number" required value={prescriptionForm.pupillaryDistance} onChange={e => setPrescriptionForm({...prescriptionForm, pupillaryDistance: parseFloat(e.target.value)})} style={{width: '100px', padding: '8px'}} />
              </div>

              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px'}}>
                <div>
                  <label style={{display: 'block', fontSize: '13px', marginBottom: '5px'}}>Tên Bác sĩ (Tùy chọn):</label>
                  <input type="text" value={prescriptionForm.doctorName} onChange={e => setPrescriptionForm({...prescriptionForm, doctorName: e.target.value})} style={{width: '100%', padding: '8px'}} />
                </div>
                <div>
                  <label style={{display: 'block', fontSize: '13px', marginBottom: '5px'}}>Phòng khám/Bệnh viện (Tùy chọn):</label>
                  <input type="text" value={prescriptionForm.clinicName} onChange={e => setPrescriptionForm({...prescriptionForm, clinicName: e.target.value})} style={{width: '100%', padding: '8px'}} />
                </div>
              </div>

              <div style={{display: 'flex', gap: '10px', marginTop: '25px'}}>
                <button type="submit" style={{padding: '10px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold'}}>Lưu Toa Thuốc</button>
                <button type="button" onClick={() => setIsAddingPrescription(false)} style={{padding: '10px 20px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer'}}>Hủy bỏ</button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}