import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import "./MainPage.css";
import ProductCard from "../components/product/ProductCard";
import bannerImg from "../assets/bn.jpg";

export default function MainPage() {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || "";

  const [products, setProducts]     = useState([]);
  const [shapes, setShapes]         = useState([]); // fetch từ API
  const [materials, setMaterials]   = useState([]); // fetch từ API
  const [isLoading, setIsLoading]   = useState(true);
  const [error, setError]           = useState("");

  const [selectedShapes, setSelectedShapes]     = useState([]);
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [selectedPrice, setSelectedPrice]         = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 12;

  // Fetch products + shapes + materials song song
  useEffect(() => {
    const fetchAll = async () => {
      setIsLoading(true);
      setError("");
      try {
        const [framesRes, shapesRes, materialsRes] = await Promise.all([
          fetch("https://myspectra.runasp.net/api/Frames?page=1&pageSize=100"),
          fetch("https://myspectra.runasp.net/api/Shapes"),
          fetch("https://myspectra.runasp.net/api/Materials"),
        ]);

        if (framesRes.ok) {
          const data = await framesRes.json();
          const allFrames = data.items || data || [];
          // Lọc trùng tên
          const uniqueFrames = [];
          const seenNames = new Set();
          allFrames.forEach(frame => {
            if (!seenNames.has(frame.frameName)) {
              seenNames.add(frame.frameName);
              uniqueFrames.push(frame);
            }
          });
          setProducts(uniqueFrames);
        } else {
          setError("Không thể tải danh sách sản phẩm.");
        }

        if (shapesRes.ok) {
          const data = await shapesRes.json();
          setShapes(data || []);
        }

        if (materialsRes.ok) {
          const data = await materialsRes.json();
          setMaterials(data || []);
        }
      } catch {
        setError("Lỗi kết nối đến máy chủ Backend.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchAll();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Tìm kiếm theo tên
      const productName = product.frameName || product.name || "";
      const searchMatch = productName.toLowerCase().includes(searchQuery.toLowerCase());

      // FIX: dùng shapeName/materialName từ object thay vì so sánh object trực tiếp
      const productShapeName    = product.shape?.shapeName    || "";
      const productMaterialName = product.material?.materialName || "";

      const shapeMatch    = selectedShapes.length === 0    || selectedShapes.includes(productShapeName);
      const materialMatch = selectedMaterials.length === 0 || selectedMaterials.includes(productMaterialName);

      const price = product.basePrice || product.price || 0;
      let priceMatch = true;
      if (selectedPrice === "under15")  priceMatch = price < 15;
      else if (selectedPrice === "15to20") priceMatch = price >= 15 && price <= 20;
      else if (selectedPrice === "over20") priceMatch = price > 20;

      return searchMatch && shapeMatch && materialMatch && priceMatch;
    });
  }, [products, selectedShapes, selectedMaterials, selectedPrice, searchQuery]);

  // Reset về trang 1 khi thay đổi filter
  useEffect(() => { setCurrentPage(1); }, [selectedShapes, selectedMaterials, selectedPrice, searchQuery]);
  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [currentPage]);

  const indexOfLastProduct  = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts     = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages          = Math.ceil(filteredProducts.length / productsPerPage);

  const paginate  = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage  = () => setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev));
  const prevPage  = () => setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));

  const handleCheckboxChange = (setState, state, value) => {
    if (state.includes(value)) setState(state.filter((item) => item !== value));
    else setState([...state, value]);
  };

  const hasActiveFilters =
    selectedShapes.length > 0 || selectedMaterials.length > 0 || selectedPrice !== "all";

  const resetFilters = () => {
    setSelectedShapes([]);
    setSelectedMaterials([]);
    setSelectedPrice("all");
  };

  return (
    <div className="main-page">
      <div style={{ width: "100%", marginLeft: "40px", overflow: "hidden" }}>
        <img
          src={bannerImg}
          alt="Khuyến mãi FGlasses"
          style={{ width: "100%", height: "auto", display: "block", objectFit: "cover" }}
        />
      </div>

      <div className="main-header">
        <h1>Khám phá bộ sưu tập kính</h1>
        {searchQuery && (
          <p style={{ marginTop: "10px", fontSize: "18px", fontWeight: "bold" }}>
            Kết quả tìm kiếm cho: "<span style={{ color: "#0070c9" }}>{searchQuery}</span>"
          </p>
        )}
      </div>

      <div className="main-content">
        {/* ===== SIDEBAR FILTER ===== */}
        <aside className="sidebar-filter">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0 }}>Bộ lọc sản phẩm</h3>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                style={{
                  fontSize: "12px", color: "#ef4444", background: "none",
                  border: "none", cursor: "pointer", fontWeight: "bold", padding: 0,
                }}
              >
                Xoá lọc
              </button>
            )}
          </div>
          <div style={{ borderBottom: "2px solid #111827", marginBottom: "20px", marginTop: "10px" }} />

          {/* Filter: Hình dáng gọng — tự động từ API */}
          <div className="filter-group">
            <h4>Hình dáng gọng</h4>
            {shapes.length === 0 ? (
              <p style={{ fontSize: "13px", color: "#9ca3af", fontStyle: "italic" }}>Đang tải...</p>
            ) : (
              shapes.map((shape) => {
                const name = shape.shapeName || shape.name || "";
                return (
                  <label key={shape.shapeId || shape.id} className="filter-label">
                    <input
                      type="checkbox"
                      checked={selectedShapes.includes(name)}
                      onChange={() => handleCheckboxChange(setSelectedShapes, selectedShapes, name)}
                    />
                    {name}
                  </label>
                );
              })
            )}
          </div>

          {/* Filter: Chất liệu — tự động từ API */}
          <div className="filter-group">
            <h4>Chất liệu</h4>
            {materials.length === 0 ? (
              <p style={{ fontSize: "13px", color: "#9ca3af", fontStyle: "italic" }}>Đang tải...</p>
            ) : (
              materials.map((mat) => {
                const name = mat.materialName || mat.name || "";
                return (
                  <label key={mat.materialId || mat.id} className="filter-label">
                    <input
                      type="checkbox"
                      checked={selectedMaterials.includes(name)}
                      onChange={() => handleCheckboxChange(setSelectedMaterials, selectedMaterials, name)}
                    />
                    {name}
                  </label>
                );
              })
            )}
          </div>

          {/* Filter: Mức giá — giữ nguyên hardcode vì đây là khoảng giá */}
          <div className="filter-group">
            <h4>Mức giá</h4>
            {[
              { value: "all",     label: "Tất cả" },
              { value: "under15", label: "Dưới $15" },
              { value: "15to20",  label: "Từ $15 - $20" },
              { value: "over20",  label: "Trên $20" },
            ].map((opt) => (
              <label key={opt.value} className="filter-label">
                <input
                  type="radio"
                  name="price"
                  checked={selectedPrice === opt.value}
                  onChange={() => setSelectedPrice(opt.value)}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </aside>

        {/* ===== DANH SÁCH SẢN PHẨM ===== */}
        <section className="product-section">
          {isLoading && (
            <p style={{ textAlign: "center", fontSize: "18px", marginTop: "40px" }}>
              ⏳ Đang tải dữ liệu từ máy chủ...
            </p>
          )}
          {error && (
            <p style={{ textAlign: "center", fontSize: "18px", marginTop: "40px", color: "red" }}>
              ❌ {error}
            </p>
          )}

          {!isLoading && !error && filteredProducts.length === 0 ? (
            <p style={{ textAlign: "center", fontSize: "18px", marginTop: "40px", color: "#666" }}>
              Không tìm thấy sản phẩm nào phù hợp.
            </p>
          ) : (
            <>
              <div className="product-grid">
                {currentProducts.map((product) => (
                  <ProductCard key={product.id || product.frameId} product={product} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="page-btn"
                    onClick={prevPage}
                    disabled={currentPage === 1}
                    style={{ opacity: currentPage === 1 ? 0.5 : 1 }}
                  >
                    Trước
                  </button>
                  {[...Array(totalPages)].map((_, index) => (
                    <button
                      key={index + 1}
                      className={`page-btn ${currentPage === index + 1 ? "active" : ""}`}
                      onClick={() => paginate(index + 1)}
                    >
                      {index + 1}
                    </button>
                  ))}
                  <button
                    className="page-btn"
                    onClick={nextPage}
                    disabled={currentPage === totalPages}
                    style={{ opacity: currentPage === totalPages ? 0.5 : 1 }}
                  >
                    Sau
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}