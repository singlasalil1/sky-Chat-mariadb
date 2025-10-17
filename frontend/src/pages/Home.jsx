import React from 'react';
import { Link } from 'react-router-dom';
import StatCard from '../components/StatCard';
import '../styles/Home.css';

const Home = () => {
  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Discover Your Perfect Flight</h1>
          <p className="hero-subtitle">
            Explore thousands of flight routes, airports, and airlines worldwide with intelligent search and analytics
          </p>
          <div className="hero-cta">
            <Link to="/chat" className="btn btn-primary">Start Chatting</Link>
            <Link to="/search" className="btn btn-secondary">Explore Routes</Link>
          </div>
        </div>

        <div className="hero-stats">
          <StatCard number="7,000+" label="Airports" icon="🛫" />
          <StatCard number="5,000+" label="Airlines" icon="✈️" />
          <StatCard number="67,000+" label="Routes" icon="🌍" />
        </div>
      </section>

      <section className="features-section">
        <h2 className="section-title">Powerful Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">💬</div>
            <h3>AI-Powered Chat</h3>
            <p>Ask questions in natural language and get instant, intelligent responses about flights and airports</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔍</div>
            <h3>Advanced Search</h3>
            <p>Search routes, airports, and airlines with powerful filters and real-time results</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Analytics Dashboard</h3>
            <p>Explore busiest routes, longest flights, and hub airports with interactive visualizations</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🌍</div>
            <h3>Global Coverage</h3>
            <p>Access comprehensive data on airports and routes from around the world</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
