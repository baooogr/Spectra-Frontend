import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";

const API = "https://myspectra.runasp.net/api/Complaints";

const requestTypes = [
  { value: "complaint", label: "Complaint" },
  { value: "return", label: "Return" },
  { value: "exchange", label: "Exchange" },
  { value: "refund", label: "Refund" },
  { value: "warranty", label: "Warranty" },
];

const COMPLAINT_REASONS = {
  return: [
    "The product color is not as expected",
    "The product does not suit the face",
    "Frame size is not suitable",
    "Lens prescription is incorrect",
    "Product is defective / damaged upon arrival",
    "Received the wrong product",
    "Changed mind about the purchase",
  ],
  exchange: [
    "Received the wrong product color",
    "Received the wrong frame size",
    "Product has a manufacturing defect",
    "Want to exchange for another model",
    "Lens is scratched upon arrival",
    "Received the wrong lens type",
  ],
  refund: [
    "Product does not match the description",
    "Product is severely damaged",
    "Returned the product but have not received a refund",
    "Incorrect charge applied",
    "Order was delivered too late",
  ],
  warranty: [
    "Frame is broken/cracked during warranty period",
    "Lens coating is peeling off",
    "Frame hinge is loose/damaged",
    "Frame paint is peeling",
    "Screw is loose/missing",
  ],
  complaint: [
    "Product quality is not as expected",
    "Service attitude is not good",
    "Delivery is delayed",
    "Packaging is not careful",
    "Product information on the website is inaccurate",
    "Other (please specify below)",
  ],
};

export default function ComplaintEdit() {
  const { id } = useParams();
  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  const [requestType, setRequestType] = useState("");
  const [selectedReason, setSelectedReason] = useState("");
  const [reason, setReason] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const token = user?.token || JSON.parse(localStorage.getItem("user"))?.token;

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchComplaint = async () => {
      try {
        const res = await fetch(`${API}/${id}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();

          if (!(data.canModify || data.CanModify)) {
            navigate(`/complaints/${id}`);
            return;
          }

          const incomingType = data.requestType || data.RequestType || "";
          const incomingReason = data.reason || data.Reason || "";
          const incomingMediaUrl = data.mediaUrl || data.MediaUrl || "";

          setRequestType(incomingType);
          setMediaUrl(incomingMediaUrl);

          const matchedReason = (COMPLAINT_REASONS[incomingType] || []).find(
            (r) =>
              incomingReason === r || incomingReason.startsWith(`${r} - `),
          );

          if (matchedReason) {
            setSelectedReason(matchedReason);
            setReason(
              incomingReason === matchedReason
                ? ""
                : incomingReason.replace(`${matchedReason} - `, ""),
            );
          } else {
            setSelectedReason("");
            setReason(incomingReason);
          }
        } else {
          setError("Unable to load data.");
        }
      } catch {
        setError("Connection error.");
      }
      setLoading(false);
    };

    fetchComplaint();
  }, [id, token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!selectedReason && !reason.trim()) {
      setError("Please select or enter a reason.");
      return;
    }

    if (!mediaUrl.trim()) {
      setError(
        "Please enter an image/video proof link so staff can verify the issue.",
      );
      return;
    }

    const finalReason = selectedReason
      ? reason.trim()
        ? `${selectedReason} - ${reason.trim()}`
        : selectedReason
      : reason.trim();

    setSubmitting(true);
    try {
      const res = await fetch(`${API}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          requestType: requestType || undefined,
          reason: finalReason || undefined,
          mediaUrl: mediaUrl.trim() || undefined,
        }),
      });

      if (res.ok) {
        navigate(`/complaints/${id}`);
      } else {
        const err = await res.json();
        setError(err.message || err.Message || "Update failed.");
      }
    } catch {
      setError("Connection error.");
    }
    setSubmitting(false);
  };

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: "60px", color: "#666" }}>
        Loading...
      </div>
    );

  return (
    <div
      style={{
        maxWidth: "700px",
        margin: "40px auto",
        padding: "20px",
        fontFamily: "sans-serif",
      }}
    >
      <h2 style={{ marginBottom: "24px" }}>Edit Complaint</h2>
      <form
        onSubmit={handleSubmit}
        style={{
          backgroundColor: "#fff",
          padding: "30px",
          borderRadius: "12px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
        }}
      >
        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              fontWeight: "600",
              marginBottom: "6px",
              fontSize: "14px",
            }}
          >
            Request Type
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {requestTypes.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => {
                  setRequestType(t.value);
                  setSelectedReason("");
                  setReason("");
                }}
                style={{
                  padding: "8px 16px",
                  borderRadius: "20px",
                  border:
                    requestType === t.value
                      ? "2px solid #3b82f6"
                      : "1px solid #d1d5db",
                  backgroundColor: requestType === t.value ? "#dbeafe" : "#fff",
                  color: requestType === t.value ? "#1d4ed8" : "#374151",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: requestType === t.value ? "600" : "400",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              fontWeight: "600",
              marginBottom: "6px",
              fontSize: "14px",
            }}
          >
            Reason <span style={{ color: "#dc2626" }}>*</span>
          </label>

          {requestType && COMPLAINT_REASONS[requestType] ? (
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "14px",
                boxSizing: "border-box",
                marginBottom: "10px",
                backgroundColor: "#fff",
              }}
            >
              <option value="">-- Select reason --</option>
              {COMPLAINT_REASONS[requestType].map((r, idx) => (
                <option key={idx} value={r}>
                  {r}
                </option>
              ))}
            </select>
          ) : (
            <p
              style={{
                fontSize: "13px",
                color: "#6b7280",
                marginBottom: "10px",
              }}
            >
              Please select a request type first
            </p>
          )}

          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            placeholder="Add more details (optional)..."
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "14px",
              resize: "vertical",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              fontWeight: "600",
              marginBottom: "6px",
              fontSize: "14px",
            }}
          >
            Image/Video Link <span style={{ color: "#dc2626" }}>*</span>
          </label>
          <input
            value={mediaUrl}
            onChange={(e) => setMediaUrl(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "14px",
              boxSizing: "border-box",
            }}
          />
        </div>

        {error && (
          <div
            style={{
              color: "#dc2626",
              backgroundColor: "#fee2e2",
              padding: "10px 14px",
              borderRadius: "8px",
              marginBottom: "16px",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: "12px" }}>
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: "12px 24px",
              backgroundColor: "#3b82f6",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontWeight: "600",
              cursor: submitting ? "not-allowed" : "pointer",
            }}
          >
            {submitting ? "Saving..." : "Update"}
          </button>
          <button
            type="button"
            onClick={() => navigate(`/complaints/${id}`)}
            style={{
              padding: "12px 24px",
              backgroundColor: "#f3f4f6",
              color: "#374151",
              border: "none",
              borderRadius: "8px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}