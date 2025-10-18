import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import ChatMessage from '../components/ChatMessage';
import NetworkViewer from '../components/NetworkViewer';
import AIThinkingProcess from '../components/AIThinkingProcess';
import SmartSuggestions from '../components/SmartSuggestions';
import PerformanceMetrics from '../components/PerformanceMetrics';
import { sendChatMessage } from '../services/api';
import '../styles/Chat.css';

const Chat = () => {
  const [messages, setMessages] = useState([
    {
      text: "Welcome to SkyChat Adventures! I'm your flight intelligence companion. Ask me anything about flights, airports, or try our detective mysteries!",
      type: 'welcome',
      isUser: false,
      id: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState('chat'); // 'chat' or 'network'
  const [showAIProcess, setShowAIProcess] = useState(false);
  const [aiStage, setAiStage] = useState('understanding');
  const [queryMetrics, setQueryMetrics] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
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

  const getRelevantQuestions = useCallback(() => {
    const lastMessage = messages[messages.length - 1];

    if (messages.length === 1) {
      return [
        'Show me the busiest routes',
        'What are the longest flights?',
        'Find flights from JFK to LAX',
        'Show major hub airports'
      ];
    }

    if (lastMessage && !lastMessage.isUser && lastMessage.text?.type === 'direct_routes') {
      return [
        'Show routes with connections',
        'What are alternative airlines?',
        'Show me the distance',
        'Find nearby airports'
      ];
    }

    if (lastMessage && !lastMessage.isUser && lastMessage.text?.type === 'airport_search') {
      return [
        'Show routes from this airport',
        'Find nearby airports',
        'Which airlines serve here?',
        'Show connection hubs'
      ];
    }

    return [
      'Show busiest routes',
      'Find hub airports',
      'Search for airports',
      'Show longest flights'
    ];
  }, [messages]);

  const relevantQuestions = getRelevantQuestions();

  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    const messageId = Date.now();
    const startTime = Date.now();

    setInput('');
    setShowSuggestions(false);
    setMessages(prev => [...prev, {
      text: userMessage,
      isUser: true,
      id: messageId,
      timestamp: new Date().toISOString()
    }]);
    setIsLoading(true);
    setShowAIProcess(true);

    // Simulate AI processing stages
    setAiStage('understanding');
    await new Promise(resolve => setTimeout(resolve, 500));

    setAiStage('vector');
    await new Promise(resolve => setTimeout(resolve, 600));

    setAiStage('analytics');
    await new Promise(resolve => setTimeout(resolve, 400));

    setAiStage('generation');

    try {
      const response = await sendChatMessage(userMessage);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Always create metrics data for every response
      const backendMetrics = response.metrics || {};
      const dbTime = backendMetrics.db_time || totalTime - 50; // Estimate if not provided
      const resultCount = backendMetrics.result_count || (response.result?.data?.length || 0);
      const postgresTime = backendMetrics.postgres_time || 0;
      const speedup = backendMetrics.speedup || 0;
      const networkTime = totalTime - dbTime; // Frontend overhead + network

      const metricsData = {
        totalTime: totalTime,
        dbTime: `${dbTime}ms`,
        networkTime: `${networkTime}ms`,
        postgresTotal: postgresTime ? `${postgresTime}ms` : 'N/A',
        speedup: speedup ? `${speedup}x` : 'N/A',
        resultCount: resultCount,
        query: userMessage
      };

      setQueryMetrics(metricsData);

      setMessages(prev => [...prev, {
        text: response.result,
        isUser: false,
        id: messageId + 1,
        timestamp: new Date().toISOString(),
        metrics: metricsData
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
      setShowAIProcess(false);
      setAiStage('understanding');
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

  const handleSmartQuerySelect = useCallback((query) => {
    setInput(query);
    setShowSuggestions(false);
    // Auto-submit the query
    setTimeout(() => {
      const messageId = Date.now();
      const startTime = Date.now();

      setMessages(prev => [...prev, {
        text: query,
        isUser: true,
        id: messageId,
        timestamp: new Date().toISOString()
      }]);
      setInput('');
      setIsLoading(true);
      setShowAIProcess(true);

      // Simulate AI processing stages
      const processQuery = async () => {
        setAiStage('understanding');
        await new Promise(resolve => setTimeout(resolve, 500));

        setAiStage('vector');
        await new Promise(resolve => setTimeout(resolve, 600));

        setAiStage('analytics');
        await new Promise(resolve => setTimeout(resolve, 400));

        setAiStage('generation');

        try {
          const response = await sendChatMessage(query);
          const endTime = Date.now();
          const totalTime = endTime - startTime;

          // Always create metrics data for every response
          const backendMetrics = response.metrics || {};
          const dbTime = backendMetrics.db_time || totalTime - 50; // Estimate if not provided
          const resultCount = backendMetrics.result_count || (response.result?.data?.length || 0);
          const postgresTime = backendMetrics.postgres_time || 0;
          const speedup = backendMetrics.speedup || 0;
          const networkTime = totalTime - dbTime;

          const metricsData = {
            totalTime: totalTime,
            dbTime: `${dbTime}ms`,
            networkTime: `${networkTime}ms`,
            postgresTotal: postgresTime ? `${postgresTime}ms` : 'N/A',
            speedup: speedup ? `${speedup}x` : 'N/A',
            resultCount: resultCount,
            query: query
          };

          setQueryMetrics(metricsData);

          setMessages(prev => [...prev, {
            text: response.result,
            isUser: false,
            id: messageId + 1,
            timestamp: new Date().toISOString(),
            metrics: metricsData
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
          setShowAIProcess(false);
          setAiStage('understanding');
        }
      };

      processQuery();
    }, 100);
  }, []);

  return (
    <div className="chat-page">
      <div className="app-header">
        <div className="header-brand">
          <span className="brand-icon">✈️</span>
          <span className="brand-name">SkyChat <span className="brand-adventures">Adventures</span></span>
        </div>
        <div className="header-actions">
          <div className="view-switcher">
            <button
              className={`view-btn ${viewMode === 'chat' ? 'active' : ''}`}
              onClick={() => setViewMode('chat')}
            >
              💬 Chat
            </button>
            <button
              className={`view-btn ${viewMode === 'network' ? 'active' : ''}`}
              onClick={() => setViewMode('network')}
            >
              🌐 Network
            </button>
          </div>
        </div>
      </div>

      <>
        <div className="chat-layout">
          <div className="chat-main-section">

            {viewMode === 'chat' ? (
              <div className="chat-content-area">
                <div className="chat-messages" ref={chatMessagesRef}>
            {messages.map((msg, index) => (
              <ChatMessage
                key={msg.id}
                message={msg.text}
                isUser={msg.isUser}
                type={msg.type}
                timestamp={msg.timestamp}
                metrics={msg.metrics}
              />
            ))}

            {messages.length === 1 && !isLoading && showSuggestions && (
              <SmartSuggestions onSelectQuery={handleSmartQuerySelect} />
            )}

            {messages.length > 1 && !isLoading && showSuggestions && (
              <SmartSuggestions onSelectQuery={handleSmartQuerySelect} />
            )}

            {messages.length > 1 && !isLoading && !showSuggestions && (
              <button
                className="show-suggestions-btn"
                onClick={() => setShowSuggestions(true)}
              >
                📋 Show Example Queries
              </button>
            )}

            {isLoading && showAIProcess && (
              <AIThinkingProcess
                stage={aiStage}
                stats={queryMetrics || {}}
              />
            )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="chat-input-bar">
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
            ) : (
              <NetworkViewer />
            )}
          </div>
        </div>
      </>
    </div>
  );
};

export default Chat;
