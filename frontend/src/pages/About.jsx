import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/About.css';

const About = () => {
  return (
    <div className="about-page">
      <div className="about-container">
        <h1 className="page-title">About SkyChat</h1>

        <div className="about-card">
          <h2>What is SkyChat?</h2>
          <p>
            SkyChat is an intelligent flight discovery platform that helps you explore global aviation data
            through intuitive search and conversational AI. Built with MariaDB and the comprehensive
            OpenFlights dataset, SkyChat provides instant access to information about thousands of airports,
            airlines, and flight routes worldwide.
          </p>
        </div>

        <div className="about-card">
          <h2>Features</h2>
          <ul className="features-list">
            <li><strong>AI-Powered Chat:</strong> Ask questions in natural language and get instant answers</li>
            <li><strong>Route Search:</strong> Find direct and connecting flights between any airports</li>
            <li><strong>Airport Database:</strong> Search and explore 7,000+ airports globally</li>
            <li><strong>Airline Information:</strong> Browse 5,000+ airlines and their route networks</li>
            <li><strong>Analytics Dashboard:</strong> Discover busiest routes, longest flights, and hub airports</li>
            <li><strong>Real-time Search:</strong> Fast, efficient queries powered by MariaDB</li>
          </ul>
        </div>

        <div className="about-card">
          <h2>Technology Stack</h2>
          <div className="tech-stack">
            <div className="tech-item">
              <h3>Backend</h3>
              <p>Python 3.11, Flask</p>
            </div>
            <div className="tech-item">
              <h3>Database</h3>
              <p>MariaDB</p>
            </div>
            <div className="tech-item">
              <h3>Frontend</h3>
              <p>React, Vite</p>
            </div>
            <div className="tech-item">
              <h3>Data Source</h3>
              <p>OpenFlights Dataset</p>
            </div>
          </div>
        </div>

        <div className="about-card">
          <h2>Data Source</h2>
          <p>SkyChat uses the OpenFlights dataset, which includes:</p>
          <ul>
            <li>7,000+ airports across 250+ countries</li>
            <li>5,000+ airlines from around the world</li>
            <li>67,000+ flight routes</li>
            <li>Real-world aviation data maintained by the community</li>
          </ul>
        </div>

        <div className="about-card cta-card">
          <h2>Get Started</h2>
          <p>Ready to explore? Try asking questions or searching for flights!</p>
          <div className="cta-buttons">
            <Link to="/chat" className="btn btn-primary">Start Chat</Link>
            <Link to="/search" className="btn btn-secondary">Search Flights</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
