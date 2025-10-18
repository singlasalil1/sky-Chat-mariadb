import React from 'react';
import { Link } from 'react-router-dom';
import StatCard from '../components/StatCard';
import '../styles/Home.css';

const Home = () => {
  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            <span className="title-main">SkyChat</span>
            <span className="title-adventures">Adventures</span>
          </h1>
          <p className="hero-subtitle">
            First-ever MariaDB Vector Search + RAG implementation for aviation! Ask complex questions in natural language and get intelligent answers in under 500ms - powered by local LLMs, 90% cheaper, 100% private.
          </p>
          <div className="hero-cta">
            <Link to="/chat" className="btn btn-primary">
              <span className="btn-icon">💬</span>
              Start Adventure
            </Link>
            <Link to="/adventures" className="btn btn-detective">
              <span className="btn-icon">🕵️</span>
              Solve Mysteries
            </Link>
          </div>
        </div>

        <div className="hero-stats">
          <StatCard number="<500ms" label="Query Time" icon="⚡" />
          <StatCard number="67K+" label="Vector Embeddings" icon="🧮" />
          <StatCard number="90%" label="Cost Savings" icon="💰" />
        </div>
      </section>

      <section className="features-section">
        <h2 className="section-title">Revolutionary Technology</h2>
        <div className="features-grid">
          <div className="feature-card featured">
            <div className="feature-icon">🧮</div>
            <h3>Vector Search Intelligence</h3>
            <p>MariaDB's cutting-edge vector embeddings understand context, not just keywords. Ask "eco-friendly routes to Europe" and watch semantic matching in action!</p>
            <Link to="/chat" className="feature-link">See it in Action →</Link>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🤖</div>
            <h3>RAG with Local LLMs</h3>
            <p>Llama 3.2 & Mistral running on-premise with Retrieval-Augmented Generation. ChatGPT-level intelligence without the cloud or costs.</p>
            <Link to="/chat" className="feature-link">Try Natural Language →</Link>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Sub-500ms Performance</h3>
            <p>Vector similarity search + ColumnStore analytics deliver lightning-fast results. Watch the AI thinking process in real-time!</p>
            <Link to="/chat" className="feature-link">Experience Speed →</Link>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3>100% Private & Cost-Effective</h3>
            <p>All processing happens on-premise. No cloud APIs, no data leaks, 90% cost savings vs OpenAI. Enterprise-grade privacy meets AI power.</p>
            <Link to="/analytics" className="feature-link">View Tech Stack →</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
