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
          text: 'Show me routes from LHR to DXB',
          tag: 'International',
          complexity: 'Simple'
        },
        {
          text: 'What routes connect North America to Australia?',
          tag: 'RAG Query',
          complexity: 'Complex'
        }
      ]
    },
    {
      category: '🎯 Airport Intelligence',
      icon: '🔍',
      queries: [
        {
          text: 'Search airport London',
          tag: 'City Search',
          complexity: 'Simple'
        },
        {
          text: 'What are the major hub airports in Europe?',
          tag: 'RAG Analysis',
          complexity: 'Complex'
        },
        {
          text: 'Which cities have multiple major airports?',
          tag: 'RAG Query',
          complexity: 'Advanced'
        }
      ]
    },
    {
      category: '🤖 AI-Powered Queries',
      icon: '🚀',
      queries: [
        {
          text: 'Tell me about airlines that fly to Asia',
          tag: 'RAG Analysis',
          complexity: 'Complex'
        },
        {
          text: 'What makes an airport a hub and which are the biggest?',
          tag: 'RAG Explain',
          complexity: 'Advanced'
        },
        {
          text: 'Compare routes from London Heathrow and Paris CDG',
          tag: 'RAG Compare',
          complexity: 'Expert'
        }
      ]
    },
    {
      category: '💡 Advanced Analytics',
      icon: '📊',
      queries: [
        {
          text: 'Show me the busiest routes',
          tag: 'Analytics',
          complexity: 'Medium'
        },
        {
          text: 'What are the longest non-stop flight routes in the world?',
          tag: 'RAG Analysis',
          complexity: 'Complex'
        },
        {
          text: 'Which Asian cities are major aviation hubs and why?',
          tag: 'RAG Insights',
          complexity: 'Expert'
        }
      ]
    },
    {
      category: '🌐 Regional Insights',
      icon: '🗺️',
      queries: [
        {
          text: 'Find airlines in USA',
          tag: 'Regional',
          complexity: 'Simple'
        },
        {
          text: 'What airports serve as gateways to South America?',
          tag: 'RAG Query',
          complexity: 'Advanced'
        },
        {
          text: 'Tell me about airports in island nations',
          tag: 'RAG Analysis',
          complexity: 'Complex'
        }
      ]
    },
    {
      category: '🎓 Aviation Knowledge',
      icon: '📚',
      queries: [
        {
          text: 'Explain the difference between IATA and ICAO codes',
          tag: 'RAG Explain',
          complexity: 'Medium'
        },
        {
          text: 'What are common connection points for transatlantic flights?',
          tag: 'RAG Insights',
          complexity: 'Advanced'
        },
        {
          text: 'How do airline alliances affect route networks?',
          tag: 'RAG Analysis',
          complexity: 'Expert'
        },
        {
          text: 'What airlines are part of Star Alliance?',
          tag: 'RAG Query',
          complexity: 'Medium'
        },
        {
          text: 'How do codeshare agreements work?',
          tag: 'RAG Explain',
          complexity: 'Complex'
        },
        {
          text: 'Which alliance has the most destinations?',
          tag: 'RAG Compare',
          complexity: 'Medium'
        },
        {
          text: 'How do hub airports coordinate with alliances?',
          tag: 'RAG Analysis',
          complexity: 'Advanced'
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
