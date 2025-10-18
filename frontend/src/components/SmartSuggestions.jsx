import React from 'react';
import '../styles/SmartSuggestions.css';

const SmartSuggestions = ({ onSelectQuery }) => {
  const suggestions = [
    {
      category: '🌍 Flight Routes',
      icon: '✈️',
      queries: [
        {
          text: 'Find flights from JFK to LAX',
          tag: 'Direct Routes',
          complexity: 'Simple'
        },
        {
          text: 'Show me routes from SFO to LHR',
          tag: 'International',
          complexity: 'Simple'
        },
        {
          text: 'Find routes from ORD',
          tag: 'All Routes',
          complexity: 'Medium'
        }
      ]
    },
    {
      category: '🎯 Airport Search',
      icon: '🔍',
      queries: [
        {
          text: 'Search airport London',
          tag: 'City Search',
          complexity: 'Simple'
        },
        {
          text: 'Find airports in Tokyo',
          tag: 'Regional',
          complexity: 'Simple'
        },
        {
          text: 'Show major hub airports',
          tag: 'Hubs',
          complexity: 'Medium'
        }
      ]
    },
    {
      category: '💡 Route Analytics',
      icon: '🚀',
      queries: [
        {
          text: 'Show me the busiest routes',
          tag: 'Popular',
          complexity: 'Medium'
        },
        {
          text: 'What are the longest flights?',
          tag: 'Distance',
          complexity: 'Medium'
        },
        {
          text: 'Find routes from JFK',
          tag: 'Departure Hub',
          complexity: 'Simple'
        }
      ]
    },
    {
      category: '📊 Airline Information',
      icon: '📈',
      queries: [
        {
          text: 'Search airline United',
          tag: 'Airline Search',
          complexity: 'Simple'
        },
        {
          text: 'Find airlines in USA',
          tag: 'Regional',
          complexity: 'Medium'
        },
        {
          text: 'Show flights from LAX to SFO',
          tag: 'Domestic',
          complexity: 'Simple'
        }
      ]
    }
  ];

  const getComplexityColor = (complexity) => {
    switch (complexity) {
      case 'Simple':
        return '#10b981';
      case 'Medium':
        return '#3b82f6';
      case 'Complex':
        return '#f59e0b';
      case 'Advanced':
        return '#8b5cf6';
      case 'Expert':
        return '#ef4444';
      default:
        return '#6366f1';
    }
  };

  return (
    <div className="smart-suggestions-container">
      <div className="suggestions-header">
        <h3 className="suggestions-title">
          <span className="title-icon">💡</span>
          Try Natural Language Queries
        </h3>
        <p className="suggestions-subtitle">
          These queries would break traditional systems - but SkyChat understands them all
        </p>
      </div>

      <div className="suggestions-grid">
        {suggestions.map((category, catIndex) => (
          <div key={catIndex} className="suggestion-category">
            <h4 className="category-header">
              <span className="category-icon">{category.icon}</span>
              {category.category}
            </h4>
            <div className="category-queries">
              {category.queries.map((query, queryIndex) => (
                <button
                  key={queryIndex}
                  className="query-card"
                  onClick={() => onSelectQuery(query.text)}
                >
                  <div className="query-text">{query.text}</div>
                  <div className="query-meta">
                    <span className="query-tag">{query.tag}</span>
                    <span
                      className="query-complexity"
                      style={{ backgroundColor: getComplexityColor(query.complexity) }}
                    >
                      {query.complexity}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="suggestions-footer">
        <div className="footer-stat">
          <span className="footer-icon">🧮</span>
          <div className="footer-content">
            <span className="footer-label">Vector Search</span>
            <span className="footer-value">67,000+ embeddings</span>
          </div>
        </div>
        <div className="footer-stat">
          <span className="footer-icon">⚡</span>
          <div className="footer-content">
            <span className="footer-label">Response Time</span>
            <span className="footer-value">&lt; 500ms</span>
          </div>
        </div>
        <div className="footer-stat">
          <span className="footer-icon">🎯</span>
          <div className="footer-content">
            <span className="footer-label">Accuracy</span>
            <span className="footer-value">96% semantic match</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartSuggestions;
