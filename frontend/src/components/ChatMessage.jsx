import React, { memo, useState } from 'react';
import '../styles/ChatMessage.css';

const ChatMessage = memo(({ message, isUser, type, timestamp, metrics }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const formatMessage = (data) => {
    if (typeof data === 'string') {
      if (type === 'welcome') {
        return (
          <div className="welcome-message">
            <h3>👋 {data}</h3>
            <p>I can help you with:</p>
            <ul className="capability-list">
              <li>🛫 Finding flights between airports</li>
              <li>🏢 Searching airports worldwide</li>
              <li>✈️ Getting airline information</li>
              <li>📊 Viewing route analytics</li>
            </ul>
          </div>
        );
      }
      return <p>{data}</p>;
    }

    if (data.type === 'error') {
      return (
        <div className="error-message">
          <div className="error-icon">⚠️</div>
          <div className="error-content">
            <p className="error-text">{data.message}</p>
            {data.suggestion && <p className="error-suggestion">💡 {data.suggestion}</p>}
          </div>
        </div>
      );
    }

    if (data.message && data.data) {
      const contentElement = (
        <div className="rich-content">
          <div className="content-header">
            <span className="content-icon">
              {data.type === 'direct_routes' ? '🛫' :
               data.type === 'airport_search' ? '🏢' :
               data.type === 'busiest_routes' ? '🔥' :
               data.type === 'longest_routes' ? '🌍' : '📊'}
            </span>
            <p className="content-title">{data.message}</p>
          </div>
          <div className="data-results">
            {data.data.slice(0, 8).map((item, index) => (
              <div key={index} className="result-card">
                {item.source_name && item.dest_name ? (
                  // Route
                  <div className="route-result">
                    <div className="route-path">
                      <span className="route-code">{item.source_iata || item.source_name}</span>
                      <span className="route-arrow">→</span>
                      <span className="route-code">{item.dest_iata || item.dest_name}</span>
                    </div>
                    {item.airline_name && <div className="route-airline">✈️ {item.airline_name}</div>}
                    <div className="route-meta">
                      {item.airline_count && <span className="meta-badge">🔢 {item.airline_count} airlines</span>}
                      {item.distance_km && <span className="meta-badge">📏 {Math.round(item.distance_km)} km</span>}
                    </div>
                  </div>
                ) : item.name && item.city ? (
                  // Airport or Airline
                  <div className="entity-result">
                    <div className="entity-header">
                      <strong className="entity-name">{item.name}</strong>
                      {item.iata && <span className="entity-code">{item.iata}</span>}
                    </div>
                    {item.city && item.country && (
                      <div className="entity-location">📍 {item.city}, {item.country}</div>
                    )}
                    {item.route_count && (
                      <div className="entity-stat">🛫 {item.route_count} routes</div>
                    )}
                  </div>
                ) : (
                  <span>{JSON.stringify(item)}</span>
                )}
              </div>
            ))}
            {data.data.length > 8 && (
              <div className="more-results-card">
                📋 +{data.data.length - 8} more results
              </div>
            )}
          </div>
        </div>
      );

      // If metrics are available, wrap in a flippable card
      if (metrics) {
        return (
          <div className="flip-card-container">
            <button
              className="flip-icon-button"
              onClick={() => setIsFlipped(!isFlipped)}
              aria-label={isFlipped ? 'Show results' : 'Show metrics'}
              title={isFlipped ? 'Show results' : 'Show performance metrics'}
            >
              {isFlipped ? '📊' : '⚡'}
            </button>
            <div className={`flip-card ${isFlipped ? 'flipped' : ''}`}>
              <div className="flip-card-front">
                {contentElement}
              </div>
              <div className="flip-card-back">
                <div className="metrics-content">
                  <div className="metrics-header">
                    <h3>📊 Performance Metrics</h3>
                  </div>

                  <div className="metrics-section">
                    <div className="metric-label">Query</div>
                    <div className="metric-value-text">"{metrics.query}"</div>
                  </div>

                  <div className="metrics-section">
                    <div className="metric-label">Total Response Time</div>
                    <div className="metric-value-large">{metrics.totalTime}<span className="unit">ms</span></div>
                  </div>

                  <div className="metrics-section">
                    <div className="metric-label">Results Found</div>
                    <div className="metric-value-large">{metrics.resultCount}<span className="unit"> records</span></div>
                  </div>

                  <div className="metrics-divider"></div>

                  <div className="metrics-section">
                    <div className="metric-label">Execution Breakdown</div>
                    <div className="metric-breakdown">
                      <div className="breakdown-row">
                        <span className="breakdown-label">Database Query</span>
                        <span className="breakdown-value">{metrics.dbTime}</span>
                      </div>
                      <div className="breakdown-row">
                        <span className="breakdown-label">Network + Processing*</span>
                        <span className="breakdown-value">{metrics.networkTime}ms</span>
                      </div>
                    </div>
                    <div className="metric-note">*Includes network latency, JSON parsing, and React rendering</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }

      return contentElement;
    }

    return <pre className="json-output">{JSON.stringify(data, null, 2)}</pre>;
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`chat-message ${isUser ? 'user-message' : 'bot-message'} ${type || ''}`}>
      {!isUser && (
        <div className="message-avatar bot-avatar">
          <span>🤖</span>
        </div>
      )}
      <div className="message-wrapper">
        <div className="message-content">
          {formatMessage(message)}
        </div>
        {timestamp && (
          <div className="message-timestamp">{formatTime(timestamp)}</div>
        )}
      </div>
      {isUser && (
        <div className="message-avatar user-avatar">
          <span>👤</span>
        </div>
      )}
    </div>
  );
});

ChatMessage.displayName = 'ChatMessage';

export default ChatMessage;
