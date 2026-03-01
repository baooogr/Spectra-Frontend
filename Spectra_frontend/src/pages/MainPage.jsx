import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom"; 
import "./MainPage.css";
import ProductCard from "../components/product/ProductCard";

export default function MainPage() {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || "";

  // 1. STATE DỮ LIỆU API THẬT
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedShapes, setSelectedShapes] = useState([]);
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [selectedPrice, setSelectedPrice] = useState("all"); 

  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 12;

  // 2. GỌI API LẤY KÍNH
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      setError("");
      try {
        const response = await fetch("https://myspectra.runasp.net/api/Frames?page=1&pageSize=100");
        if (response.ok) {
          const data = await response.json();
          // BE trả về Object có items hoặc trả trực tiếp Array
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

  // 3. LOGIC LỌC DỮ LIỆU THẬT
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const productName = product.frameName || product.name || "";
      const searchMatch = productName.toLowerCase().includes(searchQuery.toLowerCase());

      const productShape = product.shape || "";
      const productMaterial = product.material || "";

      const shapeMatch = selectedShapes.length === 0 || selectedShapes.includes(productShape);
      const materialMatch = selectedMaterials.length === 0 || selectedMaterials.includes(productMaterial);

      const price = product.basePrice || product.price || 0;
      let priceMatch = true;
      if (selectedPrice === "under15") priceMatch = price < 15;
      else if (selectedPrice === "15to20") priceMatch = price >= 15 && price <= 20;
      else if (selectedPrice === "over20") priceMatch = price > 20;

      return searchMatch && shapeMatch && materialMatch && priceMatch;
    });
  }, [products, selectedShapes, selectedMaterials, selectedPrice, searchQuery]); 

  useEffect(() => { setCurrentPage(1); }, [selectedShapes, selectedMaterials, selectedPrice, searchQuery]);
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
      <div className="main-header">
        <h1>Khám phá bộ sưu tập kính</h1>
        <p>Tìm chiếc kính phù hợp nhất với phong cách của bạn.</p>
        
        {searchQuery && (
          <p style={{ marginTop: '10px', fontSize: '18px', fontWeight: 'bold' }}>
            Kết quả tìm kiếm cho: "<span style={{color: '#0070c9'}}>{searchQuery}</span>"
          </p>
        )}
      </div>

      <div className="main-content">
        <aside className="sidebar-filter">
          <h3>Bộ lọc sản phẩm</h3>
          <div className="filter-group">
            <h4>Hình dáng gọng</h4>
            <label className="filter-label"><input type="checkbox" checked={selectedShapes.includes("Rectangle")} onChange={() => handleCheckboxChange(setSelectedShapes, selectedShapes, "Rectangle")} /> Chữ nhật (Rectangle)</label>
            <label className="filter-label"><input type="checkbox" checked={selectedShapes.includes("Square")} onChange={() => handleCheckboxChange(setSelectedShapes, selectedShapes, "Square")} /> Vuông (Square)</label>
            <label className="filter-label"><input type="checkbox" checked={selectedShapes.includes("Round")} onChange={() => handleCheckboxChange(setSelectedShapes, selectedShapes, "Round")} /> Tròn (Round)</label>
          </div>
          <div className="filter-group">
            <h4>Chất liệu</h4>
            <label className="filter-label"><input type="checkbox" checked={selectedMaterials.includes("Plastic")} onChange={() => handleCheckboxChange(setSelectedMaterials, selectedMaterials, "Plastic")} /> Nhựa (Plastic)</label>
            <label className="filter-label"><input type="checkbox" checked={selectedMaterials.includes("Stainless Steel")} onChange={() => handleCheckboxChange(setSelectedMaterials, selectedMaterials, "Stainless Steel")} /> Thép không gỉ</label>
          </div>
          <div className="filter-group">
            <h4>Mức giá</h4>
            <label className="filter-label"><input type="radio" name="price" checked={selectedPrice === "all"} onChange={() => setSelectedPrice("all")} /> Tất cả</label>
            <label className="filter-label"><input type="radio" name="price" checked={selectedPrice === "under15"} onChange={() => setSelectedPrice("under15")} /> Dưới $15</label>
            <label className="filter-label"><input type="radio" name="price" checked={selectedPrice === "15to20"} onChange={() => setSelectedPrice("15to20")} /> Từ $15 - $20</label>
            <label className="filter-label"><input type="radio" name="price" checked={selectedPrice === "over20"} onChange={() => setSelectedPrice("over20")} /> Trên $20</label>
          </div>
        </aside>

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