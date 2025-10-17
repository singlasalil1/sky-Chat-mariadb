import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import ChatMessage from '../components/ChatMessage';
import { sendChatMessage } from '../services/api';
import '../styles/Chat.css';

const Chat = () => {
  const [messages, setMessages] = useState([
    {
      text: "Hello! I'm your flight intelligence assistant.",
      type: 'welcome',
      isUser: false,
      id: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const chatMessagesRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const suggestions = useMemo(() => [
    'Find flights from JFK to LAX',
    'Search airport London',
    'Show busiest routes',
    'Show longest flights',
    'Routes from SFO',
    'Airlines in USA'
  ], []);

  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    const messageId = Date.now();

    setInput('');
    setMessages(prev => [...prev, {
      text: userMessage,
      isUser: true,
      id: messageId,
      timestamp: new Date().toISOString()
    }]);
    setIsLoading(true);

    try {
      const response = await sendChatMessage(userMessage);
      setMessages(prev => [...prev, {
        text: response.result,
        isUser: false,
        id: messageId + 1,
        timestamp: new Date().toISOString()
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        text: { type: 'error', message: 'Sorry, there was an error processing your request.' },
        isUser: false,
        id: messageId + 1,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const handleSuggestionClick = useCallback((suggestion) => {
    setInput(suggestion);
  }, []);

  return (
    <div className="chat-page">
      <div className="chat-container">
        <div className="chat-header">
          <div className="header-content">
            <h2>✈️ Flight Assistant</h2>
            <p>Ask me anything about flights, airports, or airlines</p>
          </div>
          <div className="header-stats">
            <span className="stat-badge">{messages.length} messages</span>
          </div>
        </div>

        <div className="chat-body">
          <div className="chat-messages" ref={chatMessagesRef}>
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg.text}
                isUser={msg.isUser}
                type={msg.type}
                timestamp={msg.timestamp}
              />
            ))}

            {messages.length === 1 && !isLoading && (
              <div className="quick-actions">
                <h3>Quick Actions</h3>
                <div className="action-grid">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      className="action-card"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <span className="action-icon">
                        {index === 0 ? '🛫' : index === 1 ? '🏢' : index === 2 ? '🔥' : index === 3 ? '🌍' : index === 4 ? '📍' : '✈️'}
                      </span>
                      <span className="action-text">{suggestion}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isLoading && (
              <div className="loading-message">
                <div className="loading-avatar">🤖</div>
                <div className="loading-content">
                  <div className="loading-dots">
                    <span></span><span></span><span></span>
                  </div>
                  <span className="loading-text">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="chat-footer">
          <div className="chat-input-wrapper">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message... (Press Enter to send)"
              disabled={isLoading}
              className="chat-input"
              autoComplete="off"
            />
            <button
              className="send-button"
              onClick={handleSendMessage}
              disabled={isLoading || !input.trim()}
              aria-label="Send message"
            >
              {isLoading ? (
                <span className="button-spinner">⟳</span>
              ) : (
                <span className="button-icon">➤</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
