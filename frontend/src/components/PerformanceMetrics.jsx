import React from 'react';
import '../styles/PerformanceMetrics.css';

const PerformanceMetrics = ({ metrics = {} }) => {
  const {
    queryTime = 437,
    semanticMatch = 96,
    vectorsSearched = '67,000+',
    costSavings = '90%',
    privacy = 'On-premise'
  } = metrics;

  const getPerformanceRating = (time) => {
    if (time < 300) return { label: 'Excellent', color: '#10b981', icon: '🚀' };
    if (time < 500) return { label: 'Great', color: '#3b82f6', icon: '⚡' };
    if (time < 1000) return { label: 'Good', color: '#f59e0b', icon: '👍' };
    return { label: 'Slow', color: '#ef4444', icon: '⏱️' };
  };

  const rating = getPerformanceRating(queryTime);

  return (
    <div className="performance-metrics-widget">
      <div className="metrics-header">
        <h4 className="metrics-title">
          <span className="metrics-icon">📊</span>
          Query Performance
        </h4>
        <div className="performance-badge" style={{ backgroundColor: rating.color }}>
          <span>{rating.icon}</span>
          <span>{rating.label}</span>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card primary">
          <div className="metric-value">{queryTime}ms</div>
          <div className="metric-label">Processing Time</div>
          <div className="metric-bar">
            <div
              className="metric-fill"
              style={{
                width: `${Math.min((queryTime / 500) * 100, 100)}%`,
                backgroundColor: rating.color
              }}
            ></div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🎯</div>
          <div className="metric-content">
            <div className="metric-value">{semanticMatch}%</div>
            <div className="metric-label">Semantic Match</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🧮</div>
          <div className="metric-content">
            <div className="metric-value">{vectorsSearched}</div>
            <div className="metric-label">Vectors Searched</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🔒</div>
          <div className="metric-content">
            <div className="metric-value">{privacy}</div>
            <div className="metric-label">Data Privacy</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">💰</div>
          <div className="metric-content">
            <div className="metric-value">{costSavings}</div>
            <div className="metric-label">Cost Savings</div>
          </div>
        </div>
      </div>

      <div className="comparison-section">
        <div className="comparison-header">
          <span className="comparison-icon">⚔️</span>
          <span className="comparison-title">vs Traditional Solutions</span>
        </div>
        <div className="comparison-bars">
          <div className="comparison-item">
            <div className="comparison-label">
              <span>SkyChat (MariaDB + RAG)</span>
              <span className="comparison-value">${(queryTime * 0.001).toFixed(3)}</span>
            </div>
            <div className="comparison-bar">
              <div
                className="comparison-fill skychat"
                style={{ width: '10%' }}
              ></div>
            </div>
          </div>
          <div className="comparison-item">
            <div className="comparison-label">
              <span>OpenAI API</span>
              <span className="comparison-value">$0.12</span>
            </div>
            <div className="comparison-bar">
              <div
                className="comparison-fill openai"
                style={{ width: '100%' }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div className="tech-stack">
        <div className="stack-badge">
          <span className="stack-icon">🗄️</span>
          <span className="stack-text">MariaDB Vector Search</span>
        </div>
        <div className="stack-badge">
          <span className="stack-icon">🤖</span>
          <span className="stack-text">Llama 3.2 / Mistral</span>
        </div>
        <div className="stack-badge">
          <span className="stack-icon">📊</span>
          <span className="stack-text">ColumnStore Analytics</span>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMetrics;
