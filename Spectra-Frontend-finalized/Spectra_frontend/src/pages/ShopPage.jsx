import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import "./ShopPage.css";
import ProductCard from "../components/product/ProductCard";
import { useFrames, useShapes, useMaterials } from "../api";

export default function ShopPage() {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || "";
  const categoryParam = searchParams.get("category") || "";

  const {
    frames: products,
    isLoading: framesLoading,
    isError: framesError,
  } = useFrames();
  const { shapes, isLoading: shapesLoading } = useShapes();
  const { materials, isLoading: materialsLoading } = useMaterials();

  const isLoading = framesLoading || shapesLoading || materialsLoading;
  const error = framesError ? "Could not connect to the server." : "";

  const [selectedShapes, setSelectedShapes] = useState([]);
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [selectedPrice, setSelectedPrice] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 12;

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const productName = product.frameName || product.name || "";
      const searchMatch = productName
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const productShapeName = product.shape?.shapeName || "";
      const productMaterialName = product.material?.materialName || "";
      const shapeMatch =
        selectedShapes.length === 0 ||
        selectedShapes.includes(productShapeName);
      const materialMatch =
        selectedMaterials.length === 0 ||
        selectedMaterials.includes(productMaterialName);
      const price = product.basePrice || product.price || 0;
      let priceMatch = true;
      if (selectedPrice === "under15") priceMatch = price < 15;
      else if (selectedPrice === "15to20")
        priceMatch = price >= 15 && price <= 20;
      else if (selectedPrice === "over20") priceMatch = price > 20;
      return searchMatch && shapeMatch && materialMatch && priceMatch;
    });
  }, [products, selectedShapes, selectedMaterials, selectedPrice, searchQuery]);

  // Reset page when filters change
  const filtersKey = `${selectedShapes.join(",")}|${selectedMaterials.join(",")}|${selectedPrice}|${searchQuery}`;
  const [prevFiltersKey, setPrevFiltersKey] = useState(filtersKey);
  if (prevFiltersKey !== filtersKey) {
    setPrevFiltersKey(filtersKey);
    setCurrentPage(1);
  }

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(
    indexOfFirstProduct,
    indexOfLastProduct,
  );
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () =>
    setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev));
  const prevPage = () => setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));

  const handleCheckboxChange = useCallback((setState, state, value) => {
    if (state.includes(value)) setState(state.filter((item) => item !== value));
    else setState([...state, value]);
  }, []);

  const hasActiveFilters =
    selectedShapes.length > 0 ||
    selectedMaterials.length > 0 ||
    selectedPrice !== "all";

  const resetFilters = () => {
    setSelectedShapes([]);
    setSelectedMaterials([]);
    setSelectedPrice("all");
  };

  return (
    <div className="shop-page">
      <div className="shop-header">
        <h1 className="shop-title">Our Collection</h1>
        {searchQuery && (
          <p className="shop-search-info">
            Results for: &ldquo;
            <span className="shop-search-term">{searchQuery}</span>
            &rdquo;
          </p>
        )}
        {categoryParam && (
          <p className="shop-search-info">
            Category: <span className="shop-search-term">{categoryParam}</span>
          </p>
        )}
      </div>

      <div className="shop-content">
        {/* SIDEBAR FILTER */}
        <aside className="shop-filter">
          <div className="shop-filter-header">
            <h3>Filters</h3>
            {hasActiveFilters && (
              <button onClick={resetFilters} className="shop-clear-btn">
                Clear All
              </button>
            )}
          </div>
          <div className="shop-filter-divider" />

          <div className="filter-group">
            <h4>Frame Shape</h4>
            {shapes.length === 0 ? (
              <p className="filter-loading">Loading...</p>
            ) : (
              shapes.map((shape) => {
                const name = shape.shapeName || shape.name || "";
                return (
                  <label
                    key={shape.shapeId || shape.id}
                    className="filter-label"
                  >
                    <input
                      type="checkbox"
                      checked={selectedShapes.includes(name)}
                      onChange={() =>
                        handleCheckboxChange(
                          setSelectedShapes,
                          selectedShapes,
                          name,
                        )
                      }
                    />
                    {name}
                  </label>
                );
              })
            )}
          </div>

          <div className="filter-group">
            <h4>Material</h4>
            {materials.length === 0 ? (
              <p className="filter-loading">Loading...</p>
            ) : (
              materials.map((mat) => {
                const name = mat.materialName || mat.name || "";
                return (
                  <label
                    key={mat.materialId || mat.id}
                    className="filter-label"
                  >
                    <input
                      type="checkbox"
                      checked={selectedMaterials.includes(name)}
                      onChange={() =>
                        handleCheckboxChange(
                          setSelectedMaterials,
                          selectedMaterials,
                          name,
                        )
                      }
                    />
                    {name}
                  </label>
                );
              })
            )}
          </div>

          <div className="filter-group">
            <h4>Price Range</h4>
            {[
              { value: "all", label: "All Prices" },
              { value: "under15", label: "Under $15" },
              { value: "15to20", label: "$15 - $20" },
              { value: "over20", label: "Over $20" },
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

        {/* PRODUCT GRID */}
        <section className="shop-products">
          {isLoading && (
            <div className="shop-status">
              <p>Loading products...</p>
            </div>
          )}
          {error && (
            <div className="shop-status shop-status--error">
              <p>{error}</p>
            </div>
          )}

          {!isLoading && !error && filteredProducts.length === 0 ? (
            <div className="shop-status">
              <p>No products found matching your criteria.</p>
            </div>
          ) : (
            <>
              <div className="shop-grid">
                {currentProducts.map((product) => (
                  <ProductCard
                    key={product.id || product.frameId}
                    product={product}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="shop-pagination">
                  <button
                    className="page-btn"
                    onClick={prevPage}
                    disabled={currentPage === 1}
                  >
                    Prev
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
                  >
                    Next
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
