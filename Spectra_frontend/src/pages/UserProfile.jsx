import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { useNavigate, Link } from 'react-router-dom';
import './UserProfile.css';

// --- 1. CÁC HÀM TẠO DỮ LIỆU DROPBOX (Đặt ngoài Component) ---
const generateOptions = (min, max, step = 0.25) => {
  const options = [];
  for (let i = min; i <= max; i = Math.round((i + step) * 100) / 100) {
    options.push(i.toFixed(2));
  }
  return options;
};

const sphOptions = generateOptions(-20, 12, 0.25);
const cylOptions = generateOptions(-6, 6, 0.25);
const pdOptions = Array.from({ length: 79 - 57 + 1 }, (_, i) => 57 + i);
const axisOptions = Array.from({ length: 181 }, (_, i) => i);

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

  const [complaints, setComplaints] = useState([]);
  const [complaintsLoading, setComplaintsLoading] = useState(false);
  const [complaintsError, setComplaintsError] = useState("");

  // State lưu lỗi theo khu vực
  const [validationErrors, setValidationErrors] = useState({ right: [], left: [], other: [] });

  const [prescriptionForm, setPrescriptionForm] = useState({
    sphereRight: "0.00", cylinderRight: "0.00", axisRight: 0,
    sphereLeft: "0.00", cylinderLeft: "0.00", axisLeft: 0,
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
    fetchComplaints();
  }, [token, navigate]);

  const fetchProfile = async () => {
    try {
      const res = await fetch("https://myspectra.runasp.net/api/Users/me", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);

        setFormData({
          fullName: data.fullName || '',
          phone: data.phone || '',
          address: data.address || ''
        });
      }
    } catch (err) {
      console.error("Lỗi profile");
    } finally {
      setIsLoading(false);
    }
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
    } catch (err) {
      console.error("Lỗi lấy toa thuốc");
    }
  };

  const fetchComplaints = async () => {
    try {
      setComplaintsLoading(true);
      setComplaintsError("");

      const res = await fetch("https://myspectra.runasp.net/api/Complaints/my?page=1&pageSize=10", {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setComplaints(data.items || data || []);
      } else {
        setComplaintsError("Không thể tải lịch sử khiếu nại.");
        setComplaints([]);
      }
    } catch (err) {
      setComplaintsError("Lỗi kết nối khi tải lịch sử khiếu nại.");
      setComplaints([]);
    } finally {
      setComplaintsLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("https://myspectra.runasp.net/api/Users/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        alert("Cập nhật thành công!");
        setEditMode(false);
        fetchProfile();
      }
    } catch (err) {
      alert("Lỗi khi cập nhật");
    }
  };

  const handleSavePrescription = async (e) => {
    e.preventDefault();
    setValidationErrors({ right: [], left: [], other: [] });

    // KIỂM TRA BẮT BUỘC NHẬP TRỤC (AXIS) KHI CÓ LOẠN (CYL) NGAY TẠI FRONTEND
    if (
      (Number(prescriptionForm.cylinderRight) !== 0 && Number(prescriptionForm.axisRight) === 0) ||
      (Number(prescriptionForm.cylinderLeft) !== 0 && Number(prescriptionForm.axisLeft) === 0)
    ) {
      setValidationErrors({
        right: [],
        left: [],
        other: ["Lỗi: Khi bạn có độ Loạn (CYL), bạn bắt buộc phải chọn Trục (AXIS) từ 1 đến 180."]
      });
      return;
    }

    const payload = {
      SphereRight: Number(prescriptionForm.sphereRight),
      CylinderRight: Number(prescriptionForm.cylinderRight),
      AxisRight: Number(prescriptionForm.axisRight),
      AddRight: null,
      SphereLeft: Number(prescriptionForm.sphereLeft),
      CylinderLeft: Number(prescriptionForm.cylinderLeft),
      AxisLeft: Number(prescriptionForm.axisLeft),
      AddLeft: null,
      PupillaryDistance: Number(prescriptionForm.pupillaryDistance),
      DoctorName: prescriptionForm.doctorName || "Khách tự nhập",
      ClinicName: prescriptionForm.clinicName || "Khách tự nhập",
      ExpirationDate: "2026-12-31"
    };

    try {
      const res = await fetch("https://myspectra.runasp.net/api/Prescriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert("Đã lưu toa thuốc thành công!");
        setIsAddingPrescription(false);
        fetchPrescriptions();
      } else {
        const err = await res.json();
        if (err.errors) {
          const allMsgs = Object.values(err.errors).flat();
          setValidationErrors({
            right: allMsgs.filter(m => m.toLowerCase().includes("right")),
            left: allMsgs.filter(m => m.toLowerCase().includes("left")),
            other: allMsgs.filter(m => !m.toLowerCase().includes("right") && !m.toLowerCase().includes("left"))
          });
        } else {
          setValidationErrors({ right: [], left: [], other: [err.message || "Lỗi nhập liệu. Vui lòng kiểm tra lại."] });
        }
      }
    } catch (err) {
      setValidationErrors({ right: [], left: [], other: ["Lỗi kết nối mạng."] });
    }
  };

  const getComplaintStatusLabel = (status) => {
    switch ((status || "").toLowerCase()) {
      case "pending":
        return "Chờ xử lý";
      case "processing":
        return "Đang xử lý";
      case "resolved":
        return "Đã xử lý";
      case "rejected":
        return "Từ chối";
      default:
        return status || "Không rõ";
    }
  };

  const getComplaintStatusClass = (status) => {
    switch ((status || "").toLowerCase()) {
      case "pending":
        return "complaint-status pending";
      case "processing":
        return "complaint-status processing";
      case "resolved":
        return "complaint-status resolved";
      case "rejected":
        return "complaint-status rejected";
      default:
        return "complaint-status";
    }
  };

  const getRequestTypeLabel = (type) => {
    switch ((type || "").toLowerCase()) {
      case "complaint":
        return "Khiếu nại";
      case "return":
        return "Trả hàng";
      case "exchange":
        return "Đổi hàng";
      case "refund":
        return "Hoàn tiền";
      case "warranty":
        return "Bảo hành";
      default:
        return type || "Không rõ";
    }
  };

  if (isLoading) return <div style={{ textAlign: 'center', padding: '50px' }}>Đang tải...</div>;

  return (
    <div className="profile-container" style={{ maxWidth: '800px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h2 style={{ borderBottom: '2px solid #000', paddingBottom: '10px' }}>Quản Lý Tài Khoản</h2>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab("info")}
          style={{
            padding: '10px 20px',
            fontWeight: 'bold',
            background: activeTab === 'info' ? '#000' : '#f3f4f6',
            color: activeTab === 'info' ? '#fff' : '#000',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Thông tin cá nhân
        </button>

        <button
          onClick={() => setActiveTab("prescription")}
          style={{
            padding: '10px 20px',
            fontWeight: 'bold',
            background: activeTab === 'prescription' ? '#000' : '#f3f4f6',
            color: activeTab === 'prescription' ? '#fff' : '#000',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Toa thuốc của tôi
        </button>

        <button
          onClick={() => setActiveTab("complaints")}
          style={{
            padding: '10px 20px',
            fontWeight: 'bold',
            background: activeTab === 'complaints' ? '#000' : '#f3f4f6',
            color: activeTab === 'complaints' ? '#fff' : '#000',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Lịch sử khiếu nại
        </button>
      </div>

      {activeTab === "info" && (
        <div style={{ background: '#f9fafb', padding: '20px', borderRadius: '8px' }}>
          {!editMode ? (
            <div>
              <p><b>Họ và tên:</b> {profile?.fullName}</p>
              <p><b>Email:</b> {profile?.email}</p>
              <p><b>Số điện thoại:</b> {profile?.phone || 'Chưa cập nhật'}</p>
              <p><b>Địa chỉ:</b> {profile?.address || 'Chưa cập nhật'}</p>
              <button
                onClick={() => setEditMode(true)}
                style={{
                  marginTop: '15px',
                  padding: '10px 20px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Sửa Thông Tin
              </button>
            </div>
          ) : (
            <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input
                type="text"
                value={formData.fullName}
                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Họ và tên"
                required
                style={{ padding: '10px' }}
              />
              <input
                type="text"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Số điện thoại"
                required
                style={{ padding: '10px' }}
              />
              <input
                type="text"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                placeholder="Địa chỉ giao hàng"
                required
                style={{ padding: '10px' }}
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  Lưu thay đổi
                </button>
                <button
                  type="button"
                  onClick={() => setEditMode(false)}
                  style={{
                    padding: '10px 20px',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  Hủy
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {activeTab === "prescription" && (
        <div style={{ background: '#f9fafb', padding: '20px', borderRadius: '8px' }}>
          {!isAddingPrescription ? (
            <>
              <button
                onClick={() => {
                  setIsAddingPrescription(true);
                  setValidationErrors({ right: [], left: [], other: [] });
                }}
                style={{
                  padding: '10px 20px',
                  background: '#111827',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  marginBottom: '20px'
                }}
              >
                + Thêm toa đo mắt mới
              </button>

              {prescriptions.length === 0 ? <p>Bạn chưa lưu toa thuốc nào.</p> : (
                prescriptions.map((p, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'white',
                      padding: '15px',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      marginBottom: '15px',
                      position: 'relative'
                    }}
                  >
                    {p.isExpired && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          background: '#fee2e2',
                          color: '#b91c1c',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}
                      >
                        Đã hết hạn
                      </span>
                    )}
                    <h4 style={{ marginTop: 0, color: '#4338ca' }}>
                      Toa thuốc {new Date(p.createdAt).toLocaleDateString('vi-VN')}
                    </h4>
                    <p style={{ margin: '5px 0', fontSize: '14px' }}>
                      <b>Bác sĩ/Phòng khám:</b> {p.doctorName} - {p.clinicName}
                    </p>
                    <p style={{ margin: '5px 0', fontSize: '14px' }}>
                      <b>Ngày hết hạn:</b> {new Date(p.expirationDate).toLocaleDateString('vi-VN')}
                    </p>

                    <div style={{ display: 'flex', gap: '20px', marginTop: '15px', padding: '10px', background: '#f3f4f6', borderRadius: '6px' }}>
                      <div>
                        <strong style={{ color: '#dc2626' }}>Mắt Phải (R):</strong>
                        <div style={{ fontSize: '14px' }}>
                          Cận/Viễn (SPH): {p.sphereRight} | Loạn (CYL): {p.cylinderRight} | Trục (AXIS): {p.axisRight}
                        </div>
                      </div>
                      <div style={{ borderLeft: '1px solid #ccc', paddingLeft: '20px' }}>
                        <strong style={{ color: '#2563eb' }}>Mắt Trái (L):</strong>
                        <div style={{ fontSize: '14px' }}>
                          Cận/Viễn (SPH): {p.sphereLeft} | Loạn (CYL): {p.cylinderLeft} | Trục (AXIS): {p.axisLeft}
                        </div>
                      </div>
                    </div>
                    <p style={{ margin: '10px 0 0 0', fontWeight: 'bold' }}>
                      Khoảng cách đồng tử (PD): {p.pupillaryDistance} mm
                    </p>
                  </div>
                ))
              )}
            </>
          ) : (
            <form onSubmit={handleSavePrescription} style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <h3 style={{ marginTop: 0 }}>Thêm Toa Thuốc Mới</h3>
              <p style={{ fontSize: '13px', color: '#666', marginBottom: '20px' }}>
                Vui lòng điền các thông số theo giấy khám mắt của bạn. (Số âm là cận, số dương là viễn).
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* --- MẮT PHẢI (OD) --- */}
                <div style={{ border: '1px solid #fca5a5', padding: '15px', borderRadius: '6px', backgroundColor: '#fff5f5' }}>
                  <h4 style={{ color: '#dc2626', marginTop: 0 }}>Mắt Phải (OD/Right)</h4>

                  <label style={{ display: 'block', fontSize: '13px', marginBottom: '5px', fontWeight: 'bold' }}>Độ Cầu (SPH):</label>
                  <select
                    style={{ width: '100%', padding: '8px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                    value={prescriptionForm.sphereRight}
                    onChange={e => setPrescriptionForm({ ...prescriptionForm, sphereRight: e.target.value })}
                  >
                    {sphOptions.map(v => <option key={v} value={v}>{v > 0 ? `+${v}` : v}</option>)}
                  </select>

                  <label style={{ display: 'block', fontSize: '13px', marginBottom: '5px', fontWeight: 'bold' }}>Độ Loạn (CYL):</label>
                  <select
                    style={{ width: '100%', padding: '8px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                    value={prescriptionForm.cylinderRight}
                    onChange={e => {
                      const val = e.target.value;
                      let newAxis = prescriptionForm.axisRight;

                      if (Number(val) === 0) {
                        newAxis = 0;
                      } else if (Number(newAxis) === 0) {
                        newAxis = 1;
                      }

                      setPrescriptionForm({
                        ...prescriptionForm,
                        cylinderRight: val,
                        axisRight: newAxis
                      });
                    }}
                  >
                    {cylOptions.map(v => <option key={v} value={v}>{v > 0 ? `+${v}` : v}</option>)}
                  </select>

                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      marginBottom: '5px',
                      fontWeight: 'bold',
                      color: Number(prescriptionForm.cylinderRight) === 0 ? '#aaa' : '#000'
                    }}
                  >
                    Trục (AXIS) 0-180:
                  </label>
                  <select
                    disabled={Number(prescriptionForm.cylinderRight) === 0}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid #ccc',
                      backgroundColor: Number(prescriptionForm.cylinderRight) === 0 ? '#f3f4f6' : '#fff'
                    }}
                    value={prescriptionForm.axisRight}
                    onChange={e => setPrescriptionForm({ ...prescriptionForm, axisRight: e.target.value })}
                  >
                    {axisOptions.map(v => (Number(prescriptionForm.cylinderRight) !== 0 && v === 0) ? null : <option key={v} value={v}>{v}</option>)}
                  </select>

                  {validationErrors.right?.length > 0 && (
                    <ul style={{ margin: '10px 0 0 0', paddingLeft: '15px', color: '#be123c', fontSize: '12px', fontWeight: 'bold' }}>
                      {validationErrors.right.map((err, i) => <li key={i}>{err}</li>)}
                    </ul>
                  )}
                </div>

                {/* --- MẮT TRÁI (OS) --- */}
                <div style={{ border: '1px solid #93c5fd', padding: '15px', borderRadius: '6px', backgroundColor: '#eff6ff' }}>
                  <h4 style={{ color: '#2563eb', marginTop: 0 }}>Mắt Trái (OS/Left)</h4>

                  <label style={{ display: 'block', fontSize: '13px', marginBottom: '5px', fontWeight: 'bold' }}>Độ Cầu (SPH):</label>
                  <select
                    style={{ width: '100%', padding: '8px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                    value={prescriptionForm.sphereLeft}
                    onChange={e => setPrescriptionForm({ ...prescriptionForm, sphereLeft: e.target.value })}
                  >
                    {sphOptions.map(v => <option key={v} value={v}>{v > 0 ? `+${v}` : v}</option>)}
                  </select>

                  <label style={{ display: 'block', fontSize: '13px', marginBottom: '5px', fontWeight: 'bold' }}>Độ Loạn (CYL):</label>
                  <select
                    style={{ width: '100%', padding: '8px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                    value={prescriptionForm.cylinderLeft}
                    onChange={e => {
                      const val = e.target.value;
                      let newAxis = prescriptionForm.axisLeft;

                      if (Number(val) === 0) {
                        newAxis = 0;
                      } else if (Number(newAxis) === 0) {
                        newAxis = 1;
                      }

                      setPrescriptionForm({
                        ...prescriptionForm,
                        cylinderLeft: val,
                        axisLeft: newAxis
                      });
                    }}
                  >
                    {cylOptions.map(v => <option key={v} value={v}>{v > 0 ? `+${v}` : v}</option>)}
                  </select>

                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      marginBottom: '5px',
                      fontWeight: 'bold',
                      color: Number(prescriptionForm.cylinderLeft) === 0 ? '#aaa' : '#000'
                    }}
                  >
                    Trục (AXIS) 0-180:
                  </label>
                  <select
                    disabled={Number(prescriptionForm.cylinderLeft) === 0}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid #ccc',
                      backgroundColor: Number(prescriptionForm.cylinderLeft) === 0 ? '#f3f4f6' : '#fff'
                    }}
                    value={prescriptionForm.axisLeft}
                    onChange={e => setPrescriptionForm({ ...prescriptionForm, axisLeft: e.target.value })}
                  >
                    {axisOptions.map(v => (Number(prescriptionForm.cylinderLeft) !== 0 && v === 0) ? null : <option key={v} value={v}>{v}</option>)}
                  </select>

                  {validationErrors.left?.length > 0 && (
                    <ul style={{ margin: '10px 0 0 0', paddingLeft: '15px', color: '#be123c', fontSize: '12px', fontWeight: 'bold' }}>
                      {validationErrors.left.map((err, i) => <li key={i}>{err}</li>)}
                    </ul>
                  )}
                </div>
              </div>

              <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                <label style={{ fontWeight: 'bold', display: 'inline-block', marginBottom: '5px' }}>
                  Khoảng cách đồng tử (PD - mm):
                </label>
                <select
                  style={{ marginLeft: '10px', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', fontWeight: 'bold' }}
                  value={prescriptionForm.pupillaryDistance}
                  onChange={e => setPrescriptionForm({ ...prescriptionForm, pupillaryDistance: e.target.value })}
                >
                  {pdOptions.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', marginBottom: '5px', fontWeight: 'bold' }}>
                    Tên Bác sĩ (Tùy chọn):
                  </label>
                  <input
                    type="text"
                    value={prescriptionForm.doctorName}
                    onChange={e => setPrescriptionForm({ ...prescriptionForm, doctorName: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                    placeholder="Nhập tên bác sĩ..."
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', marginBottom: '5px', fontWeight: 'bold' }}>
                    Phòng khám/Bệnh viện (Tùy chọn):
                  </label>
                  <input
                    type="text"
                    value={prescriptionForm.clinicName}
                    onChange={e => setPrescriptionForm({ ...prescriptionForm, clinicName: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                    placeholder="Nhập tên phòng khám..."
                  />
                </div>
              </div>

              {validationErrors.other?.length > 0 && (
                <div
                  style={{
                    marginTop: '15px',
                    padding: '10px',
                    backgroundColor: '#fff1f2',
                    color: '#be123c',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    textAlign: 'center'
                  }}
                >
                  ⚠️ {validationErrors.other.join(" | ")}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '25px' }}>
                <button
                  type="submit"
                  style={{
                    padding: '12px 25px',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '15px'
                  }}
                >
                  Lưu Toa Thuốc
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingPrescription(false)}
                  style={{
                    padding: '12px 25px',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '15px'
                  }}
                >
                  Hủy bỏ
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {activeTab === "complaints" && (
        <div style={{ background: '#f9fafb', padding: '20px', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <h3 style={{ margin: 0 }}>Lịch sử khiếu nại của tôi</h3>

            <button
              onClick={fetchComplaints}
              style={{
                padding: '8px 14px',
                background: '#111827',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Tải lại
            </button>
          </div>

          {complaintsLoading && (
            <div className="complaint-empty-box">Đang tải lịch sử khiếu nại...</div>
          )}

          {!complaintsLoading && complaintsError && (
            <div className="complaint-error-box">{complaintsError}</div>
          )}

          {!complaintsLoading && !complaintsError && complaints.length === 0 && (
            <div className="complaint-empty-box">Bạn chưa có yêu cầu khiếu nại nào.</div>
          )}

          {!complaintsLoading && !complaintsError && complaints.length > 0 && (
            <div className="complaint-history-list">
              {complaints.map((item, index) => {
                const complaintId = item.id || item.complaintId || index;
                const orderItemId = item.orderItemId || "—";
                const requestType = item.requestType || "";
                const reason = item.reason || item.content || "Không có nội dung";
                const status = item.status || "";
                const createdAt = item.createdAt;
                const mediaUrl = item.mediaUrl || "";

                return (
                  <div key={complaintId} className="complaint-history-card">
                    <div className="complaint-history-top">
                      <div>
                        <h4 className="complaint-history-title">
                          {getRequestTypeLabel(requestType)}
                        </h4>
                        <p className="complaint-history-meta">
                          Mã khiếu nại: <b>{complaintId}</b>
                        </p>
                        <p className="complaint-history-meta">
                          Order Item ID: <b>{orderItemId}</b>
                        </p>
                      </div>

                      <span className={getComplaintStatusClass(status)}>
                        {getComplaintStatusLabel(status)}
                      </span>
                    </div>

                    <div className="complaint-history-body">
                      <p className="complaint-history-text">
                        <b>Ngày tạo:</b>{" "}
                        {createdAt ? new Date(createdAt).toLocaleString("vi-VN") : "Không rõ"}
                      </p>

                      <p className="complaint-history-text">
                        <b>Nội dung:</b> {reason}
                      </p>

                      {mediaUrl && (
                        <p className="complaint-history-text">
                          <b>Minh chứng:</b>{" "}
                          <a href={mediaUrl} target="_blank" rel="noreferrer" className="complaint-link">
                            Xem file đính kèm
                          </a>
                        </p>
                      )}
                    </div>

                    <div className="complaint-history-actions">
                      <Link
                        to={`/complaint?orderItemId=${orderItemId}`}
                        className="complaint-action-btn"
                      >
                        Gửi khiếu nại mới cho sản phẩm này
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}