import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom"; 
import "./MainPage.css";
import ProductCard from "../components/product/ProductCard";

// Import ảnh banner từ thư mục assets
import bannerImg from "../assets/bn.jpg"; 

export default function MainPage() {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || "";
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedShapes, setSelectedShapes] = useState([]);
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [selectedPrice, setSelectedPrice] = useState("all"); 

  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 12;

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      setError("");
      try {
        const response = await fetch("https://myspectra.runasp.net/api/Frames?page=1&pageSize=100");
        if (response.ok) {
          const data = await response.json();
          setProducts(data.items || data || []); 
        } else {
          setError("Không thể tải danh sách sản phẩm.");
        }
      } catch (err) {
        setError("Lỗi kết nối đến máy chủ Backend.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Tự động trích xuất các thuộc tính thực tế từ danh sách sản phẩm
  const availableBrands = [...new Set(products.map(p => p.brand?.brandName || p.brand).filter(Boolean))];
  const availableShapes = [...new Set(products.map(p => p.shape).filter(Boolean))];
  const availableMaterials = [...new Set(products.map(p => p.material).filter(Boolean))];

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const productName = product.frameName || product.name || "";
      const searchMatch = productName.toLowerCase().includes(searchQuery.toLowerCase());

      const productShape = product.shape || "";
      const productMaterial = product.material || "";
      const productBrand = product.brand?.brandName || product.brand || "";

      const shapeMatch = selectedShapes.length === 0 || selectedShapes.includes(productShape);
      const materialMatch = selectedMaterials.length === 0 || selectedMaterials.includes(productMaterial);
      const brandMatch = selectedBrands.length === 0 || selectedBrands.includes(productBrand);

      const price = product.basePrice || product.price || 0;
      let priceMatch = true;
      if (selectedPrice === "under15") priceMatch = price < 15;
      else if (selectedPrice === "15to20") priceMatch = price >= 15 && price <= 20;
      else if (selectedPrice === "over20") priceMatch = price > 20;

      return searchMatch && shapeMatch && materialMatch && brandMatch && priceMatch;
    });
  }, [products, selectedShapes, selectedMaterials, selectedBrands, selectedPrice, searchQuery]);

  useEffect(() => { setCurrentPage(1); }, [selectedShapes, selectedMaterials, selectedBrands, selectedPrice, searchQuery]);
  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [currentPage]);

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev));
  const prevPage = () => setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));

  const handleCheckboxChange = (setState, state, value) => {
    if (state.includes(value)) setState(state.filter((item) => item !== value));
    else setState([...state, value]);
  };

  return (
    <div className="main-page">
      
      {/* Banner */}
      <div style={{ width: '100%', marginLeft: '40px', overflow: 'hidden' }}>
        <img 
          src={bannerImg} 
          alt="Khuyến mãi FGlasses" 
          style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'cover' }} 
        />
      </div>

      <div className="main-header">
        <h1>Khám phá bộ sưu tập kính</h1>
        {searchQuery && (
          <p style={{ marginTop: '10px', fontSize: '18px', fontWeight: 'bold' }}>
            Kết quả tìm kiếm cho: "<span style={{color: '#0070c9'}}>{searchQuery}</span>"
          </p>
        )}
      </div>

      <div className="main-content">
        
        {/* Sidebar Filter tự động render dựa trên mảng available */}
        <aside className="sidebar-filter">
          <h3>Bộ lọc sản phẩm</h3>

          {/* Lọc Thương hiệu */}
          {availableBrands.length > 0 && (
            <div className="filter-group">
              <h4>Thương hiệu</h4>
              {availableBrands.map(brand => (
                <label key={brand} className="filter-label">
                  <input 
                    type="checkbox" 
                    checked={selectedBrands.includes(brand)} 
                    onChange={() => handleCheckboxChange(setSelectedBrands, selectedBrands, brand)} 
                  /> 
                  <span>{brand}</span>
                </label>
              ))}
            </div>
          )}

          {/* Lọc Hình dáng */}
          {availableShapes.length > 0 && (
            <div className="filter-group">
              <h4>Hình dáng gọng</h4>
              {availableShapes.map(shape => (
                <label key={shape} className="filter-label">
                  <input 
                    type="checkbox" 
                    checked={selectedShapes.includes(shape)} 
                    onChange={() => handleCheckboxChange(setSelectedShapes, selectedShapes, shape)} 
                  /> 
                  <span>{shape}</span>
                </label>
              ))}
            </div>
          )}

          {/* Lọc Chất liệu */}
          {availableMaterials.length > 0 && (
            <div className="filter-group">
              <h4>Chất liệu</h4>
              {availableMaterials.map(material => (
                <label key={material} className="filter-label">
                  <input 
                    type="checkbox" 
                    checked={selectedMaterials.includes(material)} 
                    onChange={() => handleCheckboxChange(setSelectedMaterials, selectedMaterials, material)} 
                  /> 
                  <span>{material}</span>
                </label>
              ))}
            </div>
          )}

          {/* Lọc Mức giá */}
          <div className="filter-group">
            <h4>Mức giá</h4>
            <label className="filter-label">
              <input type="radio" name="price" checked={selectedPrice === "all"} onChange={() => setSelectedPrice("all")} /> 
              <span>Tất cả</span>
            </label>
            <label className="filter-label">
              <input type="radio" name="price" checked={selectedPrice === "under15"} onChange={() => setSelectedPrice("under15")} /> 
              <span>Dưới $15</span>
            </label>
            <label className="filter-label">
              <input type="radio" name="price" checked={selectedPrice === "15to20"} onChange={() => setSelectedPrice("15to20")} /> 
              <span>Từ $15 - $20</span>
            </label>
            <label className="filter-label">
              <input type="radio" name="price" checked={selectedPrice === "over20"} onChange={() => setSelectedPrice("over20")} /> 
              <span>Trên $20</span>
            </label>
          </div>
        </aside>

        {/* Cột hiển thị sản phẩm */}
        <section className="product-section">
          {isLoading && <p style={{ textAlign: "center", fontSize: "18px", marginTop: "40px" }}>⏳ Đang tải dữ liệu từ máy chủ...</p>}
          {error && <p style={{ textAlign: "center", fontSize: "18px", marginTop: "40px", color: "red" }}>❌ {error}</p>}

          {!isLoading && !error && filteredProducts.length === 0 ? (
            <p style={{ textAlign: "center", fontSize: "18px", marginTop: "40px", color: "#666" }}>Không tìm thấy sản phẩm nào phù hợp.</p>
          ) : (
            <>
              <div className="product-grid">
                {currentProducts.map((product) => (
                  <ProductCard key={product.id || product.frameId} product={product} />
                ))}
              </div>

              {totalPages > 0 && (
                <div className="pagination">
                  <button className="page-btn" onClick={prevPage} disabled={currentPage === 1} style={{ opacity: currentPage === 1 ? 0.5 : 1 }}>Trước</button>
                  {[...Array(totalPages)].map((_, index) => (
                    <button key={index + 1} className={`page-btn ${currentPage === index + 1 ? "active" : ""}`} onClick={() => paginate(index + 1)}>{index + 1}</button>
                  ))}
                  <button className="page-btn" onClick={nextPage} disabled={currentPage === totalPages} style={{ opacity: currentPage === totalPages ? 0.5 : 1 }}>Sau</button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}