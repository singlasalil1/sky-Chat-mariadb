import React, { memo } from 'react';
import '../styles/ChatMessage.css';

const ChatMessage = memo(({ message, isUser, type, timestamp, metrics }) => {
  const formatMessage = (data) => {
    if (typeof data === 'string') {
      if (type === 'welcome') {
        return (
          <div className="welcome-message">
            <h3>👋 {data}</h3>
            <p>I can help you with:</p>
            <ul className="capability-list">
              <li>🛫 <strong>Route lookups:</strong> Surface nonstop and connecting flights between airports.</li>
              <li>🤖 <strong>AI insights:</strong> Ask about hubs, alliances, or regional market trends.</li>
              <li>📊 <strong>Analytics:</strong> Compare airports, airlines, and long-haul route performance.</li>
            </ul>
            <div style={{ marginTop: '1rem', padding: '1rem', background: 'linear-gradient(135deg, #667eea20 0%, #764ba220 100%)', borderRadius: '8px', borderLeft: '3px solid #667eea' }}>
              <strong>💡 Try asking:</strong><br/>
              <span style={{ color: '#4a5568', fontSize: '0.9rem' }}>
                "Find flights from JFK to LAX" or "Which airports are the major hubs in Europe?"
              </span>
            </div>
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

    // Handle RAG responses
    if (data.type === 'rag_response') {
      // Deduplicate sources by title
      const deduplicatedDocs = data.data?.context_documents
        ? data.data.context_documents.filter((doc, index, self) =>
            index === self.findIndex(d => d.title === doc.title)
          )
        : [];

      const getDocTypeColor = (docType) => {
        const colors = {
          'airport': '#3b82f6',
          'airline': '#10b981',
          'route': '#f59e0b',
          'hub': '#8b5cf6',
          'default': '#6366f1'
        };
        return colors[docType?.toLowerCase()] || colors.default;
      };

      const getSimilarityColor = (similarity) => {
        const score = similarity * 100;
        if (score >= 80) return '#10b981'; // Green
        if (score >= 60) return '#3b82f6'; // Blue
        if (score >= 40) return '#f59e0b'; // Orange
        return '#ef4444'; // Red
      };

      return (
        <div className="rag-response">
          <div className="rag-header">
            <span className="rag-icon">🤖</span>
            <span className="rag-badge">AI-Powered</span>
          </div>
          <div className="rag-content">
            <p className="rag-message">{data.data?.message || data.message}</p>
          </div>
          {deduplicatedDocs.length > 0 && (
            <div className="rag-sources">
              <div className="sources-header">
                <span className="sources-icon">📚</span>
                <span className="sources-title">
                  Knowledge Sources
                  <span className="sources-count">{deduplicatedDocs.length}</span>
                </span>
              </div>
              <div className="sources-list">
                {deduplicatedDocs.map((doc, index) => {
                  const similarityScore = (doc.similarity * 100).toFixed(1);
                  return (
                    <div key={index} className="source-item">
                      <div className="source-header">
                        <span className="source-number">{index + 1}</span>
                        <span
                          className="doc-type-badge"
                          style={{ backgroundColor: getDocTypeColor(doc.doc_type) }}
                        >
                          {doc.doc_type || 'document'}
                        </span>
                      </div>
                      <div className="source-body">
                        <span className="source-title">{doc.title}</span>
                        <div className="similarity-indicator">
                          <div className="similarity-bar-container">
                            <div
                              className="similarity-bar-fill"
                              style={{
                                width: `${similarityScore}%`,
                                backgroundColor: getSimilarityColor(doc.similarity)
                              }}
                            ></div>
                          </div>
                          <span
                            className="similarity-score"
                            style={{ color: getSimilarityColor(doc.similarity) }}
                          >
                            {similarityScore}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      );
    }

    if (data.message && data.data && Array.isArray(data.data)) {
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
      <div className="message-wrapper">
        <div className="message-content">
          {!isUser && metrics && metrics.totalTime && (
            <div className="response-time-badge">
              <span className="response-time-icon">⚡</span>
              <span className="response-time-value">{metrics.totalTime}ms</span>
            </div>
          )}
          {formatMessage(message)}
        </div>
        {timestamp && (
          <div className="message-timestamp">{formatTime(timestamp)}</div>
        )}
      </div>
    </div>
  );
});

ChatMessage.displayName = 'ChatMessage';

export default ChatMessage;
