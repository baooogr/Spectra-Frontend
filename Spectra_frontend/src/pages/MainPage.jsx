import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom"; 
import "./MainPage.css"; 

import ProductCard from "../components/product/ProductCard";
import productList from "../components/product/data/ProductList";

export default function MainPage() {
  // Lấy giá trị 'search' 
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || "";

  // --- STATE BỘ LỌC CŨ ---
  const [selectedShapes, setSelectedShapes] = useState([]);
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [selectedPrice, setSelectedPrice] = useState("all"); 

  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 12; 

  // --- LOGIC LỌC DỮ LIỆU TỔNG HỢP ---
  const filteredProducts = useMemo(() => {
    return productList.filter((product) => {
      
      // 1. Lọc theo từ khóa tìm kiếm (Tên sản phẩm)
      
      const searchMatch = product.name.toLowerCase().includes(searchQuery.toLowerCase());

      // 2. Các logic lọc cũ
      const frameDesign = product.detail?.features?.frameDesign || [];
      const productShape = frameDesign.find(f => f.startsWith("Shape:"))?.replace("Shape: ", "") || product.shape;
      const productMaterial = frameDesign.find(f => f.startsWith("Material:"))?.replace("Material: ", "") || product.material;

      const shapeMatch = selectedShapes.length === 0 || selectedShapes.includes(productShape);
      const materialMatch = selectedMaterials.length === 0 || selectedMaterials.includes(productMaterial);

      let priceMatch = true;
      if (selectedPrice === "under15") priceMatch = product.price < 15;
      else if (selectedPrice === "15to20") priceMatch = product.price >= 15 && product.price <= 20;
      else if (selectedPrice === "over20") priceMatch = product.price > 20;

      
      return searchMatch && shapeMatch && materialMatch && priceMatch;
    });
  }, [selectedShapes, selectedMaterials, selectedPrice, searchQuery]); 

 
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedShapes, selectedMaterials, selectedPrice, searchQuery]);

  
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);


  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev));
  const prevPage = () => setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));

  const handleCheckboxChange = (setState, state, value) => {
    if (state.includes(value)) {
      setState(state.filter((item) => item !== value));
    } else {
      setState([...state, value]);
    }
  };

  return (
    <div className="main-page">
      <div className="main-header">
        <h1>Khám phá bộ sưu tập kính</h1>
        <p>Tìm chiếc kính phù hợp nhất với phong cách của bạn.</p>
        
        {/* Hiển thị thông báo nếu người dùng đang tìm kiếm */}
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
            <label className="filter-label">
              <input type="checkbox" checked={selectedShapes.includes("Rectangle")} onChange={() => handleCheckboxChange(setSelectedShapes, selectedShapes, "Rectangle")} /> Chữ nhật
            </label>
            <label className="filter-label">
              <input type="checkbox" checked={selectedShapes.includes("Square")} onChange={() => handleCheckboxChange(setSelectedShapes, selectedShapes, "Square")} /> Vuông
            </label>
            <label className="filter-label">
              <input type="checkbox" checked={selectedShapes.includes("Round")} onChange={() => handleCheckboxChange(setSelectedShapes, selectedShapes, "Round")} /> Tròn
            </label>
          </div>

          <div className="filter-group">
            <h4>Chất liệu</h4>
            <label className="filter-label">
              <input type="checkbox" checked={selectedMaterials.includes("Plastic")} onChange={() => handleCheckboxChange(setSelectedMaterials, selectedMaterials, "Plastic")} /> Nhựa
            </label>
            <label className="filter-label">
              <input type="checkbox" checked={selectedMaterials.includes("Stainless Steel")} onChange={() => handleCheckboxChange(setSelectedMaterials, selectedMaterials, "Stainless Steel")} /> Thép không gỉ
            </label>
          </div>

          <div className="filter-group">
            <h4>Mức giá</h4>
            <label className="filter-label">
              <input type="radio" name="price" checked={selectedPrice === "all"} onChange={() => setSelectedPrice("all")} /> Tất cả
            </label>
            <label className="filter-label">
              <input type="radio" name="price" checked={selectedPrice === "under15"} onChange={() => setSelectedPrice("under15")} /> Dưới $15
            </label>
            <label className="filter-label">
              <input type="radio" name="price" checked={selectedPrice === "15to20"} onChange={() => setSelectedPrice("15to20")} /> Từ $15 - $20
            </label>
            <label className="filter-label">
              <input type="radio" name="price" checked={selectedPrice === "over20"} onChange={() => setSelectedPrice("over20")} /> Trên $20
            </label>
          </div>
        </aside>

        <section className="product-section">
          {filteredProducts.length === 0 ? (
            <p style={{ textAlign: "center", fontSize: "18px", marginTop: "40px" }}>Không tìm thấy sản phẩm nào phù hợp với tìm kiếm và bộ lọc của bạn.</p>
          ) : (
            <>
              <div className="product-grid">
                {currentProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {totalPages > 0 && (
                <div className="pagination">
                  <button className="page-btn" onClick={prevPage} disabled={currentPage === 1} style={{ opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}>Trước</button>
                  {[...Array(totalPages)].map((_, index) => (
                    <button key={index + 1} className={`page-btn ${currentPage === index + 1 ? "active" : ""}`} onClick={() => paginate(index + 1)}>{index + 1}</button>
                  ))}
                  <button className="page-btn" onClick={nextPage} disabled={currentPage === totalPages} style={{ opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}>Sau</button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}