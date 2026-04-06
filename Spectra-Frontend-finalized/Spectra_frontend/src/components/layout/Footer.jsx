import { Link } from "react-router-dom";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-col about">
          <h3 className="footer-heading">Spectra Eyewear</h3>
          <p className="footer-text">
            See the world through the perfect lens. We offer a diverse
            collection of frames and high-quality lenses tailored to your unique
            style and vision needs.
          </p>
        </div>

        <div className="footer-col links">
          <h3 className="footer-heading">Shop</h3>
          <ul className="footer-list">
            <li>
              <Link to="/" className="footer-link">
                Eyeglasses
              </Link>
            </li>
            {/* <li>
              <Link to="/" className="footer-link">
                Sunglasses
              </Link>
            </li> */}
            <li>
              <Link to="/" className="footer-link">
                Lenses
              </Link>
            </li>
            <li>
              <Link to="/" className="footer-link">
                Accessories
              </Link>
            </li>
          </ul>
        </div>

        <div className="footer-col links">
          <h3 className="footer-heading">Support</h3>
          <ul className="footer-list">
            <li>
              <Link to="/" className="footer-link">
                FAQ
              </Link>
            </li>
            <li>
              <Link to="/" className="footer-link">
                Shipping & Returns
              </Link>
            </li>
            <li>
              <Link to="/" className="footer-link">
                Warranty
              </Link>
            </li>
            <li>
              <Link to="/" className="footer-link">
                Contact Us
              </Link>
            </li>
          </ul>
        </div>

        <div className="footer-col newsletter">
          <h3 className="footer-heading">Stay in the Loop</h3>
          <p className="footer-text" style={{ marginBottom: "16px" }}>
            Subscribe for exclusive drops, seasonal deals, and style
            inspiration.
          </p>
          <div className="newsletter-form">
            <input
              type="email"
              placeholder="Your email address"
              className="newsletter-input"
            />
            <button className="newsletter-btn">Subscribe</button>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p style={{ margin: 0 }}>
          &copy; {new Date().getFullYear()} Spectra Eyewear. All rights
          reserved.
        </p>
        <div className="footer-socials">
          <span className="social-link">Facebook</span>
          <span className="social-link">Instagram</span>
          <span className="social-link">TikTok</span>
        </div>
      </div>
    </footer>
  );
}
