import React, { useState, useEffect, useContext } from "react";
import { UserContext } from "../context/UserContext";
import "./AdminUsers.css";

export default function AdminUsers() {
  const { user } = useContext(UserContext);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  const myRole = user?.role || "";
  const myUserId = user?.userId;
  const token = user?.token;

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        "https://myspectra.runasp.net/api/Users?page=1&pageSize=100",
        { headers },
      );
      if (res.ok) {
        const data = await res.json();
        setUsers(data.items || data || []);
      } else {
        console.error("Error retrieving user list");
      }
    } catch (err) {
      console.error("Network error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Cho phép cả manager fetch data
  useEffect(() => {
    if (myRole === "admin" || myRole === "manager") {
      fetchUsers();
    }
  }, [myRole]);

  // Đuổi những ai KHÔNG PHẢI admin VÀ KHÔNG PHẢI manager
  if (myRole !== "admin" && myRole !== "manager") {
    return (
      <div style={{ textAlign: "center", padding: "50px", color: "#dc2626" }}>
        <h2>⛔ You do not have permission to access this function!</h2>
        <p>
          The account permission and management functions are exclusively for
          Admin/Manager.
        </p>
      </div>
    );
  }

  const handleRoleChange = async (userId, newRole) => {
    if (
      !window.confirm(
        `Are you sure you want to change this user's permissions to ${newRole}?`,
      )
    )
      return;
    try {
      const res = await fetch(
        `https://myspectra.runasp.net/api/Users/${userId}/role`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify({ role: newRole }),
        },
      );
      if (res.ok) {
        alert("Permissions updated successfully.!");
        fetchUsers();
      } else if (res.status === 403) {
        alert(
          "Error 403: Your account does not have sufficient permissions on the server (Backend is blocking it)!",
        );
      } else {
        try {
          const errorData = await res.json();
          alert(
            "Error updating permissions: " +
              (errorData.message || "Check the backend."),
          );
        } catch {
          alert("Error updating permissions: Server returned an error " + res.status);
        }
      }
    } catch (err) {
      alert("Network connection error: Unable to reach the server.");
    }
  };

  const handleStatusChange = async (userId, newStatus) => {
    if (
      !window.confirm(
        `Are you sure you want to change the status to ${newStatus}?`,
      )
    )
      return;
    try {
      const res = await fetch(
        `https://myspectra.runasp.net/api/Users/${userId}/status`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify({ status: newStatus }),
        },
      );
      if (res.ok) {
        alert("Status update successful!");
        fetchUsers();
      } else if (res.status === 403) {
        alert("Error 403: Backend refused to change state!");
      } else {
        try {
          const errorData = await res.json();
          alert(
            "Error updating status: " +
              (errorData.message || "Check the backend."),
          );
        } catch {
          alert("Error updating status: Server returned an error " + res.status);
        }
      }
    } catch (err) {
      alert("Network connection error.");
    }
  };

  return (
    <div
      className="admin-users-container"
      style={{
        padding: "20px",
        backgroundColor: "white",
        borderRadius: "8px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
      }}
    >
      <div
        className="admin-users-header"
        style={{
          borderBottom: "2px solid #f3f4f6",
          paddingBottom: "15px",
          marginBottom: "20px",
        }}
      >
        <h2 style={{ marginTop: 0 }}>
          User Management & Permissions (Demo Mode)
        </h2>
        <p style={{ color: "#6b7280", margin: 0 }}>
          Manage detailed information and grant permissions to the system.
        </p>
      </div>

      {isLoading ? (
        <div style={{ textAlign: "center", padding: "50px" }}>
          Loading data...
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
              fontSize: "14px",
            }}
          >
            <thead>
              <tr
                style={{
                  backgroundColor: "#f9fafb",
                  borderBottom: "2px solid #e5e7eb",
                }}
              >
                <th style={{ padding: "12px", color: "#374151" }}>Full name</th>
                <th style={{ padding: "12px", color: "#374151" }}>Email</th>
                {/* ⚡ THÊM CỘT SĐT VÀ ĐỊA CHỈ */}
                <th style={{ padding: "12px", color: "#374151" }}>
                  Phone number
                </th>
                <th style={{ padding: "12px", color: "#374151" }}>Address</th>
                <th style={{ padding: "12px", color: "#374151" }}>
                  Joining date
                </th>
                <th style={{ padding: "12px", color: "#374151" }}>
                  Role
                </th>
                <th style={{ padding: "12px", color: "#374151" }}>
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {users
                .slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
                .map((u) => (
                  <tr
                    key={u.userId}
                    style={{ borderBottom: "1px solid #f3f4f6" }}
                  >
                    <td style={{ padding: "12px", fontWeight: "bold" }}>
                      {u.fullName || "Not updated yet"}
                    </td>
                    <td style={{ padding: "12px" }}>{u.email}</td>

                    {/* ⚡ HIỂN THỊ SĐT VÀ ĐỊA CHỈ */}
                    <td style={{ padding: "12px" }}>
                      {u.phone || (
                        <span style={{ color: "#9ca3af", fontStyle: "italic" }}>
                          Not yet
                        </span>
                      )}
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        maxWidth: "200px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      title={u.address}
                    >
                      {u.address || (
                        <span style={{ color: "#9ca3af", fontStyle: "italic" }}>
                          Not yet
                        </span>
                      )}
                    </td>

                    <td style={{ padding: "12px" }}>
                      {new Date(u.createdAt).toLocaleDateString("vi-VN")}
                    </td>

                    <td style={{ padding: "12px" }}>
                      <select
                        value={u.role || "customer"}
                        onChange={(e) =>
                          handleRoleChange(u.userId, e.target.value)
                        }
                        disabled={u.userId === myUserId}
                        style={{
                          padding: "6px 10px",
                          borderRadius: "4px",
                          border: "1px solid #d1d5db",
                          outline: "none",
                          cursor:
                            u.userId === myUserId ? "not-allowed" : "pointer",
                          backgroundColor:
                            u.role === "admin"
                              ? "#fee2e2"
                              : u.role === "manager"
                                ? "#fef3c7"
                                : u.role === "staff"
                                  ? "#dbeafe"
                                  : "#f3f4f6",
                          color:
                            u.role === "admin"
                              ? "#991b1b"
                              : u.role === "manager"
                                ? "#92400e"
                                : u.role === "staff"
                                  ? "#1e40af"
                                  : "#374151",
                          fontWeight: "bold",
                        }}
                      >
                        <option value="customer">Customer</option>
                        <option value="staff">Staff</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>

                    <td style={{ padding: "12px" }}>
                      <select
                        value={u.status || "active"}
                        onChange={(e) =>
                          handleStatusChange(u.userId, e.target.value)
                        }
                        disabled={u.userId === myUserId}
                        style={{
                          padding: "6px 10px",
                          borderRadius: "4px",
                          border: "1px solid #d1d5db",
                          outline: "none",
                          cursor:
                            u.userId === myUserId ? "not-allowed" : "pointer",
                          backgroundColor:
                            u.status === "active"
                              ? "#d1fae5"
                              : u.status === "pending"
                                ? "#fef3c7"
                                : "#fee2e2",
                          color:
                            u.status === "active"
                              ? "#065f46"
                              : u.status === "pending"
                                ? "#92400e"
                                : "#991b1b",
                          fontWeight: "bold",
                        }}
                      >
                        <option value="active">Active</option>
                        <option value="pending">Pending</option>
                        <option value="inactive">
                          ⚪ Inactive
                        </option>
                        <option value="suspended">
                          Suspended
                        </option>
                      </select>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          {/* Pagination */}
          {(() => {
            const totalPages = Math.ceil(users.length / PAGE_SIZE);
            return totalPages > 1 ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "8px",
                  marginTop: "16px",
                  paddingBottom: "8px",
                }}
              >
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "4px",
                    border: "1px solid #d1d5db",
                    background: currentPage <= 1 ? "#f3f4f6" : "#fff",
                    cursor: currentPage <= 1 ? "not-allowed" : "pointer",
                    fontWeight: "bold",
                  }}
                >
                  ← Previous
                </button>
                <span style={{ fontWeight: "bold", color: "#374151" }}>
                  Page {currentPage} / {totalPages}
                </span>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "4px",
                    border: "1px solid #d1d5db",
                    background: currentPage >= totalPages ? "#f3f4f6" : "#fff",
                    cursor:
                      currentPage >= totalPages ? "not-allowed" : "pointer",
                    fontWeight: "bold",
                  }}
                >
                  Next →
                </button>
              </div>
            ) : null;
          })()}
        </div>
      )}
    </div>
  );
}
