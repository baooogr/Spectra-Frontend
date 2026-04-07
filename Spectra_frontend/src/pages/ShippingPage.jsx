import React, { useState, useEffect, useContext } from "react";
import { UserContext } from "../context/UserContext";
import {
  parseAddressString,
  getAddressDisplayString,
} from "../utils/vietnamAddress";
import { formatVNDNumber } from "../utils/validation";
import "./ShippingPage.css";

// --- HELPERS ---

function parseAddress(shippingAddress) {
  if (!shippingAddress) return { name: "", phone: "", street: "" };
  const matchNew = shippingAddress.match(/^\[(.*?) - (.*?) - (.*?)\]\s*(.*)$/);
  const matchOld = shippingAddress.match(/^\[(.*?) - (.*?)\]\s*(.*)$/);
  if (matchNew)
    return { name: matchNew[1], phone: matchNew[2], street: matchNew[4] };
  if (matchOld)
    return { name: matchOld[1], phone: matchOld[2], street: matchOld[3] };
  return { name: "", phone: "", street: shippingAddress };
}

// Normalize Vietnamese text for matching (remove diacritics, lowercase)
function normalizeVN(str) {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .trim();
}

// Find GHN province by name (fuzzy match)
function findGhnProvinceByName(provinces, name) {
  if (!name || !provinces?.length) return null;
  const normalized = normalizeVN(name);
  return provinces.find((p) => {
    const pName = normalizeVN(p.ProvinceName);
    return (
      pName === normalized ||
      pName.includes(normalized) ||
      normalized.includes(pName)
    );
  });
}

// Find GHN district by name (fuzzy match)
function findGhnDistrictByName(districts, name) {
  if (!name || !districts?.length) return null;
  const normalized = normalizeVN(name);
  return districts.find((d) => {
    const dName = normalizeVN(d.DistrictName);
    return (
      dName === normalized ||
      dName.includes(normalized) ||
      normalized.includes(dName)
    );
  });
}

// Find GHN ward by name (fuzzy match)
function findGhnWardByName(wards, name) {
  if (!name || !wards?.length) return null;
  const normalized = normalizeVN(name);
  return wards.find((w) => {
    const wName = normalizeVN(w.WardName);
    return (
      wName === normalized ||
      wName.includes(normalized) ||
      normalized.includes(wName)
    );
  });
}

function StatusBadge({ status }) {
  const map = {
    pending: { label: "Pending", color: "#d97706", bg: "#fef3c7" },
    confirmed: { label: "Confirmed", color: "#2563eb", bg: "#dbeafe" },
    processing: { label: "Processing", color: "#7c3aed", bg: "#ede9fe" },
    shipped: { label: "Shipped", color: "#0891b2", bg: "#cffafe" },
    delivered: { label: "Delivered", color: "#059669", bg: "#d1fae5" },
    cancelled: { label: "Cancelled", color: "#dc2626", bg: "#fee2e2" },
  };
  const s = map[status?.toLowerCase()] || {
    label: status || "N/A",
    color: "#6b7280",
    bg: "#f3f4f6",
  };
  return (
    <span
      style={{
        backgroundColor: s.bg,
        color: s.color,
        padding: "3px 10px",
        borderRadius: "12px",
        fontWeight: 600,
        fontSize: "13px",
        whiteSpace: "nowrap",
      }}
    >
      {s.label}
    </span>
  );
}

const CARRIERS = ["GHN", "Other"];

function ShippingMethodBadge({ method }) {
  const isExpress = method?.toLowerCase() === "express";
  return (
    <span
      style={{
        fontSize: "12px",
        fontWeight: 600,
        padding: "2px 8px",
        borderRadius: "10px",
        backgroundColor: isExpress ? "#fef3c7" : "#f0f9ff",
        color: isExpress ? "#92400e" : "#1e40af",
        whiteSpace: "nowrap",
      }}
    >
      {isExpress ? "Fast" : "Standard"}
    </span>
  );
}

const API_BASE = "https://myspectra.runasp.net/api";

// GHN Status mapping
const GHN_STATUS_MAP = {
  ready_to_pick: { label: "Ready to pick", color: "#6b7280" },
  picking: { label: "Picking", color: "#d97706" },
  cancel: { label: "Cancel", color: "#dc2626" },
  picked: { label: "Picked", color: "#2563eb" },
  storing: { label: "Storing", color: "#7c3aed" },
  transporting: { label: "Transporting", color: "#0891b2" },
  sorting: { label: "Sorting", color: "#7c3aed" },
  delivering: { label: "Delivering", color: "#0891b2" },
  delivered: { label: "Delivered", color: "#059669" },
  delivery_fail: { label: "Delivery fail", color: "#dc2626" },
  waiting_to_return: { label: "Waiting to return", color: "#d97706" },
  return: { label: "Return", color: "#9333ea" },
  returned: { label: "Returned", color: "#9333ea" },
};

// --- MAIN COMPONENT ---

