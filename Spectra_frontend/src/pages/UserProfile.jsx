import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { useNavigate, useLocation } from 'react-router-dom';
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
  const location = useLocation();

  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'info');
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ fullName: '', phone: '', address: '' });
  const [isLoading, setIsLoading] = useState(true);

  const [prescriptions, setPrescriptions] = useState([]);
  const [isAddingPrescription, setIsAddingPrescription] = useState(false);

  // complaint history
  const [complaints, setComplaints] = useState([]);
  const [complaintLoading, setComplaintLoading] = useState(false);

  // State lưu lỗi theo khu vực
  const [validationErrors, setValidationErrors] = useState({ right: [], left: [], other: [] });

  const [prescriptionForm, setPrescriptionForm] = useState({
    sphereRight: '0.00',
    cylinderRight: '0.00',
    axisRight: 0,
    sphereLeft: '0.00',
    cylinderLeft: '0.00',
    axisLeft: 0,
    pupillaryDistance: 60,
    doctorName: '',
    clinicName: ''
  });

  const token = user?.token || JSON.parse(localStorage.getItem('user'))?.token;

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchProfile();
    fetchPrescriptions();
    fetchComplaints();
  }, [token, navigate]);

  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  const fetchProfile = async () => {
    try {
      const res = await fetch('https://myspectra.runasp.net/api/Users/me', {
        headers: { Authorization: `Bearer ${token}` }
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
      console.error('Lỗi profile');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPrescriptions = async () => {
    try {
      const res = await fetch('https://myspectra.runasp.net/api/Prescriptions/my?page=1&pageSize=10', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPrescriptions(data.items || data || []);
      }
    } catch (err) {
      console.error('Lỗi lấy toa thuốc');
    }
  };

  // ---- THÊM PHẦN LẤY LỊCH SỬ KHIẾU NẠI ----
  const fetchComplaints = async () => {
    try {
      setComplaintLoading(true);

      const res = await fetch('https://myspectra.runasp.net/api/Complaints/my?page=1&pageSize=20', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setComplaints(data.items || data || []);
      } else {
        setComplaints([]);
      }
    } catch (err) {
      console.error('Lỗi lấy lịch sử khiếu nại', err);
      setComplaints([]);
    } finally {
      setComplaintLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('https://myspectra.runasp.net/api/Users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        alert('Cập nhật thành công!');
        setEditMode(false);
        fetchProfile();
      }
    } catch (err) {
      alert('Lỗi khi cập nhật');
    }
  };

  const handleSavePrescription = async (e) => {
    e.preventDefault();
    setValidationErrors({ right: [], left: [], other: [] });

    if (
      (Number(prescriptionForm.cylinderRight) !== 0 && Number(prescriptionForm.axisRight) === 0) ||
      (Number(prescriptionForm.cylinderLeft) !== 0 && Number(prescriptionForm.axisLeft) === 0)
    ) {
      setValidationErrors({
        right: [],
        left: [],
        other: ['Lỗi: Khi bạn có độ Loạn (CYL), bạn bắt buộc phải chọn Trục (AXIS) từ 1 đến 180.']
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
      DoctorName: prescriptionForm.doctorName || 'Khách tự nhập',
      ClinicName: prescriptionForm.clinicName || 'Khách tự nhập',
      ExpirationDate: '2026-12-31'
    };

    try {
      const res = await fetch('https://myspectra.runasp.net/api/Prescriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert('Đã lưu toa thuốc thành công!');
        setIsAddingPrescription(false);
        fetchPrescriptions();
      } else {
        const err = await res.json();
        if (err.errors) {
          const allMsgs = Object.values(err.errors).flat();
          setValidationErrors({
            right: allMsgs.filter((m) => m.toLowerCase().includes('right')),
            left: allMsgs.filter((m) => m.toLowerCase().includes('left')),
            other: allMsgs.filter(
              (m) => !m.toLowerCase().includes('right') && !m.toLowerCase().includes('left')
            )
          });
        } else {
          setValidationErrors({
            right: [],
            left: [],
            other: [err.message || 'Lỗi nhập liệu. Vui lòng kiểm tra lại.']
          });
        }
      }
    } catch (err) {
      setValidationErrors({
        right: [],
        left: [],
        other: ['Lỗi kết nối mạng.']
      });
    }
  };

  const getComplaintStatusClass = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('pending') || s.includes('chờ')) return 'pending';
    if (s.includes('processing') || s.includes('xử lý')) return 'processing';
    if (s.includes('resolved') || s.includes('done') || s.includes('đã giải quyết')) return 'resolved';
    if (s.includes('rejected') || s.includes('từ chối')) return 'rejected';
    return 'default';
  };

  const formatDate = (date) => {
    if (!date) return 'Không có dữ liệu';
    return new Date(date).toLocaleDateString('vi-VN');
  };

  if (isLoading) {
    return <div className="profile-loading">Đang tải...</div>;
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <h2 className="profile-page-title">Quản Lý Tài Khoản</h2>

        <div className="profile-tabs">
          <button
            onClick={() => setActiveTab('info')}
            className={`profile-tab-btn ${activeTab === 'info' ? 'active' : ''}`}
          >
            Thông tin cá nhân
          </button>
          <button
            onClick={() => setActiveTab('prescription')}
            className={`profile-tab-btn ${activeTab === 'prescription' ? 'active' : ''}`}
          >
            Toa thuốc của tôi
          </button>
          <button
            onClick={() => setActiveTab('complaint')}
            className={`profile-tab-btn ${activeTab === 'complaint' ? 'active' : ''}`}
          >
            Lịch sử khiếu nại
          </button>
        </div>

        {activeTab === 'info' && (
          <div className="profile-section">
            {!editMode ? (
              <div>
                <p><b>Họ và tên:</b> {profile?.fullName}</p>
                <p><b>Email:</b> {profile?.email}</p>
                <p><b>Số điện thoại:</b> {profile?.phone || 'Chưa cập nhật'}</p>
                <p><b>Địa chỉ:</b> {profile?.address || 'Chưa cập nhật'}</p>

                <button
                  onClick={() => setEditMode(true)}
                  className="btn btn-blue"
                >
                  Sửa Thông Tin
                </button>
              </div>
            ) : (
              <form onSubmit={handleUpdateProfile} className="profile-form">
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Họ và tên"
                  required
                  className="form-input"
                />
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Số điện thoại"
                  required
                  className="form-input"
                />
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Địa chỉ giao hàng"
                  required
                  className="form-input"
                />
                <div className="form-actions">
                  <button type="submit" className="btn btn-green">
                    Lưu thay đổi
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditMode(false)}
                    className="btn btn-red"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {activeTab === 'prescription' && (
          <div className="profile-section">
            {!isAddingPrescription ? (
              <>
                <button
                  onClick={() => {
                    setIsAddingPrescription(true);
                    setValidationErrors({ right: [], left: [], other: [] });
                  }}
                  className="btn btn-dark prescription-add-btn"
                >
                  + Thêm toa đo mắt mới
                </button>

                {prescriptions.length === 0 ? (
                  <p>Bạn chưa lưu toa thuốc nào.</p>
                ) : (
                  prescriptions.map((p, idx) => (
                    <div key={idx} className="prescription-card">
                      {p.isExpired && (
                        <span className="expired-badge">Đã hết hạn</span>
                      )}

                      <h4 className="prescription-title">
                        Toa thuốc {formatDate(p.createdAt)}
                      </h4>

                      <p className="prescription-meta">
                        <b>Bác sĩ/Phòng khám:</b> {p.doctorName} - {p.clinicName}
                      </p>
                      <p className="prescription-meta">
                        <b>Ngày hết hạn:</b> {formatDate(p.expirationDate)}
                      </p>

                      <div className="prescription-eyes">
                        <div className="eye-box right-eye">
                          <strong>Mắt Phải (R):</strong>
                          <div>
                            Cận/Viễn (SPH): {p.sphereRight} | Loạn (CYL): {p.cylinderRight} | Trục (AXIS): {p.axisRight}
                          </div>
                        </div>

                        <div className="eye-box left-eye">
                          <strong>Mắt Trái (L):</strong>
                          <div>
                            Cận/Viễn (SPH): {p.sphereLeft} | Loạn (CYL): {p.cylinderLeft} | Trục (AXIS): {p.axisLeft}
                          </div>
                        </div>
                      </div>

                      <p className="pd-text">
                        Khoảng cách đồng tử (PD): {p.pupillaryDistance} mm
                      </p>
                    </div>
                  ))
                )}
              </>
            ) : (
              <form onSubmit={handleSavePrescription} className="prescription-form-card">
                <h3 className="form-title">Thêm Toa Thuốc Mới</h3>
                <p className="form-desc">
                  Vui lòng điền các thông số theo giấy khám mắt của bạn. (Số âm là cận, số dương là viễn).
                </p>

                <div className="eye-form-grid">
                  <div className="eye-form eye-form-right">
                    <h4 className="eye-form-title right-title">Mắt Phải (OD/Right)</h4>

                    <label className="field-label">Độ Cầu (SPH):</label>
                    <select
                      className="form-input"
                      value={prescriptionForm.sphereRight}
                      onChange={(e) =>
                        setPrescriptionForm({ ...prescriptionForm, sphereRight: e.target.value })
                      }
                    >
                      {sphOptions.map((v) => (
                        <option key={v} value={v}>
                          {v > 0 ? `+${v}` : v}
                        </option>
                      ))}
                    </select>

                    <label className="field-label">Độ Loạn (CYL):</label>
                    <select
                      className="form-input"
                      value={prescriptionForm.cylinderRight}
                      onChange={(e) => {
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
                      {cylOptions.map((v) => (
                        <option key={v} value={v}>
                          {v > 0 ? `+${v}` : v}
                        </option>
                      ))}
                    </select>

                    <label
                      className="field-label"
                      style={{
                        color: Number(prescriptionForm.cylinderRight) === 0 ? '#aaa' : '#000'
                      }}
                    >
                      Trục (AXIS) 0-180:
                    </label>
                    <select
                      disabled={Number(prescriptionForm.cylinderRight) === 0}
                      className="form-input"
                      value={prescriptionForm.axisRight}
                      onChange={(e) =>
                        setPrescriptionForm({ ...prescriptionForm, axisRight: e.target.value })
                      }
                    >
                      {axisOptions.map((v) =>
                        Number(prescriptionForm.cylinderRight) !== 0 && v === 0 ? null : (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        )
                      )}
                    </select>

                    {validationErrors.right?.length > 0 && (
                      <ul className="error-list">
                        {validationErrors.right.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="eye-form eye-form-left">
                    <h4 className="eye-form-title left-title">Mắt Trái (OS/Left)</h4>

                    <label className="field-label">Độ Cầu (SPH):</label>
                    <select
                      className="form-input"
                      value={prescriptionForm.sphereLeft}
                      onChange={(e) =>
                        setPrescriptionForm({ ...prescriptionForm, sphereLeft: e.target.value })
                      }
                    >
                      {sphOptions.map((v) => (
                        <option key={v} value={v}>
                          {v > 0 ? `+${v}` : v}
                        </option>
                      ))}
                    </select>

                    <label className="field-label">Độ Loạn (CYL):</label>
                    <select
                      className="form-input"
                      value={prescriptionForm.cylinderLeft}
                      onChange={(e) => {
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
                      {cylOptions.map((v) => (
                        <option key={v} value={v}>
                          {v > 0 ? `+${v}` : v}
                        </option>
                      ))}
                    </select>

                    <label
                      className="field-label"
                      style={{
                        color: Number(prescriptionForm.cylinderLeft) === 0 ? '#aaa' : '#000'
                      }}
                    >
                      Trục (AXIS) 0-180:
                    </label>
                    <select
                      disabled={Number(prescriptionForm.cylinderLeft) === 0}
                      className="form-input"
                      value={prescriptionForm.axisLeft}
                      onChange={(e) =>
                        setPrescriptionForm({ ...prescriptionForm, axisLeft: e.target.value })
                      }
                    >
                      {axisOptions.map((v) =>
                        Number(prescriptionForm.cylinderLeft) !== 0 && v === 0 ? null : (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        )
                      )}
                    </select>

                    {validationErrors.left?.length > 0 && (
                      <ul className="error-list">
                        {validationErrors.left.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div className="pd-box">
                  <label className="field-label inline-label">
                    Khoảng cách đồng tử (PD - mm):
                  </label>
                  <select
                    className="form-input pd-select"
                    value={prescriptionForm.pupillaryDistance}
                    onChange={(e) =>
                      setPrescriptionForm({
                        ...prescriptionForm,
                        pupillaryDistance: e.target.value
                      })
                    }
                  >
                    {pdOptions.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="doctor-grid">
                  <div>
                    <label className="field-label">Tên Bác sĩ (Tùy chọn):</label>
                    <input
                      type="text"
                      value={prescriptionForm.doctorName}
                      onChange={(e) =>
                        setPrescriptionForm({
                          ...prescriptionForm,
                          doctorName: e.target.value
                        })
                      }
                      className="form-input"
                      placeholder="Nhập tên bác sĩ..."
                    />
                  </div>
                  <div>
                    <label className="field-label">Phòng khám/Bệnh viện (Tùy chọn):</label>
                    <input
                      type="text"
                      value={prescriptionForm.clinicName}
                      onChange={(e) =>
                        setPrescriptionForm({
                          ...prescriptionForm,
                          clinicName: e.target.value
                        })
                      }
                      className="form-input"
                      placeholder="Nhập tên phòng khám..."
                    />
                  </div>
                </div>

                {validationErrors.other?.length > 0 && (
                  <div className="other-error-box">
                    ⚠️ {validationErrors.other.join(' | ')}
                  </div>
                )}

                <div className="form-actions">
                  <button type="submit" className="btn btn-green">
                    Lưu Toa Thuốc
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingPrescription(false)}
                    className="btn btn-red"
                  >
                    Hủy bỏ
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {activeTab === 'complaint' && (
          <div className="profile-section">
            <div className="complaint-header">
              <h3 className="complaint-title">Lịch sử khiếu nại của bạn</h3>
            </div>

            {complaintLoading ? (
              <p>Đang tải danh sách khiếu nại...</p>
            ) : complaints.length === 0 ? (
              <div className="empty-box">
                Bạn chưa có khiếu nại nào.
              </div>
            ) : (
              <div className="complaint-list">
                {complaints.map((c, index) => (
                  <div
                    key={c.id || c.complaintId || index}
                    className="complaint-card"
                  >
                    <div className="complaint-top">
                      <div>
                        <h4 className="complaint-card-title">
                          {c.title || c.subject || `Khiếu nại #${index + 1}`}
                        </h4>
                        <p className="complaint-date">
                          Ngày gửi: {formatDate(c.createdAt || c.createdDate || c.date)}
                        </p>
                      </div>

                      <span className={`complaint-status ${getComplaintStatusClass(c.status)}`}>
                        {c.status || 'Không rõ trạng thái'}
                      </span>
                    </div>

                    <div className="complaint-content">
                      <p>
                        <b>Loại khiếu nại:</b> {c.requestType || c.type || 'Không có dữ liệu'}
                      </p>
                      <p>
                        <b>Nội dung:</b> {c.content || c.description || c.message || 'Không có nội dung'}
                      </p>

                      {c.replyContent && (
                        <p>
                          <b>Phản hồi:</b> {c.replyContent}
                        </p>
                      )}

                      {c.internalNote && (
                        <p>
                          <b>Ghi chú xử lý:</b> {c.internalNote}
                        </p>
                      )}

                      {c.updatedAt && (
                        <p>
                          <b>Cập nhật lần cuối:</b> {formatDate(c.updatedAt)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}