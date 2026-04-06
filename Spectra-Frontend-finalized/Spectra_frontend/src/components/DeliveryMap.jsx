import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ── Shop location (Spectra HQ — Ho Chi Minh City, District 1) ──
const SHOP_COORDS = [10.7769, 106.7009];

// ── Vietnamese city/district coordinate lookup ──
const CITY_COORDS = {
  // Major cities
  "hà nội": [21.0285, 105.8542],
  "hồ chí minh": [10.8231, 106.6297],
  "đà nẵng": [16.0544, 108.2022],
  "hải phòng": [20.8449, 106.6881],
  "cần thơ": [10.0452, 105.7469],
  "nha trang": [12.2388, 109.1967],
  huế: [16.4637, 107.5909],
  "đà lạt": [11.9404, 108.4583],
  "vũng tàu": [10.346, 107.0843],
  "biên hòa": [10.9574, 106.8426],
  "thủ đức": [10.8554, 106.7539],
  "bình dương": [11.0252, 106.6529],
  "long an": [10.5364, 106.4133],
  "đồng nai": [10.9574, 106.8426],
  "bình tân": [10.7652, 106.6032],
  "tân phú": [10.7918, 106.6285],
  "gò vấp": [10.8384, 106.6651],
  "bình thạnh": [10.8105, 106.7091],
  "phú nhuận": [10.7998, 106.6807],
  "tân bình": [10.8017, 106.6527],
  // HCM districts
  "quận 1": [10.7769, 106.7009],
  "quận 2": [10.7876, 106.7476],
  "quận 3": [10.7834, 106.6869],
  "quận 4": [10.7578, 106.7013],
  "quận 5": [10.754, 106.6633],
  "quận 6": [10.7479, 106.6352],
  "quận 7": [10.734, 106.7218],
  "quận 8": [10.724, 106.6282],
  "quận 9": [10.8413, 106.7822],
  "quận 10": [10.7721, 106.6688],
  "quận 11": [10.7627, 106.6504],
  "quận 12": [10.8645, 106.6547],
  "nhà bè": [10.6894, 106.7042],
  "củ chi": [11.0072, 106.5126],
  "hóc môn": [10.888, 106.5945],
  "bình chánh": [10.6836, 106.5942],
  // Northern cities
  "bắc ninh": [21.1861, 106.0763],
  "hải dương": [20.9373, 106.3146],
  "nam định": [20.4389, 106.1621],
  "thái nguyên": [21.5928, 105.8441],
  "quảng ninh": [21.0064, 107.2925],
  "lạng sơn": [21.853, 106.7614],
  // Central
  "quảng nam": [15.5394, 108.0191],
  "bình định": [13.7765, 109.2237],
  "phú yên": [13.0882, 109.0929],
  "khánh hòa": [12.2585, 109.0526],
  // Southern
  "tây ninh": [11.3352, 106.0989],
  "bà rịa": [10.496, 107.169],
  "tiền giang": [10.3601, 106.3634],
  "bến tre": [10.2434, 106.3755],
  "vĩnh long": [10.2539, 105.9722],
  "an giang": [10.3899, 105.4351],
  "kiên giang": [10.0125, 105.0809],
  "cà mau": [9.1527, 105.1961],
  "sóc trăng": [9.6037, 105.9804],
  "bạc liêu": [9.2941, 105.7216],
  "trà vinh": [9.9351, 106.3455],
  "đồng tháp": [10.4933, 105.6882],
  "hậu giang": [9.7579, 105.6413],
};

/**
 * Parse a Vietnamese address string and return approximate coordinates.
 * Uses Nominatim (OpenStreetMap) for real geocoding, falls back to dictionary.
 */
