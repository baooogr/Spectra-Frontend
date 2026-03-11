import { Link } from 'react-router-dom';
import './Footer.css'; 

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        
        <div className="footer-col about">
          <h3 className="footer-heading">FGlasses</h3>
          <p className="footer-text">
            Khám phá thế giới qua lăng kính hoàn hảo. Chúng tôi cung cấp các mẫu gọng kính đa dạng và tròng kính chất lượng cao phù hợp với mọi nhu cầu và phong cách của bạn.
          </p>
        </div>

        <div className="footer-col links">
          <h3 className="footer-heading">Shop</h3>
          <ul className="footer-list">
            <li><Link to="/eyeglasses" className="footer-link">Eyeglasses</Link></li>
            <li><Link to="/sunglasses" className="footer-link">Sunglasses</Link></li>
            <li><Link to="/lenses" className="footer-link">Lenses</Link></li>
            <li><Link to="/accessories" className="footer-link">Accessories</Link></li>
          </ul>
        </div>

        <div className="footer-col links">
          <h3 className="footer-heading">Support</h3>
          <ul className="footer-list">
            <li><Link to="/faq" className="footer-link">FAQ</Link></li>
            <li><Link to="/shipping" className="footer-link">Shipping & Returns</Link></li>
            <li><Link to="/warranty" className="footer-link">Warranty</Link></li>
            <li><Link to="/contact" className="footer-link">Contact Us</Link></li>
          </ul>
        </div>

        <div className="footer-col newsletter">
          <h3 className="footer-heading">Newsletter</h3>
          <p className="footer-text" style={{ marginBottom: '12px' }}>
            Đăng ký để nhận thông tin về các bộ sưu tập mới và ưu đãi đặc biệt.
          </p>
          <div className="newsletter-form">
            <input type="email" placeholder="Enter your email" className="newsletter-input" />
            <button className="newsletter-btn">Subscribe</button>
          </div>
        </div>

      </div>

      <div className="footer-bottom">
        <p style={{ margin: 0 }}>&copy; {new Date().getFullYear()} GLasses. All rights reserved.</p>
        <div className="footer-socials">
          <span className="social-link">Facebook</span>
          <span className="social-link">Instagram</span>
        </div>
      </div>
    </footer>
  );
}