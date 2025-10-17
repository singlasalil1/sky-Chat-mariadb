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
          <span className="logo-text">SkyChat</span>
        </Link>
        <ul className="nav-menu">
          <li><Link to="/" className={isActive('/')}>Home</Link></li>
          <li><Link to="/chat" className={isActive('/chat')}>Chat</Link></li>
          <li><Link to="/search" className={isActive('/search')}>Search</Link></li>
          <li><Link to="/analytics" className={isActive('/analytics')}>Analytics</Link></li>
          <li><Link to="/about" className={isActive('/about')}>About</Link></li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
