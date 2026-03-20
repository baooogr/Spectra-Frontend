import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import "./MainPage.css";
import ProductCard from "../components/product/ProductCard";
import { useFrames, useShapes, useMaterials } from "../api";

const heroSlides = [
  {
    image: "/Images/ethan-robertson-SYx3UCHZJlo-unsplash.jpg",
    tag: "New Collection",
    title: "See the World in Style",
    subtitle:
      "Premium eyewear starting at $6.95. Discover frames that match your vibe — bold, minimal, or somewhere in between.",
    cta: "Shop Now",
  },
  {
    image: "/Images/ali-pazani-GwglcplmXDs-unsplash.jpg",
    tag: "Trending",
    title: "Frames That Define You",
    subtitle:
      "Explore our curated collection of designer-inspired eyewear at prices that won't break the bank.",
    cta: "Explore Collection",
  },
  {
    image: "/Images/tamara-bellis-tw5_DJQaeDU-unsplash.jpg",
    tag: "Best Sellers",
    title: "Look Sharp, Feel Sharper",
    subtitle:
      "From classic aviators to modern cat-eyes, find the perfect pair that complements your look.",
    cta: "Browse Bestsellers",
  },
];

const categories = [
  {
    image: "/Images/giorgio-trovato-K62u25Jk6vo-unsplash.jpg",
    title: "Eyeglasses",
    desc: "Classic & modern frames",
  },
  {
    image: "/Images/bradyn-trollip-10zIqwA5VL0-unsplash.jpg",
    title: "Sunglasses",
    desc: "UV protection in style",
  },
  {
    image: "/Images/lensabl-FwtWEIzyNJI-unsplash.jpg",
    title: "Prescription Lenses",
    desc: "Crystal clear vision",
  },
];

export default function MainPage() {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || "";

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
  const [heroIndex, setHeroIndex] = useState(0);
  const productsPerPage = 12;

  // Hero auto-slide
  useEffect(() => {
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

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

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedShapes, selectedMaterials, selectedPrice, searchQuery]);
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

  const scrollToProducts = () => {
    document
      .getElementById("products-section")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="main-page">
      {/* ===== HERO CAROUSEL ===== */}
      <section className="hero-section">
        {heroSlides.map((slide, i) => (
          <div
            key={i}
            className={`hero-slide ${i === heroIndex ? "active" : ""}`}
          >
            <img src={slide.image} alt={slide.title} />
            <div className="hero-content">
              <span className="hero-tag">{slide.tag}</span>
              <h1 className="hero-title">{slide.title}</h1>
              <p className="hero-subtitle">{slide.subtitle}</p>
              <button className="hero-cta" onClick={scrollToProducts}>
                {slide.cta} →
              </button>
            </div>
          </div>
        ))}
        <div className="hero-dots">
          {heroSlides.map((_, i) => (
            <button
              key={i}
              className={`hero-dot ${i === heroIndex ? "active" : ""}`}
              onClick={() => setHeroIndex(i)}
            />
          ))}
        </div>
      </section>

      {/* ===== FEATURES BAR ===== */}
      <div className="features-bar">
        <div className="feature-item">
          <span className="feature-icon">🚚</span>
          <div className="feature-text">
            <strong>Free Shipping</strong>
            <span>On orders over $50</span>
          </div>
        </div>
        <div className="feature-item">
          <span className="feature-icon">🔄</span>
          <div className="feature-text">
            <strong>Easy Returns</strong>
            <span>30-day money back</span>
          </div>
        </div>
        <div className="feature-item">
          <span className="feature-icon">🛡️</span>
          <div className="feature-text">
            <strong>Quality Guarantee</strong>
            <span>Premium materials</span>
          </div>
        </div>
        <div className="feature-item">
          <span className="feature-icon">💬</span>
          <div className="feature-text">
            <strong>24/7 Support</strong>
            <span>Always here for you</span>
          </div>
        </div>
      </div>

      {/* ===== CATEGORY SHOWCASE ===== */}
      <section className="category-showcase">
        <div className="section-label">
          <h2>Shop by Category</h2>
          <p>Find the perfect eyewear for every occasion</p>
        </div>
        <div className="category-grid">
          {categories.map((cat, i) => (
            <Link to="/" key={i} className="category-card">
              <img src={cat.image} alt={cat.title} />
              <div className="category-card-overlay">
                <h3>{cat.title}</h3>
                <p>{cat.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ===== PRODUCT SECTION ===== */}
      <div id="products-section" className="main-header">
        <h1>Explore Our Collection</h1>
        {searchQuery && (
          <p
            style={{
              marginTop: "10px",
              fontSize: "16px",
              color: "var(--color-text-secondary)",
            }}
          >
            Results for: "
            <span style={{ color: "var(--color-primary)", fontWeight: 700 }}>
              {searchQuery}
            </span>
            "
          </p>
        )}
      </div>

      <div className="main-content">
        {/* SIDEBAR FILTER */}
        <aside className="sidebar-filter">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h3 style={{ margin: 0, borderBottom: "none", paddingBottom: 0 }}>
              Filters
            </h3>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                style={{
                  fontSize: "12px",
                  color: "var(--color-error)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                Clear All
              </button>
            )}
          </div>
          <div
            style={{
              borderBottom: "2px solid var(--color-primary)",
              marginBottom: "20px",
              marginTop: "10px",
            }}
          />

          <div className="filter-group">
            <h4>Frame Shape</h4>
            {shapes.length === 0 ? (
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--color-text-muted)",
                  fontStyle: "italic",
                }}
              >
                Loading...
              </p>
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
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--color-text-muted)",
                  fontStyle: "italic",
                }}
              >
                Loading...
              </p>
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
        <section className="product-section">
          {isLoading && (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>⏳</div>
              <p style={{ color: "var(--color-text-muted)", fontSize: "16px" }}>
                Loading products...
              </p>
            </div>
          )}
          {error && (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>❌</div>
              <p style={{ color: "var(--color-error)", fontSize: "16px" }}>
                {error}
              </p>
            </div>
          )}

          {!isLoading && !error && filteredProducts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <div style={{ fontSize: "48px", marginBottom: "12px" }}>🔍</div>
              <p style={{ color: "var(--color-text-muted)", fontSize: "16px" }}>
                No products found matching your criteria.
              </p>
            </div>
          ) : (
            <>
              <div className="product-grid">
                {currentProducts.map((product) => (
                  <ProductCard
                    key={product.id || product.frameId}
                    product={product}
                  />
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
                    ← Prev
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
                    Next →
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
