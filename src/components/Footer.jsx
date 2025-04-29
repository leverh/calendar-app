import React from 'react';
import "../styles/components/Footer.css";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-info">
          <p className="copyright">
            &copy; {currentYear} Calendar &amp; Task Manager. All rights reserved.
          </p>
          <p className="created-by">
            Created with care by{' '}
            <a 
              href="https://pixelsummit.dev/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="portfolio-link"
            >
              PixelSummit
            </a>
          </p>
        </div>
        
        <div className="footer-links">
          {/* <a href="#privacy" className="footer-link">Privacy Policy</a> */}
          <span className="footer-divider">|</span>
          {/* <a href="#terms" className="footer-link">Terms of Use</a> */}
        </div>
      </div>
    </footer>
  );
};

export default Footer;