async function geocodeAddressAsync(address) {
  if (!address) return null;

  // Build progressively simpler queries from the address.
  // Vietnamese addresses: "detail, Phường X, Quận/TP Y, Tỉnh/TP Z"
  // Nominatim often fails on very specific local details but works at ward/district level.
  const parts = address
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const queries = [];
  for (let i = 0; i < parts.length; i++) {
    queries.push(parts.slice(i).join(", "));
  }

  for (const q of queries) {
    try {
      const encoded = encodeURIComponent(q);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1&countrycodes=vn`,
        { headers: { "Accept-Language": "vi" } },
      );
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        }
      }
    } catch {
      // Try next query
    }
  }

  // Last resort: dictionary lookup
  return geocodeAddressFallback(address);
}

function geocodeAddressFallback(address) {
  if (!address) return null;
  const lower = address.toLowerCase();

  // Try matching known location names (longest first for better specificity)
  const entries = Object.entries(CITY_COORDS).sort(
    (a, b) => b[0].length - a[0].length,
  );
  for (const [name, coords] of entries) {
    if (lower.includes(name)) return coords;
  }

  // Common abbreviated / non-diacritical patterns
  if (/tp\.?\s*hcm|hcm|ho chi minh|sài gòn|saigon|sai gon|sgn/.test(lower))
    return CITY_COORDS["hồ chí minh"];
  if (/ha noi|hà nội|hn\b/.test(lower)) return CITY_COORDS["hà nội"];
  if (/da nang|đà nẵng|dn\b/.test(lower)) return CITY_COORDS["đà nẵng"];
  if (/hai phong|hải phòng|hp\b/.test(lower)) return CITY_COORDS["hải phòng"];
  if (/can tho|cần thơ|ct\b/.test(lower)) return CITY_COORDS["cần thơ"];
  if (/nha trang/.test(lower)) return CITY_COORDS["nha trang"];
  if (/da lat|đà lạt/.test(lower)) return CITY_COORDS["đà lạt"];
  if (/vung tau|vũng tàu/.test(lower)) return CITY_COORDS["vũng tàu"];
  if (/bien hoa|biên hòa/.test(lower)) return CITY_COORDS["biên hòa"];
  if (/binh duong|bình dương|bd\b/.test(lower))
    return CITY_COORDS["bình dương"];
  if (/dong nai|đồng nai/.test(lower)) return CITY_COORDS["đồng nai"];
  if (/long an/.test(lower)) return CITY_COORDS["long an"];
  if (/thu duc|thủ đức/.test(lower)) return CITY_COORDS["thủ đức"];

  // HCM district patterns like "Q.7", "Q7", "Quận 7", "quan 7"
  const districtMatch = lower.match(/(?:qu[aậ]n|q\.?\s*)(\d{1,2})/);
  if (districtMatch) {
    const key = `quận ${districtMatch[1]}`;
    if (CITY_COORDS[key]) return CITY_COORDS[key];
  }

  // Last resort: if address mentions "city" with no other match, assume HCM
  if (lower.includes("city")) return CITY_COORDS["hồ chí minh"];

  return null;
}

// ── Custom marker icons using emoji/div icons (no external images needed) ──
function createDivIcon(emoji, size = 28, className = "") {
  return L.divIcon({
    html: `<div style="font-size:${size}px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3))">${emoji}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    className: `delivery-marker ${className}`,
  });
}

/**
 * DeliveryMap — Animated delivery tracking map using Leaflet + OpenStreetMap.
 *
 * Props:
 *   customerAddress - raw address string from order
 *   shippedAt       - Date when order was shipped
 *   estimatedDate   - Date of estimated delivery
 *   deliveredAt     - Date when delivered (null if still shipping)
 *   carrier         - shipping carrier name
 *   status          - order status string
 */