export default function ShippingPage() {
  const { user } = useContext(UserContext);
  const token = user?.token || JSON.parse(localStorage.getItem("user"))?.token;
  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [activeTab, setActiveTab] = useState("active");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 5;

  // --- MODAL: Manual tracking ---
  const [showManualModal, setShowManualModal] = useState(false);
  const [selectedForManual, setSelectedForManual] = useState(null);
  const [manualForm, setManualForm] = useState({
    trackingNumber: "",
    carrier: "",
  });
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);

  // --- MODAL: GHN delivery creation ---
  const [showGhnModal, setShowGhnModal] = useState(false);
  const [ghnOrder, setGhnOrder] = useState(null);
  const [ghnStep, setGhnStep] = useState(1); // 1=address, 2=services, 3=creating
  const [ghnLoading, setGhnLoading] = useState(false);
  const [ghnError, setGhnError] = useState("");

  // GHN Address data
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState("");
  const [selectedDistrictId, setSelectedDistrictId] = useState("");
  const [selectedWardCode, setSelectedWardCode] = useState("");

  // Recipient info
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [destAddress, setDestAddress] = useState("");
  const [codAmount, setCodAmount] = useState(0);
  const [packageWeight, setPackageWeight] = useState(200); // grams
  const [insuranceValue, setInsuranceValue] = useState(0);

  // GHN Services & Fee
  const [ghnServices, setGhnServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [calculatedFee, setCalculatedFee] = useState(null);

  // GHN status
  const [ghnSandbox, setGhnSandbox] = useState(false);

  // --- MODAL: GHN tracking detail ---
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackingDetail, setTrackingDetail] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  // --- FETCH ORDERS ---

  const fetchOrders = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch(`${API_BASE}/OrdersV2?page=1&pageSize=100`, {
        headers: authHeaders,
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.items || data || []);
      } else {
        setErrorMsg("Unable to load order data.");
      }
    } catch {
      setErrorMsg("Network connection error.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch GHN provinces on mount
  const fetchProvinces = async () => {
    try {
      const res = await fetch(`${API_BASE}/Shipping/ghn/provinces`, {
        headers: authHeaders,
      });
      if (res.ok) {
        const data = await res.json();
        setProvinces(data || []);
      }
    } catch (err) {
      console.error("Failed to fetch provinces:", err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchOrders();
      fetchProvinces();
      // Check GHN sandbox status
      fetch(`${API_BASE}/Shipping/ghn/status`, { headers: authHeaders })
        .then((r) => (r.ok ? r.json() : {}))
        .then((data) => setGhnSandbox(data.isSandbox === true))
        .catch(() => {});
    } else {
      setIsLoading(false);
      setErrorMsg("You are not logged in or do not have permission.");
    }
  }, [token]);

  // Fetch districts when province changes
  useEffect(() => {
    if (selectedProvinceId) {
      setDistricts([]);
      setWards([]);
      setSelectedDistrictId("");
      setSelectedWardCode("");
      fetch(`${API_BASE}/Shipping/ghn/districts/${selectedProvinceId}`, {
        headers: authHeaders,
      })
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => setDistricts(data || []))
        .catch(() => {});
    }
  }, [selectedProvinceId]);

  // Fetch wards when district changes
  useEffect(() => {
    if (selectedDistrictId) {
      setWards([]);
      setSelectedWardCode("");
      fetch(`${API_BASE}/Shipping/ghn/wards/${selectedDistrictId}`, {
        headers: authHeaders,
      })
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => setWards(data || []))
        .catch(() => {});
    }
  }, [selectedDistrictId]);
  // --- STATUS UPDATE (Delivered) ---

  const handleMarkDelivered = async (order) => {
    const id = order.orderId || order.id;
    if (
      !window.confirm(
        `Confirmation that the order #${String(id).substring(0, 8)} has been successfully delivered?`,
      )
    )
      return;
    try {
      const res = await fetch(`${API_BASE}/OrdersV2/${id}/status`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({ status: "delivered" }),
      });
      if (res.ok) {
        alert("Status updated: Delivered ✓");
        fetchOrders();
      } else {
        const err = await res.json();
        alert("Error: " + (err.message || "Update failed."));
      }
    } catch {
      alert("Network error.");
    }
  };

  // --- MANUAL TRACKING ---

  const openManualModal = (order) => {
    setSelectedForManual(order);
    setManualForm({
      trackingNumber: order.trackingNumber || "",
      carrier: order.shippingCarrier || "",
    });
    setShowManualModal(true);
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualForm.trackingNumber.trim() || !manualForm.carrier) {
      alert("Please select a shipping carrier and enter the tracking number.");
      return;
    }
    const id = selectedForManual.orderId || selectedForManual.id;
    setIsSubmittingManual(true);
    try {
      const trackRes = await fetch(
        `${API_BASE}/Shipping/orders/${id}/tracking`,
        {
          method: "PATCH",
          headers: authHeaders,
          body: JSON.stringify({
            trackingNumber: manualForm.trackingNumber.trim(),
            carrier: manualForm.carrier,
          }),
        },
      );
      if (!trackRes.ok) {
        const err = await trackRes.json();
        alert("Error: " + (err.message || "Update failed."));
        return;
      }

      const trackData = await trackRes.json();
      if (trackData.status?.toLowerCase() !== "shipped") {
        await fetch(`${API_BASE}/OrdersV2/${id}/status`, {
          method: "PUT",
          headers: authHeaders,
          body: JSON.stringify({ status: "shipped" }),
        });
      }

      alert("Tracking number updated successfully! Order status → Shipped ✓");
      setShowManualModal(false);
      fetchOrders();
    } catch {
      alert("Network error.");
    } finally {
      setIsSubmittingManual(false);
    }
  };

  // --- GHN DELIVERY CREATION ---

  const openGhnModal = async (order) => {
    setGhnOrder(order);
    setGhnStep(1);
    setGhnServices([]);
    setSelectedService(null);
    setCalculatedFee(null);
    setGhnError("");
    setCodAmount(0);
    setPackageWeight(200);
    setInsuranceValue(0);
    setSelectedProvinceId("");
    setSelectedDistrictId("");
    setSelectedWardCode("");
    setDistricts([]);
    setWards([]);

    // Pre-fill from order address
    const addr = parseAddress(order.shippingAddress);
    setRecipientName(addr.name || "Customer");
    setRecipientPhone(addr.phone || "0900000000");
    setDestAddress(addr.street || order.shippingAddress || "");

    setShowGhnModal(true);

    // Try to auto-fill province/district/ward from structured address
    // The shipping address "street" part may contain the structured address
    const streetPart = addr.street || order.shippingAddress || "";
    const parsed = parseAddressString(streetPart);

    if (parsed.province && provinces.length > 0) {
      const matchedProvince = findGhnProvinceByName(provinces, parsed.province);
      if (matchedProvince) {
        const provId = String(matchedProvince.ProvinceID);
        setSelectedProvinceId(provId);

        // Fetch districts for auto-fill
        try {
          const distRes = await fetch(
            `${API_BASE}/Shipping/ghn/districts/${provId}`,
            {
              headers: authHeaders,
            },
          );
          if (distRes.ok) {
            const distData = await distRes.json();
            setDistricts(distData || []);

            if (parsed.district && distData?.length > 0) {
              const matchedDistrict = findGhnDistrictByName(
                distData,
                parsed.district,
              );
              if (matchedDistrict) {
                const distId = String(matchedDistrict.DistrictID);
                setSelectedDistrictId(distId);

                // Fetch wards for auto-fill
                try {
                  const wardRes = await fetch(
                    `${API_BASE}/Shipping/ghn/wards/${distId}`,
                    {
                      headers: authHeaders,
                    },
                  );
                  if (wardRes.ok) {
                    const wardData = await wardRes.json();
                    setWards(wardData || []);

                    if (parsed.ward && wardData?.length > 0) {
                      const matchedWard = findGhnWardByName(
                        wardData,
                        parsed.ward,
                      );
                      if (matchedWard) {
                        setSelectedWardCode(String(matchedWard.WardCode));
                      }
                    }
                  }
                } catch {
                  // Ward fetch failed, user can select manually
                }
              }
            }
          }
        } catch {
          // District fetch failed, user can select manually
        }

        // Set detail address after province/district/ward
        if (parsed.detail) {
          setDestAddress(parsed.detail);
        }
      }
    }
  };

  const handleGhnGetServices = async () => {
    if (!selectedDistrictId || !selectedWardCode) {
      setGhnError("Please select the full Province/City, District/County, and Ward/Commune.");
      return;
    }
    if (!recipientName.trim() || !recipientPhone.trim()) {
      setGhnError("Please enter the recipient's name and phone number.");
      return;
    }

    setGhnLoading(true);
    setGhnError("");
    try {
      const res = await fetch(`${API_BASE}/Shipping/ghn/services`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          toDistrictId: parseInt(selectedDistrictId),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (!data || data.length === 0) {
          setGhnError("No shipping services are available to this address.");
        } else {
          setGhnServices(data);
          setGhnStep(2);
        }
      } else {
        const err = await res.json().catch(() => ({}));
        setGhnError(err.message || "Unable to retrieve the list of services.");
      }
    } catch {
      setGhnError("Network error.");
    } finally {
      setGhnLoading(false);
    }
  };

  const handleGhnSelectService = async (service) => {
    setSelectedService(service);
    setGhnLoading(true);
    setGhnError("");

    // Calculate fee for selected service
    try {
      const res = await fetch(`${API_BASE}/Shipping/ghn/calculate`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          serviceId: service.serviceId,
          serviceTypeId: service.serviceTypeId,
          toDistrictId: parseInt(selectedDistrictId),
          toWardCode: selectedWardCode,
          insuranceValue: insuranceValue,
          weight: packageWeight,
          length: 15,
          width: 10,
          height: 10,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCalculatedFee(data);
      } else {
        setCalculatedFee(null);
      }
    } catch {
      setCalculatedFee(null);
    } finally {
      setGhnLoading(false);
    }
  };

  const handleGhnCreateOrder = async () => {
    if (!selectedService) return;
    setGhnLoading(true);
    setGhnError("");
    setGhnStep(3);

    // Build full address
    const ward = wards.find((w) => w.WardCode === selectedWardCode);
    const district = districts.find(
      (d) => d.DistrictID === parseInt(selectedDistrictId),
    );
    const province = provinces.find(
      (p) => p.ProvinceID === parseInt(selectedProvinceId),
    );
    const fullAddress = `${destAddress}, ${ward?.WardName || ""}, ${district?.DistrictName || ""}, ${province?.ProvinceName || ""}`;

    try {
      const orderId = ghnOrder.orderId || ghnOrder.id;
      const res = await fetch(`${API_BASE}/Shipping/ghn/orders`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          orderId: orderId,
          serviceId: selectedService.serviceId,
          serviceTypeId: selectedService.serviceTypeId,
          toName: recipientName,
          toPhone: recipientPhone,
          toAddress: fullAddress,
          toWardCode: selectedWardCode,
          toDistrictId: parseInt(selectedDistrictId),
          codAmount: codAmount || 0,
          insuranceValue: insuranceValue || 0,
          weight: packageWeight || 200,
          length: 15,
          width: 10,
          height: 10,
          content: "Spectra eyeglasses",
          requiredNote: "CHOTHUHANG",
        }),
      });

      if (res.ok) {
        alert("GHN shipping order created successfully! ✓");
        setShowGhnModal(false);
        fetchOrders();
      } else {
        const err = await res.json().catch(() => ({}));
        setGhnError(err.message || "Unable to generate bill of lading.");
        setGhnStep(2);
      }
    } catch {
      setGhnError("Connection error while creating bill of lading.");
      setGhnStep(2);
    } finally {
      setGhnLoading(false);
    }
  };

  // --- GHN TRACKING ---

  const openTrackingDetail = async (trackingNumber, carrier) => {
    if (!trackingNumber) return;
    setTrackingDetail(null);
    setTrackingLoading(true);
    setShowTrackingModal(true);

    // Check if it's a GHN order
    const isGhn = carrier?.toLowerCase()?.includes("ghn");

    try {
      const endpoint = isGhn
        ? `${API_BASE}/Shipping/ghn/orders/${encodeURIComponent(trackingNumber)}`
        : `${API_BASE}/Shipping/ahamove/orders/${encodeURIComponent(trackingNumber)}`;

      const res = await fetch(endpoint, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setTrackingDetail({ ...data, isGhn });
      } else {
        setTrackingDetail({ error: "No shipping information found." });
      }
    } catch {
      setTrackingDetail({ error: "Network error." });
    } finally {
      setTrackingLoading(false);
    }
  };

  // --- FILTER LOGIC ---

  const filteredOrders = orders.filter((o) => {
    const s = o.status?.toLowerCase();
    if (activeTab === "active") return s === "processing";
    if (activeTab === "shipped") return s === "shipped";
    if (activeTab === "delivered") return s === "delivered";
    return true;
  });

  // --- RENDER ---

  const tabStyle = (tab) => ({
    padding: "9px 20px",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "14px",
    borderBottom:
      activeTab === tab ? "3px solid #2563eb" : "3px solid transparent",
    backgroundColor: activeTab === tab ? "white" : "#f3f4f6",
    color: activeTab === tab ? "#1d4ed8" : "#6b7280",
    borderRadius: "6px 6px 0 0",
    transition: "all 0.15s",
  });

  const activeCount = orders.filter(
    (o) => o.status?.toLowerCase() === "processing",
  ).length;
  const shippedCount = orders.filter(
    (o) => o.status?.toLowerCase() === "shipped",
  ).length;
  const deliveredCount = orders.filter(
    (o) => o.status?.toLowerCase() === "delivered",
  ).length;

  return (
    <div className="shipping-page-container">
      <h2 className="shipping-header">
        Shipping & Delivery Management
        {ghnSandbox && (
          <span
            style={{
              fontSize: "12px",
              color: "#d97706",
              backgroundColor: "#fef3c7",
              padding: "2px 8px",
              borderRadius: "8px",
              marginLeft: "10px",
              fontWeight: 500,
            }}
          >
            GHN Sandbox
          </span>
        )}
      </h2>

      {/* Summary cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        {[
          {
            label: "Waiting for delivery",
            count: activeCount,
            color: "#7c3aed",
            bg: "#ede9fe",
          },
          {
            label: "Delivering",
            count: shippedCount,
            color: "#0891b2",
            bg: "#cffafe",
          },
          {
            label: "Delivered",
            count: deliveredCount,
            color: "#059669",
            bg: "#d1fae5",
          },
          {
            label: "Total order",
            count: orders.length,
            color: "#6b7280",
            bg: "#f3f4f6",
          },
        ].map((card) => (
          <div
            key={card.label}
            style={{
              backgroundColor: "white",
              borderRadius: "10px",
              padding: "16px",
              border: `2px solid ${card.bg}`,
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: card.color,
              }}
            >
              {card.count}
            </div>
            <div style={{ fontSize: "13px", color: "#6b7280" }}>
              {card.label}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: "4px",
          borderBottom: "1px solid #e5e7eb",
          marginBottom: 0,
        }}
      >
        <button
          style={tabStyle("active")}
          onClick={() => {
            setActiveTab("active");
            setCurrentPage(1);
          }}
        >
          Waiting for delivery ({activeCount})
        </button>
        <button
          style={tabStyle("shipped")}
          onClick={() => {
            setActiveTab("shipped");
            setCurrentPage(1);
          }}
        >
          Shipping ({shippedCount})
        </button>
        <button
          style={tabStyle("delivered")}
          onClick={() => {
            setActiveTab("delivered");
            setCurrentPage(1);
          }}
        >
          Delivered ({deliveredCount})
        </button>
        <button
          style={tabStyle("all")}
          onClick={() => {
            setActiveTab("all");
            setCurrentPage(1);
          }}
        >
          All ({orders.length})
        </button>
      </div>

      {/* Table */}
      <div
        style={{
          backgroundColor: "white",
          border: "1px solid #e5e7eb",
          borderTop: "none",
          borderRadius: "0 0 8px 8px",
          overflow: "hidden",
        }}
      >
        {errorMsg ? (
          <div style={{ color: "#dc2626", padding: "24px" }}>{errorMsg}</div>
        ) : isLoading ? (
          <p style={{ padding: "24px", color: "#6b7280" }}>⏳ Loading...</p>
        ) : (
          <>
            <table className="shipping-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Delivery Address</th>
                  <th>Shipping</th>
                  <th>Status</th>
                  <th>Tracking Number</th>
                  <th>Expected Delivery</th>
                  <th>Operation</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan="8"
                      style={{
                        textAlign: "center",
                        padding: "32px",
                        color: "#9ca3af",
                      }}
                    >
                      There are no applications in this section.
                    </td>
                  </tr>
                ) : (
                  filteredOrders
                    .slice(
                      (currentPage - 1) * PAGE_SIZE,
                      currentPage * PAGE_SIZE,
                    )
                    .map((order) => {
                      const rawId = order.orderId || order.id;
                      const status = order.status?.toLowerCase();
                      const canManual = status === "processing";
                      const canDeliver = status === "shipped";
                      const hasTracking = !!order.trackingNumber;
                      const addr = parseAddress(order.shippingAddress);
                      const carrier =
                        order.shippingCarrier?.toLowerCase() || "";
                      const isGhn = carrier.includes("ghn");
                      const hasTrackingSupport = isGhn; // Add more carriers here as needed

                      return (
                        <tr key={rawId}>
                          <td>
                            {order.convertedFromPreorderId ? (
                              <div>
                                <strong
                                  style={{
                                    fontFamily: "monospace",
                                    fontSize: "13px",
                                  }}
                                >
                                  #
                                  {String(
                                    order.convertedFromPreorderId,
                                  ).substring(0, 8)}
                                </strong>
                                <div
                                  style={{
                                    fontSize: "11px",
                                    color: "#9ca3af",
                                    marginTop: "2px",
                                  }}
                                >
                                  Pre-order
                                </div>
                              </div>
                            ) : (
                              <strong
                                style={{
                                  fontFamily: "monospace",
                                  fontSize: "13px",
                                }}
                              >
                                #{String(rawId).substring(0, 8)}
                              </strong>
                            )}
                          </td>

                          <td>
                            <div style={{ fontWeight: "bold" }}>
                              {addr.name ||
                                order.user?.fullName ||
                                "Customer"}
                            </div>
                            <div style={{ fontSize: "12px", color: "#6b7280" }}>
                              {addr.phone || order.user?.phone || "—"}
                            </div>
                          </td>

                          <td>
                            <div
                              style={{
                                fontSize: "13px",
                                maxWidth: "200px",
                                lineHeight: "1.4",
                              }}
                            >
                              {getAddressDisplayString(
                                addr.street || order.shippingAddress || "—",
                              )}
                            </div>
                          </td>

                          <td>
                            <ShippingMethodBadge
                              method={order.shippingMethod}
                            />
                          </td>

                          <td>
                            <StatusBadge status={order.status} />
                          </td>

                          <td>
                            {hasTracking ? (
                              <div>
                                {order.shippingCarrier && (
                                  <div
                                    style={{
                                      fontSize: "12px",
                                      color: "#6b7280",
                                      marginBottom: "2px",
                                    }}
                                  >
                                    {order.shippingCarrier}
                                  </div>
                                )}
                                <span className="badge-tracking">
                                  {order.trackingNumber}
                                </span>
                                {hasTrackingSupport && (
                                  <div style={{ marginTop: "4px" }}>
                                    <button
                                      onClick={() =>
                                        openTrackingDetail(
                                          order.trackingNumber,
                                          order.shippingCarrier,
                                        )
                                      }
                                      style={{
                                        fontSize: "11px",
                                        color: "#059669",
                                        background: "none",
                                        border: "none",
                                        cursor: "pointer",
                                        fontWeight: 600,
                                        padding: 0,
                                        textDecoration: "underline",
                                      }}
                                    >
                                      Tracking {isGhn ? "GHN" : "Bill of Lading"}
                                    </button>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span
                                style={{ color: "#9ca3af", fontSize: "13px" }}
                              >
                                Not yet
                              </span>
                            )}
                          </td>

                          <td>
                            {order.estimatedDeliveryDate ? (
                              <span
                                style={{
                                  fontSize: "13px",
                                  color: "#1e40af",
                                  fontWeight: 600,
                                }}
                              >
                                {new Date(
                                  order.estimatedDeliveryDate,
                                ).toLocaleDateString("vi-VN", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                })}
                              </span>
                            ) : order.shippedAt ? (
                              <span
                                style={{ fontSize: "12px", color: "#6b7280" }}
                              >
                                ~
                                {new Date(
                                  new Date(order.shippedAt).getTime() +
                                    (order.shippingMethod === "express"
                                      ? 3
                                      : 7) *
                                      86400000,
                                ).toLocaleDateString("vi-VN", {
                                  day: "2-digit",
                                  month: "2-digit",
                                })}
                              </span>
                            ) : (
                              <span
                                style={{ color: "#d1d5db", fontSize: "13px" }}
                              >
                                —
                              </span>
                            )}
                          </td>

                          <td>
                            <div className="actions-group">
                              {canManual && (
                                <button
                                  className="btn-confirm"
                                  onClick={() => openGhnModal(order)}
                                  title="Create an order via GHN."
                                  style={{
                                    padding: "8px 14px",
                                    fontSize: "13px",
                                  }}
                                >
                                  Send GHN
                                </button>
                              )}
                              {canManual && (
                                <button
                                  className="btn-manual"
                                  onClick={() => openManualModal(order)}
                                  title="Assign tracking numbers manually. → Shipped"
                                >
                                  Enter a code
                                </button>
                              )}
                              {canDeliver && (
                                <button
                                  className="btn-confirm"
                                  onClick={() => handleMarkDelivered(order)}
                                  style={{
                                    padding: "8px 14px",
                                    fontSize: "13px",
                                  }}
                                  title="Confirm that the customer has received the order. → Delivered"
                                >
                                  Delivered
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
            {/* Pagination */}
            {(() => {
              const totalPages = Math.ceil(filteredOrders.length / PAGE_SIZE);
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
                      background:
                        currentPage >= totalPages ? "#f3f4f6" : "#fff",
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
          </>
        )}
      </div>

      {/* == MODAL: MANUAL TRACKING == */}
      {showManualModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "440px" }}>
            <h3 className="modal-title">Manual Tracking Number Entry</h3>
            <p
              style={{
                fontSize: "13px",
                color: "#6b7280",
                marginTop: "-10px",
                marginBottom: "16px",
              }}
            >
              Order:{" "}
              <b>
                #
                {String(
                  selectedForManual?.orderId || selectedForManual?.id,
                ).substring(0, 8)}
              </b>
              &nbsp;·&nbsp; The state will change to <b>Shipped</b>
            </p>
            <form onSubmit={handleManualSubmit}>
              <div className="form-group">
                <label>Shipping company:</label>
                <select
                  value={manualForm.carrier}
                  onChange={(e) =>
                    setManualForm({ ...manualForm, carrier: e.target.value })
                  }
                  required
                >
                  <option value="">-- Choose a ship company --</option>
                  {CARRIERS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Tracking Number (Tracking Number):</label>
                <input
                  type="text"
                  value={manualForm.trackingNumber}
                  onChange={(e) =>
                    setManualForm({
                      ...manualForm,
                      trackingNumber: e.target.value,
                    })
                  }
                  required
                  placeholder="VD: AH123456789"
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowManualModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-confirm"
                  disabled={isSubmittingManual}
                >
                  {isSubmittingManual ? "Đang lưu..." : "Xác Nhận"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* == MODAL: GHN DELIVERY CREATION == */}
      {showGhnModal && ghnOrder && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "560px" }}>
            <h3 className="modal-title">Create Bill of Lading GHN</h3>

            <p
              style={{
                fontSize: "13px",
                color: "#6b7280",
                marginTop: "-10px",
                marginBottom: "16px",
              }}
            >
              Order:{" "}
              <b>#{String(ghnOrder.orderId || ghnOrder.id).substring(0, 8)}</b>
              &nbsp;·&nbsp;Deliver to:{" "}
              <b>{parseAddress(ghnOrder.shippingAddress).street || "N/A"}</b>
            </p>

            {ghnError && (
              <div
                style={{
                  backgroundColor: "#fee2e2",
                  color: "#dc2626",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  marginBottom: "12px",
                }}
              >
                {ghnError}
              </div>
            )}

            {/* Step 1: Address selection */}
            {ghnStep === 1 && (
              <div>
                <p
                  style={{
                    fontWeight: 600,
                    marginBottom: "10px",
                    fontSize: "14px",
                  }}
                >
                  Recipient information
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px",
                    marginBottom: "14px",
                  }}
                >
                  <div className="form-group">
                    <label>Recipient name:</label>
                    <input
                      type="text"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone number:</label>
                    <input
                      type="text"
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                    />
                  </div>
                </div>

                <p
                  style={{
                    fontWeight: 600,
                    marginBottom: "10px",
                    fontSize: "14px",
                  }}
                >
                  Delivery address <span style={{ color: "red" }}>*</span>
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: "10px",
                    marginBottom: "10px",
                  }}
                >
                  <div className="form-group">
                    <label>Province/City:</label>
                    <select
                      value={selectedProvinceId}
                      onChange={(e) => {
                        setSelectedProvinceId(e.target.value);
                        setSelectedDistrictId("");
                        setSelectedWardCode("");
                        setDistricts([]);
                        setWards([]);
                      }}
                      style={{ width: "100%", padding: "8px" }}
                    >
                      <option value="">-- Choose --</option>
                      {provinces.map((p) => (
                        <option key={p.ProvinceID} value={p.ProvinceID}>
                          {p.ProvinceName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>District/County:</label>
                    <select
                      value={selectedDistrictId}
                      onChange={(e) => {
                        setSelectedDistrictId(e.target.value);
                        setSelectedWardCode("");
                        setWards([]);
                      }}
                      disabled={!selectedProvinceId}
                      style={{ width: "100%", padding: "8px" }}
                    >
                      <option value="">-- Choose --</option>
                      {districts.map((d) => (
                        <option key={d.DistrictID} value={d.DistrictID}>
                          {d.DistrictName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Ward/Commune:</label>
                    <select
                      value={selectedWardCode}
                      onChange={(e) => setSelectedWardCode(e.target.value)}
                      disabled={!selectedDistrictId}
                      style={{ width: "100%", padding: "8px" }}
                    >
                      <option value="">-- Choose --</option>
                      {wards.map((w) => (
                        <option key={w.WardCode} value={w.WardCode}>
                          {w.WardName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: "14px" }}>
                  <label>Detailed address (number, street...):</label>
                  <input
                    type="text"
                    value={destAddress}
                    onChange={(e) => setDestAddress(e.target.value)}
                    placeholder="VD: 123 Nguyễn Văn Linh"
                  />
                </div>

                <p
                  style={{
                    fontWeight: 600,
                    marginBottom: "10px",
                    fontSize: "14px",
                  }}
                >
                  Package information
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: "10px",
                  }}
                >
                  <div className="form-group">
                    <label>Weight (gram):</label>
                    <input
                      type="number"
                      value={packageWeight}
                      min={1}
                      step={1}
                      onChange={(e) => setPackageWeight(Number(e.target.value))}
                    />
                  </div>
                  <div className="form-group">
                    <label>COD (VND):</label>
                    <input
                      type="number"
                      value={codAmount}
                      min={0}
                      onChange={(e) => setCodAmount(Number(e.target.value))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Insurance value:</label>
                    <input
                      type="number"
                      value={insuranceValue}
                      min={0}
                      onChange={(e) =>
                        setInsuranceValue(Number(e.target.value))
                      }
                    />
                  </div>
                </div>

                <div className="modal-actions" style={{ marginTop: "16px" }}>
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => setShowGhnModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn-confirm"
                    onClick={handleGhnGetServices}
                    disabled={ghnLoading}
                  >
                    {ghnLoading ? "Đang tải..." : "Chọn dịch vụ →"}
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Select service */}
            {ghnStep === 2 && (
              <div>
                <p
                  style={{
                    fontWeight: 600,
                    marginBottom: "10px",
                    fontSize: "14px",
                  }}
                >
                  Choose GHN shipping service.
                </p>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    maxHeight: "300px",
                    overflowY: "auto",
                  }}
                >
                  {ghnServices.map((svc) => {
                    const isSelected =
                      selectedService?.serviceId === svc.serviceId;
                    return (
                      <label
                        key={svc.serviceId}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: "12px 14px",
                          borderRadius: "10px",
                          cursor: "pointer",
                          border: isSelected
                            ? "2px solid #059669"
                            : "2px solid #e5e7eb",
                          backgroundColor: isSelected ? "#d1fae5" : "#f9fafb",
                          transition: "all 0.15s",
                        }}
                        onClick={() => handleGhnSelectService(svc)}
                      >
                        <input
                          type="radio"
                          name="ghnService"
                          checked={isSelected}
                          readOnly
                          style={{
                            width: "16px",
                            height: "16px",
                            accentColor: "#059669",
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: "bold", fontSize: "14px" }}>
                            {svc.shortName || svc.serviceId}
                          </div>
                          <div style={{ fontSize: "12px", color: "#6b7280" }}>
                            ID: {svc.serviceTypeId}
                          </div>
                        </div>
                        {isSelected && calculatedFee && (
                          <div
                            style={{
                              fontWeight: "bold",
                              fontSize: "15px",
                              color: "#059669",
                            }}
                          >
                            {new Intl.NumberFormat("vi-VN").format(
                              calculatedFee.total || 0,
                            )}
                            đ
                          </div>
                        )}
                      </label>
                    );
                  })}
                </div>
                {selectedService && calculatedFee && (
                  <div
                    style={{
                      backgroundColor: "#f0fdf4",
                      padding: "12px 14px",
                      borderRadius: "8px",
                      marginTop: "12px",
                      fontSize: "13px",
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: "6px" }}>
                      Fee details:
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "4px",
                      }}
                    >
                      <span>Shipping fee:</span>
                      <span style={{ textAlign: "right" }}>
                        {formatVNDNumber(calculatedFee.mainService || 0)} đ
                      </span>
                      <span>Insurance fee:</span>
                      <span style={{ textAlign: "right" }}>
                        {formatVNDNumber(calculatedFee.insurance || 0)} đ
                      </span>
                      <span style={{ fontWeight: 600 }}>Total:</span>
                      <span style={{ textAlign: "right", fontWeight: 600 }}>
                        {formatVNDNumber(calculatedFee.total || 0)} đ
                      </span>
                    </div>
                  </div>
                )}
                <div className="modal-actions" style={{ marginTop: "16px" }}>
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => setGhnStep(1)}
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    className="btn-confirm"
                    onClick={handleGhnCreateOrder}
                    disabled={!selectedService || ghnLoading}
                  >
                    {ghnLoading ? "Creating..." : "Create bill of lading →"}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Creating... */}
            {ghnStep === 3 && (
              <div style={{ textAlign: "center", padding: "30px 0" }}>
                <div style={{ fontSize: "32px", marginBottom: "12px" }}>⏳</div>
                <p style={{ fontWeight: 600, color: "#6b7280" }}>
                  Creating a GHN shipping label...
                </p>
                <p style={{ fontSize: "13px", color: "#9ca3af" }}>
                  Please wait, the system is contacting you. GHN.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* == MODAL: TRACKING DETAIL == */}
      {showTrackingModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "480px" }}>
            <h3 className="modal-title">
              Tracking Detail {trackingDetail?.isGhn ? "GHN" : ""}
            </h3>
            {trackingLoading ? (
              <div style={{ textAlign: "center", padding: "30px 0" }}>
                <p style={{ color: "#6b7280" }}>Loading information...</p>
              </div>
            ) : trackingDetail?.error ? (
              <div style={{ color: "#dc2626", padding: "16px 0" }}>
                {trackingDetail.error}
              </div>
            ) : trackingDetail ? (
              <div style={{ fontSize: "14px" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "8px",
                    marginBottom: "12px",
                  }}
                >
                  <div>
                    <strong>Tracking ID:</strong>{" "}
                    <span style={{ fontFamily: "monospace" }}>
                      {trackingDetail.orderCode ||
                        trackingDetail._id ||
                        trackingDetail.id}
                    </span>
                  </div>
                  <div>
                    <strong>Status:</strong>{" "}
                    <span
                      style={{
                        color:
                          GHN_STATUS_MAP[trackingDetail.status]?.color ||
                          "#6b7280",
                        fontWeight: 600,
                      }}
                    >
                      {GHN_STATUS_MAP[trackingDetail.status]?.label ||
                        trackingDetail.status}
                    </span>
                  </div>
                  {trackingDetail.toName && (
                    <div>
                      <strong>Recipient:</strong> {trackingDetail.toName}
                    </div>
                  )}
                  {trackingDetail.toPhone && (
                    <div>
                      <strong>Phone number:</strong> {trackingDetail.toPhone}
                    </div>
                  )}
                  {trackingDetail.toAddress && (
                    <div style={{ gridColumn: "1 / -1" }}>
                      <strong>Address:</strong> {trackingDetail.toAddress}
                    </div>
                  )}
                  {trackingDetail.codAmount !== undefined && (
                    <div>
                      <strong>COD:</strong>{" "}
                      {formatVNDNumber(trackingDetail.codAmount || 0)} đ
                    </div>
                  )}
                  {trackingDetail.totalFee !== undefined && (
                    <div>
                      <strong>Shipping fee:</strong>{" "}
                      {formatVNDNumber(trackingDetail.totalFee || 0)} đ
                    </div>
                  )}
                  {trackingDetail.leadtime && (
                    <div style={{ gridColumn: "1 / -1" }}>
                      <strong>Expected delivery:</strong>{" "}
                      {new Date(
                        trackingDetail.leadtime * 1000,
                      ).toLocaleDateString("vi-VN")}
                    </div>
                  )}
                </div>

                {/* GHN Demo Info */}
                {trackingDetail.isGhn && ghnSandbox && (
                  <div
                    style={{
                      backgroundColor: "#f0fdf4",
                      border: "1px solid #86efac",
                      padding: "12px 14px",
                      borderRadius: "8px",
                      marginTop: "12px",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: "13px",
                        color: "#166534",
                        marginBottom: "6px",
                      }}
                    >
                      ✅ The order has been successfully created on GHN
                    </div>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#15803d",
                        margin: 0,
                        lineHeight: 1.5,
                      }}
                    >
                      Tracking ID <b>{trackingDetail.orderCode}</b> has appeared
                      on{" "}
                      <a
                        href="https://5sao.ghn.dev"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#059669", fontWeight: 600 }}
                      >
                        GHN Dashboard
                      </a>
                    </p>
                  </div>
                )}
              </div>
            ) : null}
            <div className="modal-actions" style={{ marginTop: "16px" }}>
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setShowTrackingModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
