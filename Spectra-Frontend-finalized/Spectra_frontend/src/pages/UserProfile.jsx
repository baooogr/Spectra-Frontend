import React, { useState, useEffect, useContext, useMemo } from "react";
import { UserContext } from "../context/UserContext";
import { useNavigate, Link } from "react-router-dom";
import "./UserProfile.css";
import VIETNAM_PROVINCES, {
  buildAddressString,
  parseAddressString,
  formatAddressForDisplay,
  getAddressDisplayString,
} from "../utils/vietnamAddress";
import { isValidVNPhone } from "../utils/validation";

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
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    province: "",
    district: "",
    ward: "",
    addressDetail: "",
  });
  const [phoneError, setPhoneError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [prescriptions, setPrescriptions] = useState([]);
  const [isAddingPrescription, setIsAddingPrescription] = useState(false);

  const [complaints, setComplaints] = useState([]);
  const [complaintsLoading, setComplaintsLoading] = useState(false);

  // Change password state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // State lưu lỗi theo khu vực
  const [validationErrors, setValidationErrors] = useState({
    right: [],
    left: [],
    other: [],
  });

  const [prescriptionForm, setPrescriptionForm] = useState({
    sphereRight: "0.00",
    cylinderRight: "0.00",
    axisRight: 0,
    sphereLeft: "0.00",
    cylinderLeft: "0.00",
    axisLeft: 0,
    pupillaryDistance: 60,
    doctorName: "",
    clinicName: "",
  });

  const token = user?.token || JSON.parse(localStorage.getItem("user"))?.token;

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchProfile();
    fetchPrescriptions();
    fetchComplaints();
  }, [token, navigate]);

  const fetchProfile = async () => {
    try {
      const res = await fetch("https://myspectra.runasp.net/api/Users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        const parsed = parseAddressString(data.address || "");
        setFormData({
          fullName: data.fullName || "",
          phone: data.phone || "",
          province: parsed.province,
          district: parsed.district,
          ward: parsed.ward,
          addressDetail: parsed.detail,
        });
      }
    } catch (err) {
      console.error("Error profile");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPrescriptions = async () => {
    try {
      const res = await fetch(
        "https://myspectra.runasp.net/api/Prescriptions/my?page=1&pageSize=10",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) {
        const data = await res.json();
        setPrescriptions(data.items || data || []);
      }
    } catch (err) {
      console.error("Prescription error");
    }
  };

  const fetchComplaints = async () => {
    setComplaintsLoading(true);
    try {
      const res = await fetch(
        "https://myspectra.runasp.net/api/Complaints/my?page=1&pageSize=50",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) {
        const data = await res.json();
        setComplaints(data.items || []);
      }
    } catch (err) {
      console.error("Error taking complaints");
    }
    setComplaintsLoading(false);
  };

  const complaintStatusMap = {
    pending: { text: "Pending", color: "#d97706", bg: "#fef3c7" },
    under_review: { text: "Under review", color: "#6366f1", bg: "#e0e7ff" },
    approved: { text: "Approved", color: "#059669", bg: "#d1fae5" },
    rejected: { text: "Rejected", color: "#dc2626", bg: "#fee2e2" },
    in_progress: { text: "In progress", color: "#3b82f6", bg: "#dbeafe" },
    resolved: { text: "Resolved", color: "#10b981", bg: "#d1fae5" },
    cancelled: { text: "Cancelled", color: "#6b7280", bg: "#f3f4f6" },
  };

  const complaintTypeMap = {
    return: "Return",
    exchange: "Exchange",
    refund: "Refund",
    complaint: "Complaint",
    warranty: "Warranty",
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setPhoneError("");

    if (formData.phone && !isValidVNPhone(formData.phone)) {
      setPhoneError(
        "The phone number is invalid. Please enter the correct format VN (+84 or 0xx).",
      );
      return;
    }
    if (!formData.province || !formData.district || !formData.ward) {
      alert("Please select the full Province/City, District/County, and Ward/Commune.");
      return;
    }
    if (!formData.addressDetail.trim()) {
      alert("Please enter the detailed address (house number, street name).");
      return;
    }

    const fullAddress = buildAddressString({
      province: formData.province,
      district: formData.district,
      ward: formData.ward,
      detail: formData.addressDetail.trim(),
    });

    try {
      const res = await fetch("https://myspectra.runasp.net/api/Users/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          phone: formData.phone,
          address: fullAddress,
        }),
      });
      if (res.ok) {
        alert("Updated successfully!");
        setEditMode(false);
        fetchProfile();
      }
    } catch (err) {
      alert("Error while updating");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (!passwordForm.currentPassword) {
      setPasswordError("Please enter your current password.");
      return;
    }
    if (!passwordForm.newPassword) {
      setPasswordError("Please enter your new password.");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError("The new password must have at least 6 characters.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("The verification password does not match.");
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await fetch(
        "https://myspectra.runasp.net/api/Auth/change-password",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currentPassword: passwordForm.currentPassword,
            newPassword: passwordForm.newPassword,
          }),
        },
      );
      const data = await res.json();
      if (res.ok) {
        setPasswordSuccess(data.message || "Password changed successfully.!");
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        setPasswordError(
          data.message ||
            "Password cannot be changed. Please double-check your current password.",
        );
      }
    } catch (err) {
      setPasswordError("Connection error. Please try again.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSavePrescription = async (e) => {
    e.preventDefault();
    setValidationErrors({ right: [], left: [], other: [] });

    // KIỂM TRA BẮT BUỘC NHẬP TRỤC (AXIS) KHI CÓ LOẠN (CYL) NGAY TẠI FRONTEND
    if (
      (Number(prescriptionForm.cylinderRight) !== 0 &&
        Number(prescriptionForm.axisRight) === 0) ||
      (Number(prescriptionForm.cylinderLeft) !== 0 &&
        Number(prescriptionForm.axisLeft) === 0)
    ) {
      setValidationErrors({
        other: [
          "Error: When you have Cyclism (CYL), you are required to select Axis (AXIS) from 1 to 180.",
        ],
      });
      return;
    }

    // Gửi dữ liệu lên Backend
    const payload = {
      SphereRight: Number(prescriptionForm.sphereRight),
      CylinderRight: Number(prescriptionForm.cylinderRight),
      AxisRight: Number(prescriptionForm.axisRight),
      AddRight: null, // Gửi null để tránh lỗi Range(0.75, 3.5)
      SphereLeft: Number(prescriptionForm.sphereLeft),
      CylinderLeft: Number(prescriptionForm.cylinderLeft),
      AxisLeft: Number(prescriptionForm.axisLeft),
      AddLeft: null, // Gửi null để tránh lỗi Range(0.75, 3.5)
      PupillaryDistance: Number(prescriptionForm.pupillaryDistance),
      DoctorName: prescriptionForm.doctorName || "Customers self-enter",
      ClinicName: prescriptionForm.clinicName || "Customers self-enter",
      ExpirationDate: "2026-12-31",
    };

    try {
      const res = await fetch(
        "https://myspectra.runasp.net/api/Prescriptions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      if (res.ok) {
        alert("Prescription successfully saved.!");
        setIsAddingPrescription(false);
        fetchPrescriptions();
      } else {
        const err = await res.json();
        if (err.errors) {
          const allMsgs = Object.values(err.errors).flat();
          setValidationErrors({
            right: allMsgs.filter((m) => m.toLowerCase().includes("right")),
            left: allMsgs.filter((m) => m.toLowerCase().includes("left")),
            other: allMsgs.filter(
              (m) =>
                !m.toLowerCase().includes("right") &&
                !m.toLowerCase().includes("left"),
            ),
          });
        } else {
          setValidationErrors({
            other: [err.message || "Input error. Please check again."],
          });
        }
      }
    } catch (err) {
      setValidationErrors({ other: ["Network connection error."] });
    }
  };

  if (isLoading)
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>Loading...</div>
    );

  return (
    <div
      className="profile-container"
      style={{
        maxWidth: "800px",
        margin: "40px auto",
        padding: "20px",
        fontFamily: "sans-serif",
      }}
    >
      <h2 style={{ borderBottom: "2px solid #000", paddingBottom: "10px" }}>
        Account Management
      </h2>

      <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
        <button
          onClick={() => setActiveTab("info")}
          style={{
            padding: "10px 20px",
            fontWeight: "bold",
            background: activeTab === "info" ? "#000" : "#f3f4f6",
            color: activeTab === "info" ? "#fff" : "#000",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Personal information
        </button>
        <button
          onClick={() => setActiveTab("prescription")}
          style={{
            padding: "10px 20px",
            fontWeight: "bold",
            background: activeTab === "prescription" ? "#000" : "#f3f4f6",
            color: activeTab === "prescription" ? "#fff" : "#000",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          My prescription
        </button>
        <button
          onClick={() => setActiveTab("complaints")}
          style={{
            padding: "10px 20px",
            fontWeight: "bold",
            background: activeTab === "complaints" ? "#000" : "#f3f4f6",
            color: activeTab === "complaints" ? "#fff" : "#000",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          My complaint
        </button>
        <button
          onClick={() => setActiveTab("password")}
          style={{
            padding: "10px 20px",
            fontWeight: "bold",
            background: activeTab === "password" ? "#000" : "#f3f4f6",
            color: activeTab === "password" ? "#fff" : "#000",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Change password
        </button>
      </div>

      {activeTab === "info" && (
        <div
          style={{
            background: "#f9fafb",
            padding: "20px",
            borderRadius: "8px",
          }}
        >
          {!editMode ? (
            <div>
              <p>
                <b>Full name:</b> {profile?.fullName}
              </p>
              <p>
                <b>Email:</b> {profile?.email}
              </p>
              <p>
                <b>Phone number:</b> {profile?.phone || "Not updated yet"}
              </p>
              <p>
                <b>Address:</b>{" "}
                {profile?.address
                  ? getAddressDisplayString(profile.address)
                  : "Not updated yet"}
              </p>
              <button
                onClick={() => setEditMode(true)}
                style={{
                  marginTop: "15px",
                  padding: "10px 20px",
                  background: "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}
              >
                Edit Information
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleUpdateProfile}
              style={{ display: "flex", flexDirection: "column", gap: "15px" }}
            >
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                placeholder="Full name"
                required
                style={{ padding: "10px" }}
              />
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => {
                  setFormData({ ...formData, phone: e.target.value });
                  setPhoneError("");
                }}
                placeholder="Phone number (Ex: 0912345678)"
                required
                style={{
                  padding: "10px",
                  border: phoneError ? "2px solid #ef4444" : undefined,
                }}
              />
              {phoneError && (
                <p
                  style={{
                    color: "#ef4444",
                    fontSize: "13px",
                    margin: "4px 0 0 0",
                  }}
                >
                  {phoneError}
                </p>
              )}

              {/* Tỉnh/Thành phố */}
              <select
                value={formData.province}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    province: e.target.value,
                    district: "",
                    ward: "",
                  });
                }}
                required
                style={{ padding: "10px" }}
              >
                <option value="">-- Select Province/City --</option>
                {VIETNAM_PROVINCES.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>

              {/* Quận/Huyện */}
              <select
                value={formData.district}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    district: e.target.value,
                    ward: "",
                  });
                }}
                required
                disabled={!formData.province}
                style={{ padding: "10px" }}
              >
                <option value="">-- Select District/County --</option>
                {(
                  VIETNAM_PROVINCES.find((p) => p.name === formData.province)
                    ?.districts || []
                ).map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>

              {/* Phường/Xã */}
              <select
                value={formData.ward}
                onChange={(e) => {
                  setFormData({ ...formData, ward: e.target.value });
                }}
                required
                disabled={!formData.district}
                style={{ padding: "10px" }}
              >
                <option value="">-- Select Ward/Commune --</option>
                {(
                  VIETNAM_PROVINCES.find(
                    (p) => p.name === formData.province,
                  )?.districts.find((d) => d.name === formData.district)
                    ?.wards || []
                ).map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>

              {/* Địa chỉ chi tiết */}
              <input
                type="text"
                value={formData.addressDetail}
                onChange={(e) =>
                  setFormData({ ...formData, addressDetail: e.target.value })
                }
                placeholder="House number, street name..."
                required
                style={{ padding: "10px" }}
              />
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="submit"
                  style={{
                    padding: "10px 20px",
                    background: "#10b981",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                  }}
                >
                  Save changes
                </button>
                <button
                  type="button"
                  onClick={() => setEditMode(false)}
                  style={{
                    padding: "10px 20px",
                    background: "#ef4444",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {activeTab === "prescription" && (
        <div
          style={{
            background: "#f9fafb",
            padding: "20px",
            borderRadius: "8px",
          }}
        >
          {!isAddingPrescription ? (
            <>
              <button
                onClick={() => {
                  setIsAddingPrescription(true);
                  setValidationErrors({ right: [], left: [], other: [] });
                }}
                style={{
                  padding: "10px 20px",
                  background: "#111827",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  marginBottom: "20px",
                }}
              >
                + Add a new eye prescription.
              </button>

              {prescriptions.length === 0 ? (
                <p>You haven't saved any prescriptions.</p>
              ) : (
                prescriptions.map((p, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: "white",
                      padding: "15px",
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                      marginBottom: "15px",
                      position: "relative",
                    }}
                  >
                    {p.isExpired && (
                      <span
                        style={{
                          position: "absolute",
                          top: "10px",
                          right: "10px",
                          background: "#fee2e2",
                          color: "#b91c1c",
                          padding: "3px 8px",
                          borderRadius: "4px",
                          fontSize: "12px",
                          fontWeight: "bold",
                        }}
                      >
                        Expired
                      </span>
                    )}
                    <h4 style={{ marginTop: 0, color: "#4338ca" }}>
                      Prescription{" "}
                      {new Date(p.createdAt).toLocaleDateString("vi-VN")}
                    </h4>
                    <p style={{ margin: "5px 0", fontSize: "14px" }}>
                      <b>Doctor/Clinic:</b> {p.doctorName} - {p.clinicName}
                    </p>
                    <p style={{ margin: "5px 0", fontSize: "14px" }}>
                      <b>Expirition date:</b>{" "}
                      {new Date(p.expirationDate).toLocaleDateString("vi-VN")}
                    </p>

                    <div
                      style={{
                        display: "flex",
                        gap: "20px",
                        marginTop: "15px",
                        padding: "10px",
                        background: "#f3f4f6",
                        borderRadius: "6px",
                      }}
                    >
                      <div>
                        <strong style={{ color: "#dc2626" }}>
                          Right Eye (R):
                        </strong>
                        <div style={{ fontSize: "14px" }}>
                          Nearsightedness/Farsightedness (SPH): {p.sphereRight} | Cylinder (CYL):{" "}
                          {p.cylinderRight} | Axis (AXIS): {p.axisRight}
                        </div>
                      </div>
                      <div
                        style={{
                          borderLeft: "1px solid #ccc",
                          paddingLeft: "20px",
                        }}
                      >
                        <strong style={{ color: "#2563eb" }}>
                          Left Eye (L):
                        </strong>
                        <div style={{ fontSize: "14px" }}>
                          Nearsightedness/Farsightedness (SPH): {p.sphereLeft} | Cylinder (CYL):{" "}
                          {p.cylinderLeft} | Axis (AXIS): {p.axisLeft}
                        </div>
                      </div>
                    </div>
                    <p style={{ margin: "10px 0 0 0", fontWeight: "bold" }}>
                      Pupillary Distance (PD): {p.pupillaryDistance} mm
                    </p>
                  </div>
                ))
              )}
            </>
          ) : (
            <form
              onSubmit={handleSavePrescription}
              style={{
                background: "white",
                padding: "20px",
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
              }}
            >
              <h3 style={{ marginTop: 0 }}>Add New Prescription</h3>
              <p
                style={{
                  fontSize: "13px",
                  color: "#666",
                  marginBottom: "20px",
                }}
              >
                Please fill in the information according to your eye exam report. (Negative numbers indicate nearsightedness, positive numbers indicate farsightedness).
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "20px",
                }}
              >
                {/* --- MẮT PHẢI (OD) --- */}
                <div
                  style={{
                    border: "1px solid #fca5a5",
                    padding: "15px",
                    borderRadius: "6px",
                    backgroundColor: "#fff5f5",
                  }}
                >
                  <h4 style={{ color: "#dc2626", marginTop: 0 }}>
                    Right Eye (OD/Right)
                  </h4>

                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      marginBottom: "5px",
                      fontWeight: "bold",
                    }}
                  >
                    Sphere (SPH):
                  </label>
                  <select
                    style={{
                      width: "100%",
                      padding: "8px",
                      marginBottom: "10px",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                    }}
                    value={prescriptionForm.sphereRight}
                    onChange={(e) =>
                      setPrescriptionForm({
                        ...prescriptionForm,
                        sphereRight: e.target.value,
                      })
                    }
                  >
                    {sphOptions.map((v) => (
                      <option key={v} value={v}>
                        {v > 0 ? `+${v}` : v}
                      </option>
                    ))}
                  </select>

                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      marginBottom: "5px",
                      fontWeight: "bold",
                    }}
                  >
                    Cylinder (CYL):
                  </label>
                  <select
                    style={{
                      width: "100%",
                      padding: "8px",
                      marginBottom: "10px",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                    }}
                    value={prescriptionForm.cylinderRight}
                    onChange={(e) => {
                      const val = e.target.value;
                      let newAxis = prescriptionForm.axisRight;

                      if (Number(val) === 0) {
                        newAxis = 0; // Nếu hết loạn thì trả Trục về 0
                      } else if (Number(newAxis) === 0) {
                        newAxis = 1; // Đồng bộ UI nhảy số 1 thì state cũng là 1
                      }

                      setPrescriptionForm({
                        ...prescriptionForm,
                        cylinderRight: val,
                        axisRight: newAxis,
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
                    style={{
                      display: "block",
                      fontSize: "13px",
                      marginBottom: "5px",
                      fontWeight: "bold",
                      color:
                        Number(prescriptionForm.cylinderRight) === 0
                          ? "#aaa"
                          : "#000",
                    }}
                  >
                    Axis (AXIS) 0-180:
                  </label>
                  <select
                    disabled={Number(prescriptionForm.cylinderRight) === 0}
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                      backgroundColor:
                        Number(prescriptionForm.cylinderRight) === 0
                          ? "#f3f4f6"
                          : "#fff",
                    }}
                    value={prescriptionForm.axisRight}
                    onChange={(e) =>
                      setPrescriptionForm({
                        ...prescriptionForm,
                        axisRight: e.target.value,
                      })
                    }
                  >
                    {axisOptions.map((v) =>
                      Number(prescriptionForm.cylinderRight) !== 0 &&
                      v === 0 ? null : (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ),
                    )}
                  </select>

                  {/* Hiện lỗi Mắt Phải */}
                  {validationErrors.right?.length > 0 && (
                    <ul
                      style={{
                        margin: "10px 0 0 0",
                        paddingLeft: "15px",
                        color: "#be123c",
                        fontSize: "12px",
                        fontWeight: "bold",
                      }}
                    >
                      {validationErrors.right.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* --- MẮT TRÁI (OS) --- */}
                <div
                  style={{
                    border: "1px solid #93c5fd",
                    padding: "15px",
                    borderRadius: "6px",
                    backgroundColor: "#eff6ff",
                  }}
                >
                  <h4 style={{ color: "#2563eb", marginTop: 0 }}>
                    Left Eye (OS/Left)
                  </h4>

                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      marginBottom: "5px",
                      fontWeight: "bold",
                    }}
                  >
                    Sphere (SPH):
                  </label>
                  <select
                    style={{
                      width: "100%",
                      padding: "8px",
                      marginBottom: "10px",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                    }}
                    value={prescriptionForm.sphereLeft}
                    onChange={(e) =>
                      setPrescriptionForm({
                        ...prescriptionForm,
                        sphereLeft: e.target.value,
                      })
                    }
                  >
                    {sphOptions.map((v) => (
                      <option key={v} value={v}>
                        {v > 0 ? `+${v}` : v}
                      </option>
                    ))}
                  </select>

                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      marginBottom: "5px",
                      fontWeight: "bold",
                    }}
                  >
                    Cylinder (CYL):
                  </label>
                  <select
                    style={{
                      width: "100%",
                      padding: "8px",
                      marginBottom: "10px",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                    }}
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
                        axisLeft: newAxis,
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
                    style={{
                      display: "block",
                      fontSize: "13px",
                      marginBottom: "5px",
                      fontWeight: "bold",
                      color:
                        Number(prescriptionForm.cylinderLeft) === 0
                          ? "#aaa"
                          : "#000",
                    }}
                  >
                    Axis (AXIS) 0-180:
                  </label>
                  <select
                    disabled={Number(prescriptionForm.cylinderLeft) === 0}
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                      backgroundColor:
                        Number(prescriptionForm.cylinderLeft) === 0
                          ? "#f3f4f6"
                          : "#fff",
                    }}
                    value={prescriptionForm.axisLeft}
                    onChange={(e) =>
                      setPrescriptionForm({
                        ...prescriptionForm,
                        axisLeft: e.target.value,
                      })
                    }
                  >
                    {axisOptions.map((v) =>
                      Number(prescriptionForm.cylinderLeft) !== 0 &&
                      v === 0 ? null : (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ),
                    )}
                  </select>

                  {/* Hiện lỗi Mắt Trái */}
                  {validationErrors.left?.length > 0 && (
                    <ul
                      style={{
                        margin: "10px 0 0 0",
                        paddingLeft: "15px",
                        color: "#be123c",
                        fontSize: "12px",
                        fontWeight: "bold",
                      }}
                    >
                      {validationErrors.left.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* --- PD VÀ BÁC SĨ --- */}
              <div
                style={{
                  marginTop: "20px",
                  padding: "15px",
                  backgroundColor: "#f9fafb",
                  borderRadius: "8px",
                }}
              >
                <label
                  style={{
                    fontWeight: "bold",
                    display: "inline-block",
                    marginBottom: "5px",
                  }}
                >
                  Pupillary Distance (PD - mm):
                </label>
                <select
                  style={{
                    marginLeft: "10px",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                    fontWeight: "bold",
                  }}
                  value={prescriptionForm.pupillaryDistance}
                  onChange={(e) =>
                    setPrescriptionForm({
                      ...prescriptionForm,
                      pupillaryDistance: e.target.value,
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

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "20px",
                  marginTop: "20px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      marginBottom: "5px",
                      fontWeight: "bold",
                    }}
                  >
                    Doctor's Name (Optional):
                  </label>
                  <input
                    type="text"
                    value={prescriptionForm.doctorName}
                    onChange={(e) =>
                      setPrescriptionForm({
                        ...prescriptionForm,
                        doctorName: e.target.value,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                    }}
                    placeholder="Enter the doctor's name..."
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      marginBottom: "5px",
                      fontWeight: "bold",
                    }}
                  >
                    Clinic/Hospital (Optional):
                  </label>
                  <input
                    type="text"
                    value={prescriptionForm.clinicName}
                    onChange={(e) =>
                      setPrescriptionForm({
                        ...prescriptionForm,
                        clinicName: e.target.value,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                    }}
                    placeholder="Enter the clinic name..."
                  />
                </div>
              </div>

              {/* Lỗi Khác */}
              {validationErrors.other?.length > 0 && (
                <div
                  style={{
                    marginTop: "15px",
                    padding: "10px",
                    backgroundColor: "#fff1f2",
                    color: "#be123c",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontWeight: "bold",
                    textAlign: "center",
                  }}
                >
                  {validationErrors.other.join(" | ")}
                </div>
              )}

              <div style={{ display: "flex", gap: "10px", marginTop: "25px" }}>
                <button
                  type="submit"
                  style={{
                    padding: "12px 25px",
                    background: "#10b981",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "bold",
                    fontSize: "15px",
                  }}
                >
                  Save Prescriptions
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingPrescription(false)}
                  style={{
                    padding: "12px 25px",
                    background: "#ef4444",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "bold",
                    fontSize: "15px",
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}
      {activeTab === "complaints" && (
        <div
          style={{
            background: "#f9fafb",
            padding: "20px",
            borderRadius: "8px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <h3 style={{ margin: 0 }}>List of complaints</h3>
            <Link
              to="/orders"
              style={{
                padding: "10px 20px",
                background: "#111827",
                color: "white",
                border: "none",
                borderRadius: "5px",
                textDecoration: "none",
                fontWeight: "bold",
                fontSize: "14px",
              }}
            >
              View your order to file a complaint.
            </Link>
          </div>

          {complaintsLoading ? (
            <p>Loading...</p>
          ) : complaints.length === 0 ? (
            <p>
              You don't have any complaints yet. If you have a problem with your order, please create a new complaint.
            </p>
          ) : (
            complaints.map((c) => {
              const sInfo = complaintStatusMap[
                (c.status || "").toLowerCase()
              ] || { text: c.status, color: "#6b7280", bg: "#f3f4f6" };
              return (
                <div
                  key={c.requestId}
                  style={{
                    background: "white",
                    padding: "15px",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    marginBottom: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "8px",
                      marginBottom: "8px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "#1d4ed8",
                          background: "#dbeafe",
                          padding: "3px 12px",
                          borderRadius: "20px",
                        }}
                      >
                        {complaintTypeMap[
                          (c.requestType || "").toLowerCase()
                        ] || c.requestType}
                      </span>
                      <span
                        style={{
                          fontWeight: 600,
                          color: sInfo.color,
                          backgroundColor: sInfo.bg,
                          padding: "3px 12px",
                          borderRadius: "20px",
                          fontSize: "13px",
                        }}
                      >
                        {sInfo.text}
                      </span>
                    </div>
                    <span style={{ fontSize: "13px", color: "#9ca3af" }}>
                      {c.createdAt
                        ? new Date(c.createdAt).toLocaleDateString("vi-VN")
                        : ""}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#374151",
                      margin: "0 0 10px",
                      lineHeight: 1.5,
                    }}
                  >
                    {(c.reason || "").length > 120
                      ? c.reason.slice(0, 120) + "..."
                      : c.reason}
                  </p>
                  <div style={{ display: "flex", gap: "16px" }}>
                    <Link
                      to={`/complaints/${c.requestId}`}
                      style={{
                        fontSize: "14px",
                        color: "#3b82f6",
                        textDecoration: "none",
                        fontWeight: 600,
                      }}
                    >
                      See details →
                    </Link>
                    {c.canModify && (
                      <Link
                        to={`/complaints/${c.requestId}/edit`}
                        style={{
                          fontSize: "13px",
                          color: "#f59e0b",
                          textDecoration: "none",
                          fontWeight: 600,
                        }}
                      >
                        Edit
                      </Link>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === "password" && (
        <div
          style={{
            background: "#f9fafb",
            padding: "20px",
            borderRadius: "8px",
            maxWidth: "500px",
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: "20px" }}>Change password</h3>

          <form onSubmit={handleChangePassword}>
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "600",
                  fontSize: "14px",
                }}
              >
                Current password
              </label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    currentPassword: e.target.value,
                  })
                }
                placeholder="Enter your current password"
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "600",
                  fontSize: "14px",
                }}
              >
                New password
              </label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    newPassword: e.target.value,
                  })
                }
                placeholder="Enter a new password (at least 6 characters)"
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "600",
                  fontSize: "14px",
                }}
              >
                Confirm new password
              </label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    confirmPassword: e.target.value,
                  })
                }
                placeholder="Re-enter your new password."
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {passwordError && (
              <div
                style={{
                  padding: "12px",
                  backgroundColor: "#fee2e2",
                  color: "#dc2626",
                  borderRadius: "6px",
                  marginBottom: "20px",
                  fontSize: "14px",
                }}
              >
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div
                style={{
                  padding: "12px",
                  backgroundColor: "#d1fae5",
                  color: "#059669",
                  borderRadius: "6px",
                  marginBottom: "20px",
                  fontSize: "14px",
                }}
              >
                {passwordSuccess}
              </div>
            )}

            <button
              type="submit"
              disabled={isChangingPassword}
              style={{
                padding: "12px 24px",
                backgroundColor: isChangingPassword ? "#9ca3af" : "#111827",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontWeight: "bold",
                fontSize: "14px",
                cursor: isChangingPassword ? "not-allowed" : "pointer",
              }}
            >
              {isChangingPassword ? "Processing..." : "Change password"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
