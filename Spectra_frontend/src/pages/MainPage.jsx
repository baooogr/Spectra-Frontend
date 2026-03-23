import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./MainPage.css";
import ProductCard from "../components/product/ProductCard";
import { useFrames } from "../api";

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
  const { frames: products, isLoading: framesLoading } = useFrames();

  const [heroIndex, setHeroIndex] = useState(0);

  // Hero auto-slide
  useEffect(() => {
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Show first 8 products as featured
  const featuredProducts = products.slice(0, 8);

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
              <Link to="/shop" className="hero-cta">
                {slide.cta} →
              </Link>
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
          <span className="feature-icon">01</span>
          <div className="feature-text">
            <strong>Free Shipping</strong>
            <span>On orders over $50</span>
          </div>
        </div>
        <div className="feature-item">
          <span className="feature-icon">02</span>
          <div className="feature-text">
            <strong>Easy Returns</strong>
            <span>30-day money back</span>
          </div>
        </div>
        <div className="feature-item">
          <span className="feature-icon">03</span>
          <div className="feature-text">
            <strong>Quality Guarantee</strong>
            <span>Premium materials</span>
          </div>
        </div>
        <div className="feature-item">
          <span className="feature-icon">04</span>
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

      {/* ===== FEATURED PRODUCTS ===== */}
      <section className="featured-section">
        <div className="section-label">
          <h2>Featured Products</h2>
          <p>Handpicked frames to get you started</p>
        </div>

        {framesLoading ? (
          <div className="featured-loading">
            <p>Loading products...</p>
          </div>
        ) : (
          <>
            <div className="featured-grid">
              {featuredProducts.map((product) => (
                <ProductCard
                  key={product.id || product.frameId}
                  product={product}
                />
              ))}
            </div>
            <div className="featured-cta">
              <Link to="/shop" className="browse-all-btn">
                Browse All Products →
              </Link>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
