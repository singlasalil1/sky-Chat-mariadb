import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/Navbar.css';

const Navbar = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-brand">
          <span className="logo-icon">✈️</span>
          <span className="logo-text">SkyChat <span className="logo-adventures">Adventures</span></span>
        </Link>
        <ul className="nav-menu">
          <li><Link to="/" className={isActive('/')}>Home</Link></li>
          <li><Link to="/chat" className={isActive('/chat')}>Assistant</Link></li>
          <li><Link to="/adventures" className={isActive('/adventures')}>Adventures</Link></li>
          <li><Link to="/search" className={isActive('/search')}>Explorer</Link></li>
          <li><Link to="/analytics" className={isActive('/analytics')}>Analytics</Link></li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
