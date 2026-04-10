import React, { useState, useEffect, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import LensSelectionModal from "../components/ui/LensSelectionModal";

const API_COMPLAINTS = "https://myspectra.runasp.net/api/Complaints";
const API_FRAMES = "https://myspectra.runasp.net/api/Frames";

const fmt = (n) => n?.toLocaleString("vi-VN") ?? "—";

export default function ExchangeSelect() {
  const { id } = useParams();
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const token = user?.token || JSON.parse(localStorage.getItem("user"))?.token;

  const [complaint, setComplaint] = useState(null);
  const [frames, setFrames] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected frame & its full details
  const [selectedFrame, setSelectedFrame] = useState(null);
  const [frameDetail, setFrameDetail] = useState(null);
  const [supportedLensTypes, setSupportedLensTypes] = useState([]);
  const [selectedColor, setSelectedColor] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Lens config (filled by the modal)
  const [lensConfig, setLensConfig] = useState(null); // { lensIncluded, finalPrice, lensDetails }
  const [isLensModalOpen, setIsLensModalOpen] = useState(false);

  // Shipping form
  const [quantity, setQuantity] = useState(1);
  const [address, setAddress] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    loadData();
    fetchUserProfile();
  }, [id, token]);

  const fetchUserProfile = async () => {
    try {
      const res = await fetch("https://myspectra.runasp.net/api/Users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setFullName(data.fullName || "");
        setPhone(data.phone || "");
        setAddress(data.address || "");
      }
    } catch {
      /* ignore */
    }
  };

  const loadData = async () => {
    try {
      const [cRes, fRes] = await Promise.all([
        fetch(`${API_COMPLAINTS}/${id}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch(`${API_FRAMES}?page=1&pageSize=100`),
      ]);

      if (cRes.ok) {
        const c = await cRes.json();
        const status = (c.status || "").toLowerCase();
        const type = (c.requestType || "").toLowerCase();
        if (type !== "exchange") {
          setError("This complaint is not an Exchange type.");
        } else if (c.exchangeOrderId) {
          setError("An exchange order has already been created for this complaint.");
        } else if (status !== "approved" && status !== "in_progress") {
          setError("The request has not been approved yet. Please wait for staff to process it.");
        } else {
          setComplaint(c);
        }
      } else {
        setError("Unable to load complaint information.");
      }

      if (fRes.ok) {
        const fData = await fRes.json();
        const items = fData.items || fData || [];
        const seen = new Set();
        const unique = items.filter((f) => {
          if (seen.has(f.frameName)) return false;
          seen.add(f.frameName);
          return true;
        });
        setFrames(unique);
      }
    } catch {
      setError("Connection error. Please try again.");
    }
    setLoading(false);
  };

  // When user clicks a frame in the grid, fetch its full detail
  const handleSelectFrame = async (frame) => {
    setSelectedFrame(frame);
    setSelectedColor(null);
    setLensConfig(null);
    setFrameDetail(null);
    setSupportedLensTypes([]);
    setError("");
    setLoadingDetail(true);

    const frameId = frame.frameId || frame.id;
    try {
      const [detailRes, lensRes] = await Promise.all([
        fetch(`${API_FRAMES}/${frameId}`),
        fetch(`${API_FRAMES}/${frameId}/lens-types`),
      ]);

      if (detailRes.ok) {
        const detail = await detailRes.json();
        setFrameDetail(detail);
        // Auto-select first color
        if (detail.frameColors?.length > 0) {
          setSelectedColor(detail.frameColors[0]);
        }
      }
      if (lensRes.ok) {
        const lensData = await lensRes.json();
        setSupportedLensTypes(lensData.supportedLensTypes || []);
      }
    } catch {
      /* ignore */
    }
    setLoadingDetail(false);
  };

  const handleLensConfirm = (config) => {
    setLensConfig(config);
    setIsLensModalOpen(false);
  };

  const handleSubmit = async () => {
    if (!selectedFrame) {
      setError("Please select a replacement product.");
      return;
    }
    if (frameDetail?.frameColors?.length > 0 && !selectedColor) {
      setError("Please select a color.");
      return;
    }
    if (!lensConfig) {
      setError(
        "Please configure the lenses (click the 'Configure Lenses' button).",
      );
      return;
    }
    if (!fullName.trim()) {
      setError("Please enter the recipient's full name.");
      return;
    }
    if (!phone.trim()) {
      setError("Please enter the phone number.");
      return;
    }
    if (!address.trim()) {
      setError("Please enter the shipping address.");
      return;
    }
    setSubmitting(true);
    setError("");

    try {
      const frameId = String(
        frameDetail?.id || frameDetail?.frameId || selectedFrame.frameId,
      );
      const item = { frameId, quantity };

      // Color
      const getValidGuid = (val) => {
        if (!val || val === "null" || val === "undefined" || val === "")
          return undefined;
        return String(val);
      };
      const colorId = getValidGuid(
        selectedColor?.color?.id ||
        selectedColor?.color?.colorId ||
        selectedColor?.colorId,
      );
      if (colorId) item.selectedColorId = colorId;

      // Lens
      if (lensConfig?.lensIncluded && lensConfig.lensDetails) {
        const ld = lensConfig.lensDetails;
        const validTypeId = getValidGuid(ld.typeId);
        const validFeatureId = getValidGuid(ld.featureId);
        const validPrescriptionId = getValidGuid(ld.prescriptionId);
        if (validTypeId) item.lensTypeId = validTypeId;
        if (validFeatureId) item.featureId = validFeatureId;
        if (validPrescriptionId) item.prescriptionId = validPrescriptionId;
      }

      const payload = {
        shippingAddress: `[${fullName.trim()} - ${phone.trim()}] ${address.trim()}`,
        items: [item],
      };

      const res = await fetch(`${API_COMPLAINTS}/${id}/create-exchange-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json().catch(() => null);
        const exchangeTotal = data?.exchangeOrderTotal;
        const origPrice = data?.originalItemPrice;
        let msg = "Replacement order has been created successfully!";
        if (exchangeTotal != null && origPrice != null) {
          const diff = exchangeTotal - origPrice;
          if (diff > 0) {
            msg += `\n\nThe new product is more expensive by ${fmt(diff)}₫. You need to pay the difference.`;
          } else if (diff < 0) {
            msg += `\n\nThe new product is cheaper by ${fmt(Math.abs(diff))}₫. The difference will be refunded to you.`;
          } else {
            msg += "\n\nThe product prices are equivalent, so there is no price difference.";
          }
        }
        alert(msg);
        navigate(`/complaints/${id}`);
      } else {
        const err = await res.json().catch(() => null);
        setError(
          err?.message ||
          err?.Message ||
          "Failed to create exchange order. Please try again.",
        );
      }
    } catch {
      setError("Connection error. Please try again.");
    }
    setSubmitting(false);
  };

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: "60px", fontSize: "16px" }}>
        Loading...
      </div>
    );
  if (error && !complaint)
    return (
      <div style={{ textAlign: "center", padding: "60px" }}>
        <h2 style={{ color: "#dc2626" }}>{error}</h2>
        <Link to={`/complaints/${id}`} style={{ color: "#3b82f6" }}>
          ← Back to complaint details
        </Link>
      </div>
    );

  const originalItem = complaint?.originalItem;
  const filteredFrames = frames.filter(
    (f) => !search || f.frameName?.toLowerCase().includes(search.toLowerCase()),
  );
  const colorExtraCost = selectedColor?.colorExtraCost || 0;
  const displayPrice =
    (frameDetail?.basePrice ||
      selectedFrame?.basePrice ||
      selectedFrame?.price ||
      0) + colorExtraCost;

  // Price comparison
  const originalPrice =
    (originalItem?.unitPrice || 0) * (originalItem?.quantity || 1);
  const newTotalPrice = lensConfig ? lensConfig.finalPrice * quantity : null;
  const priceDiff =
    newTotalPrice !== null ? newTotalPrice - originalPrice : null;

  return (
    <div
      style={{
        maxWidth: "1000px",
        margin: "40px auto",
        padding: "20px",
        fontFamily: "sans-serif",
      }}
    >
      {/* Lens modal — reuses the existing LensSelectionModal */}
      <LensSelectionModal
        isOpen={isLensModalOpen}
        onClose={() => setIsLensModalOpen(false)}
        product={
          frameDetail ? { ...frameDetail, basePrice: displayPrice } : null
        }
        supportedLensTypes={supportedLensTypes}
        onConfirmAddToCart={handleLensConfirm}
      />

      <Link
        to={`/complaints/${id}`}
        style={{
          color: "#6b7280",
          textDecoration: "none",
          fontSize: "14px",
          display: "inline-block",
          marginBottom: "20px",
        }}
      >
        ← Back to complaint details
      </Link>

      <h2 style={{ margin: "0 0 8px", fontSize: "24px" }}>
        Select Replacement Product
      </h2>
      <p
        style={{
          color: "#6b7280",
          marginTop: 0,
          marginBottom: "24px",
          fontSize: "14px",
        }}
      >
        Complaint Code: <b>#{String(complaint.requestId).slice(0, 8)}</b>
      </p>

      {/* Original item summary */}
      {originalItem && (
        <div
          style={{
            marginBottom: "24px",
            padding: "16px",
            backgroundColor: "#faf5ff",
            borderRadius: "10px",
            border: "1px solid #e9d5ff",
          }}
        >
          <h4
            style={{
              marginTop: 0,
              marginBottom: "8px",
              color: "#7c3aed",
              fontSize: "14px",
            }}
          >
            Original Product (to be returned)
          </h4>
          <p style={{ margin: "2px 0", fontSize: "14px" }}>
            <b>{originalItem.frameName}</b> — {fmt(originalItem.unitPrice)}$ ×{" "}
            {originalItem.quantity || 1}
          </p>
        </div>
      )}

      {/* Search */}
      <div style={{ marginBottom: "16px" }}>
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            maxWidth: "400px",
            padding: "10px 14px",
            border: "1px solid #d1d5db",
            borderRadius: "8px",
            fontSize: "14px",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Product grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "28px",
        }}
      >
        {filteredFrames.map((f) => {
          const isSelected = selectedFrame?.frameId === f.frameId;
          const imgUrl =
            f.frameMedia?.[0]?.mediaUrl || f.media?.[0]?.mediaUrl || f.imageUrl;
          return (
            <div
              key={f.frameId}
              onClick={() => handleSelectFrame(f)}
              style={{
                cursor: "pointer",
                border: isSelected ? "2px solid #2563eb" : "1px solid #e5e7eb",
                borderRadius: "10px",
                padding: "12px",
                backgroundColor: isSelected ? "#eff6ff" : "#fff",
                transition: "all 0.15s",
                boxShadow: isSelected
                  ? "0 0 0 3px rgba(37,99,235,0.15)"
                  : "0 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              {imgUrl && (
                <img
                  src={imgUrl}
                  alt={f.frameName}
                  style={{
                    width: "100%",
                    height: "140px",
                    objectFit: "cover",
                    borderRadius: "6px",
                    marginBottom: "8px",
                  }}
                />
              )}
              <p
                style={{
                  margin: "0 0 4px",
                  fontWeight: 600,
                  fontSize: "14px",
                  color: "#111827",
                }}
              >
                {f.frameName}
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: "14px",
                  color: "#059669",
                  fontWeight: 600,
                }}
              >
                ${f.basePrice || f.price}
              </p>
              {isSelected && (
                <span
                  style={{
                    display: "inline-block",
                    marginTop: "6px",
                    fontSize: "12px",
                    color: "#2563eb",
                    fontWeight: 700,
                  }}
                >
                  ✓ Selected
                </span>
              )}
            </div>
          );
        })}
        {filteredFrames.length === 0 && (
          <p
            style={{
              gridColumn: "1/-1",
              textAlign: "center",
              color: "#9ca3af",
              padding: "40px 0",
            }}
          >
            No products found.
          </p>
        )}
      </div>

      {/* Configuration section — shown when a frame is selected */}
      {selectedFrame && (
        <div
          style={{
            backgroundColor: "#fff",
            padding: "24px",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: "16px", fontSize: "18px" }}>
            Confirm Exchange
          </h3>

          {loadingDetail ? (
            <p style={{ color: "#6b7280" }}>Loading product information...</p>
          ) : (
            <>
              {/* Old vs New comparison */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                  marginBottom: "20px",
                }}
              >
                {originalItem && (
                  <div
                    style={{
                      padding: "14px",
                      backgroundColor: "#fef2f2",
                      borderRadius: "8px",
                    }}
                  >
                    <p
                      style={{
                        margin: "0 0 4px",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#dc2626",
                      }}
                    >
                      OLD PRODUCT (RETURNED)
                    </p>
                    <p
                      style={{
                        margin: "2px 0",
                        fontSize: "14px",
                        fontWeight: 600,
                      }}
                    >
                      {originalItem.frameName}
                    </p>
                    <p
                      style={{
                        margin: "2px 0",
                        fontSize: "14px",
                        color: "#6b7280",
                      }}
                    >
                      Total paid: {fmt(originalPrice)}$
                    </p>
                  </div>
                )}
                <div
                  style={{
                    padding: "14px",
                    backgroundColor: "#eff6ff",
                    borderRadius: "8px",
                  }}
                >
                  <p
                    style={{
                      margin: "0 0 4px",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#2563eb",
                    }}
                  >
                    NEW PRODUCT
                  </p>
                  <p
                    style={{
                      margin: "2px 0",
                      fontSize: "14px",
                      fontWeight: 600,
                    }}
                  >
                    {selectedFrame.frameName}
                  </p>
                  <p
                    style={{
                      margin: "2px 0",
                      fontSize: "14px",
                      color: "#059669",
                    }}
                  >
                    Frame price: {fmt(displayPrice)}$
                  </p>
                </div>
              </div>

              {/* Price difference banner — only allow equal price */}
              {priceDiff !== null && originalItem && (
                <div
                  style={{
                    marginBottom: "20px",
                    padding: "14px 18px",
                    borderRadius: "10px",
                    border: `1px solid ${priceDiff === 0 ? "#93c5fd" : "#fca5a5"}`,
                    backgroundColor: priceDiff === 0 ? "#eff6ff" : "#fef2f2",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "8px",
                    }}
                  >
                    <div>
                      <p
                        style={{
                          margin: "0 0 4px",
                          fontWeight: 700,
                          fontSize: "15px",
                          color: priceDiff === 0 ? "#1e40af" : "#991b1b",
                        }}
                      >
                        {priceDiff === 0
                          ? "✓ Equivalent price — Exchange allowed"
                          : "✗ Price not equivalent — Exchange not allowed"}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "13px",
                          color: "#6b7280",
                        }}
                      >
                        Old product: {fmt(originalPrice)}$ → New product:{" "}
                        {fmt(newTotalPrice)}$
                      </p>
                    </div>
                    {priceDiff !== 0 && (
                      <p
                        style={{
                          margin: 0,
                          fontSize: "22px",
                          fontWeight: 800,
                          color: "#dc2626",
                        }}
                      >
                        {priceDiff > 0 ? "+" : "-"}
                        {fmt(Math.abs(priceDiff))}$
                      </p>
                    )}
                  </div>
                  {priceDiff !== 0 && (
                    <p
                      style={{
                        margin: "8px 0 0",
                        fontSize: "12px",
                        color: "#991b1b",
                        fontStyle: "italic",
                      }}
                    >
                      You can only exchange for a product with an equivalent
                      price. Please choose another product or change the lens
                      configuration.
                    </p>
                  )}
                </div>
              )}

              {/* Color selection */}
              {frameDetail?.frameColors?.length > 0 && (
                <div style={{ marginBottom: "16px" }}>
                  <label
                    style={{
                      display: "block",
                      fontWeight: 600,
                      marginBottom: "8px",
                      fontSize: "14px",
                    }}
                  >
                    Select Color *
                  </label>
                  <div
                    style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}
                  >
                    {frameDetail.frameColors.map((fc) => {
                      const isActive = selectedColor?.colorId === fc.colorId;
                      const stock = fc.stockQuantity || 0;
                      return (
                        <button
                          key={fc.colorId}
                          onClick={() => setSelectedColor(fc)}
                          style={{
                            padding: "8px 16px",
                            borderRadius: "6px",
                            cursor: stock > 0 ? "pointer" : "not-allowed",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            border: isActive
                              ? "2px solid #2563eb"
                              : "1px solid #d1d5db",
                            backgroundColor: isActive
                              ? "#eff6ff"
                              : stock > 0
                                ? "#fff"
                                : "#f3f4f6",
                            opacity: stock > 0 ? 1 : 0.5,
                          }}
                          disabled={stock <= 0}
                        >
                          <span
                            style={{
                              width: "16px",
                              height: "16px",
                              backgroundColor: fc.color?.hexCode || "#ccc",
                              borderRadius: "50%",
                              border: "1px solid #999",
                            }}
                          />
                          <span>{fc.color?.colorName || "N/A"}</span>
                          <span
                            style={{
                              fontSize: "11px",
                              color: stock > 0 ? "#059669" : "#dc2626",
                            }}
                          >
                            ({stock > 0 ? `${stock} left` : "Out of stock"})
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Lens configuration button */}
              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    fontWeight: 600,
                    marginBottom: "8px",
                    fontSize: "14px",
                  }}
                >
                  Lens Configuration *
                </label>
                {lensConfig ? (
                  <div
                    style={{
                      padding: "12px 16px",
                      backgroundColor: "#d1fae5",
                      borderRadius: "8px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "14px",
                          color: "#065f46",
                          fontWeight: 600,
                        }}
                      >
                        ✅{" "}
                        {lensConfig.lensIncluded
                          ? "Frame + Lenses"
                          : "Frame Only"}
                      </p>
                      <p
                        style={{
                          margin: "2px 0 0",
                          fontSize: "13px",
                          color: "#047857",
                        }}
                      >
                        Total: ${lensConfig.finalPrice}
                      </p>
                    </div>
                    <button
                      onClick={() => setIsLensModalOpen(true)}
                      style={{
                        padding: "6px 14px",
                        backgroundColor: "#fff",
                        border: "1px solid #059669",
                        borderRadius: "6px",
                        color: "#059669",
                        cursor: "pointer",
                        fontWeight: 600,
                        fontSize: "13px",
                      }}
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      if (!frameDetail) return;
                      setIsLensModalOpen(true);
                    }}
                    disabled={!frameDetail}
                    style={{
                      padding: "10px 22px",
                      backgroundColor: frameDetail ? "#111827" : "#9ca3af",
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      cursor: frameDetail ? "pointer" : "not-allowed",
                      fontWeight: "bold",
                      fontSize: "14px",
                    }}
                  >
                    👓 Configure Lenses
                  </button>
                )}
              </div>

              {/* Quantity */}
              <div style={{ marginBottom: "12px" }}>
                <label
                  style={{
                    display: "block",
                    fontWeight: 600,
                    marginBottom: "4px",
                    fontSize: "14px",
                  }}
                >
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedColor?.stockQuantity || 10}
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                  }
                  style={{
                    width: "80px",
                    padding: "8px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                  }}
                />
              </div>

              {/* Shipping info */}
              <div style={{ marginBottom: "12px" }}>
                <label
                  style={{
                    display: "block",
                    fontWeight: 600,
                    marginBottom: "4px",
                    fontSize: "14px",
                  }}
                >
                  Recipient Full Name *
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nguyen Van A"
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
              <div style={{ marginBottom: "12px" }}>
                <label
                  style={{
                    display: "block",
                    fontWeight: 600,
                    marginBottom: "4px",
                    fontSize: "14px",
                  }}
                >
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0901234567"
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
              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    fontWeight: 600,
                    marginBottom: "4px",
                    fontSize: "14px",
                  }}
                >
                  Shipping Address *
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 ABC Street, District 1, HCMC"
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
                    marginBottom: "14px",
                    fontSize: "13px",
                  }}
                >
                  {error}
                </div>
              )}

              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={handleSubmit}
                  disabled={
                    submitting || (priceDiff !== null && priceDiff !== 0)
                  }
                  style={{
                    padding: "12px 28px",
                    backgroundColor:
                      submitting || (priceDiff !== null && priceDiff !== 0)
                        ? "#9ca3af"
                        : "#2563eb",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: "bold",
                    fontSize: "15px",
                    cursor:
                      submitting || (priceDiff !== null && priceDiff !== 0)
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  {submitting ? "Creating order..." : "Confirm Exchange"}
                </button>
                <Link
                  to={`/complaints/${id}`}
                  style={{
                    padding: "12px 20px",
                    backgroundColor: "#f3f4f6",
                    color: "#374151",
                    borderRadius: "8px",
                    textDecoration: "none",
                    fontWeight: 600,
                    fontSize: "15px",
                    display: "inline-flex",
                    alignItems: "center",
                  }}
                >
                  Cancel
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
