import React from 'react';
import '../styles/Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <p>&copy; 2025 SkyChat. Built with MariaDB & OpenFlights Dataset</p>
        <div className="footer-links">
          <a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href="/about">About</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