export default function DeliveryMap({
  customerAddress,
  shippedAt,
  estimatedDate,
  deliveredAt,
  carrier,
  status,
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const truckMarkerRef = useRef(null);
  const animFrameRef = useRef(null);
  const [routeCoords, setRouteCoords] = useState(null);
  const [error, setError] = useState(null);
  const [customerCoords, setCustomerCoords] = useState(null);

  const isDelivered = status?.toLowerCase() === "delivered";

  // ── Geocode customer address (async with Nominatim, fallback to dictionary) ──
  useEffect(() => {
    let cancelled = false;
    setCustomerCoords(null);
    setError(null);

    geocodeAddressAsync(customerAddress).then((coords) => {
      if (cancelled) return;
      if (coords) {
        setCustomerCoords(coords);
      } else {
        setError("no-coords");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [customerAddress]);

  // ── Calculate delivery progress (0..1) ──
  const getProgress = () => {
    if (isDelivered) return 1;
    if (!shippedAt) return 0;

    const start = new Date(shippedAt).getTime();
    const end = estimatedDate
      ? new Date(estimatedDate).getTime()
      : start + 7 * 86400000;
    const now = Date.now();

    const progress = (now - start) / (end - start);
    return Math.max(0, Math.min(progress, 0.95)); // Cap at 95% until delivered
  };

  // ── Fetch road route from OSRM (free, no API key) ──
  useEffect(() => {
    if (!customerCoords) {
      return;
    }

    // Reset map when coords change so it re-initializes
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
    setRouteCoords(null);

    const fetchRoute = async () => {
      try {
        const [sLat, sLng] = SHOP_COORDS;
        const [eLat, eLng] = customerCoords;

        const url = `https://router.project-osrm.org/route/v1/driving/${sLng},${sLat};${eLng},${eLat}?overview=full&geometries=geojson`;
        const res = await fetch(url);

        if (res.ok) {
          const data = await res.json();
          if (data.routes?.[0]?.geometry?.coordinates) {
            // OSRM returns [lng, lat], Leaflet needs [lat, lng]
            const coords = data.routes[0].geometry.coordinates.map(
              ([lng, lat]) => [lat, lng],
            );
            setRouteCoords(coords);
            return;
          }
        }
      } catch {
        // Silently fall back
      }

      // Fallback: create a curved line between the two points
      const [sLat, sLng] = SHOP_COORDS;
      const [eLat, eLng] = customerCoords;
      const midLat = (sLat + eLat) / 2 + (eLng - sLng) * 0.1;
      const midLng = (sLng + eLng) / 2;
      const points = [];
      for (let t = 0; t <= 1; t += 0.02) {
        const lat =
          (1 - t) * (1 - t) * sLat + 2 * (1 - t) * t * midLat + t * t * eLat;
        const lng =
          (1 - t) * (1 - t) * sLng + 2 * (1 - t) * t * midLng + t * t * eLng;
        points.push([lat, lng]);
      }
      setRouteCoords(points);
    };

    fetchRoute();
  }, [customerCoords]);

  // ── Initialize map ──
  useEffect(() => {
    if (!mapRef.current || !routeCoords || routeCoords.length < 2) return;
    if (mapInstanceRef.current) return; // Already initialized

    const map = L.map(mapRef.current, {
      zoomControl: true,
      scrollWheelZoom: false,
      attributionControl: true,
    });

    // OpenStreetMap tiles (free!)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/">OSM</a>',
      maxZoom: 18,
    }).addTo(map);

    // Draw route
    const routeLine = L.polyline(routeCoords, {
      color: "#2563eb",
      weight: 4,
      opacity: 0.7,
      dashArray: "10 6",
    }).addTo(map);

    // Completed portion of route (solid green)
    const progress = getProgress();
    const progressIdx = Math.floor(progress * (routeCoords.length - 1));
    const completedCoords = routeCoords.slice(0, progressIdx + 1);

    if (completedCoords.length > 1) {
      L.polyline(completedCoords, {
        color: "#059669",
        weight: 5,
        opacity: 0.9,
      }).addTo(map);
    }

    // Shop marker
    L.marker(SHOP_COORDS, { icon: createDivIcon("S", 32) })
      .addTo(map)
      .bindPopup("<b>Spectra Glasses</b><br/>Kho hàng HCM");

    // Customer marker
    L.marker(routeCoords[routeCoords.length - 1], {
      icon: createDivIcon("D", 32),
    })
      .addTo(map)
      .bindPopup(
        `<b>Địa chỉ giao hàng</b><br/>${customerAddress?.substring(0, 60) || ""}...`,
      );

    // Truck marker
    const truckPos = routeCoords[progressIdx] || routeCoords[0];
    const truck = L.marker(truckPos, {
      icon: createDivIcon(isDelivered ? "V" : "T", 34, "truck-marker"),
      zIndexOffset: 1000,
    }).addTo(map);

    const progressPct = Math.round(progress * 100);
    truck.bindPopup(
      `<b>${carrier || "Đơn vị vận chuyển"}</b><br/>` +
        (isDelivered
          ? "Đã giao hàng thành công"
          : `Đang giao... (${progressPct}%)`) +
        (estimatedDate
          ? `<br/>⏰ Dự kiến: ${new Date(estimatedDate).toLocaleDateString("vi-VN")}`
          : ""),
    );

    // Fit bounds
    map.fitBounds(routeLine.getBounds(), { padding: [40, 40] });

    mapInstanceRef.current = map;
    truckMarkerRef.current = truck;

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [routeCoords]);

  // ── Animate truck smoothly ──
  useEffect(() => {
    if (
      !mapInstanceRef.current ||
      !truckMarkerRef.current ||
      !routeCoords ||
      isDelivered
    )
      return;

    let lastTime = 0;
    const animate = (timestamp) => {
      if (timestamp - lastTime < 2000) {
        animFrameRef.current = requestAnimationFrame(animate);
        return;
      }
      lastTime = timestamp;

      const progress = getProgress();
      const idx = Math.floor(progress * (routeCoords.length - 1));
      const pos = routeCoords[idx];
      if (pos) {
        truckMarkerRef.current.setLatLng(pos);
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [routeCoords, isDelivered]);

  if (error === "no-coords" || !customerCoords) {
    return null; // Can't geocode — don't show map
  }

  return (
    <div
      style={{
        backgroundColor: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: "12px",
        overflow: "hidden",
        marginBottom: "20px",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "14px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #e2e8f0",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <h4 style={{ margin: 0, fontSize: "16px", color: "#1e293b" }}>
          Theo dõi vận chuyển trực tiếp
        </h4>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {!isDelivered && (
            <span
              style={{
                fontSize: "13px",
                color: "#1e40af",
                fontWeight: 600,
                backgroundColor: "#eff6ff",
                padding: "4px 12px",
                borderRadius: "20px",
              }}
            >
              {Math.round(getProgress() * 100)}% lộ trình
            </span>
          )}
          {isDelivered && (
            <span
              style={{
                fontSize: "13px",
                color: "#059669",
                fontWeight: 600,
                backgroundColor: "#d1fae5",
                padding: "4px 12px",
                borderRadius: "20px",
              }}
            >
              Đã giao thành công
            </span>
          )}
        </div>
      </div>

      {/* Map container */}
      <div
        ref={mapRef}
        style={{ width: "100%", height: "340px", backgroundColor: "#e2e8f0" }}
      />

      {/* Legend */}
      <div
        style={{
          padding: "10px 20px",
          display: "flex",
          gap: "20px",
          fontSize: "12px",
          color: "#64748b",
          flexWrap: "wrap",
          borderTop: "1px solid #e2e8f0",
        }}
      >
        <span>Kho Spectra</span>
        <span>Đơn hàng của bạn</span>
        <span>Địa chỉ nhận</span>
        <span style={{ color: "#059669" }}>━━ Đã đi qua</span>
        <span style={{ color: "#2563eb" }}>╌╌╌ Còn lại</span>
      </div>
    </div>
  );
}
