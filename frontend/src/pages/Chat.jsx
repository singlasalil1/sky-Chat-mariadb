import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import ChatMessage from '../components/ChatMessage';
import NetworkViewer from '../components/NetworkViewer';
import AIThinkingProcess from '../components/AIThinkingProcess';
import SmartSuggestions from '../components/SmartSuggestions';
import { sendChatMessage } from '../services/api';
import '../styles/Chat.css';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState('chat'); // 'chat' or 'network'
  const [showAIProcess, setShowAIProcess] = useState(false);
  const [aiStage, setAiStage] = useState('understanding');
  const [queryMetrics, setQueryMetrics] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const defaultRecentQueries = useMemo(() => [
    'Find flights from JFK to LAX',
    'Which airports are the major hubs in Europe and why?',
    'How do airline alliances affect route networks?',
    'What routes connect North America to Australia?'
  ], []);
  const [recentQueries, setRecentQueries] = useState(defaultRecentQueries);
  const messagesEndRef = useRef(null);
  const chatMessagesRef = useRef(null);
  const inputRef = useRef(null);

  const stageStatus = useMemo(() => ({
    understanding: 'Understanding your request',
    vector: 'Retrieving relevant knowledge',
    analytics: 'Analyzing aviation insights',
    generation: 'Crafting your answer'
  }), []);

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const starterPrompts = useMemo(() => [
    {
      id: 'direct-routes',
      icon: '✈️',
      title: 'Plan direct flights',
      description: 'Discover nonstop options and operating airlines between two airports.',
      prompt: 'Find flights from JFK to LAX',
      tone: 'Classic'
    },
    {
      id: 'hub-comparison',
      icon: '🧠',
      title: 'Compare global hubs',
      description: 'See how major airports stack up on routes, capacity, and coverage.',
      prompt: 'Which airports are the major hubs in Europe and why?',
      tone: 'AI Insight'
    },
    {
      id: 'alliance-analytics',
      icon: '🤝',
      title: 'Understand alliances',
      description: 'Break down alliance reach, member carriers, and strategic advantages.',
      prompt: 'How do airline alliances affect route networks?',
      tone: 'Analytics'
    },
    {
      id: 'regional-explorer',
      icon: '🌍',
      title: 'Explore regions',
      description: 'Uncover the airlines and routes connecting continents or corridors.',
      prompt: 'What routes connect North America to Australia?',
      tone: 'Explorer'
    },
    {
      id: 'city-airlines',
      icon: '🛫',
      title: 'Discover city airlines',
      description: 'Find which carriers operate from a specific city or airport.',
      prompt: 'Which airlines operate from Singapore?',
      tone: 'Data'
    },
    {
      id: 'aviation-knowledge',
      icon: '💡',
      title: 'Decode aviation terms',
      description: 'Let SkyChat explain the concepts behind aviation codes and processes.',
      prompt: 'Explain the difference between IATA and ICAO codes.',
      tone: 'AI Insight'
    }
  ], []);

  const updateRecentQueries = useCallback((query) => {
    if (!query) return;

    setRecentQueries(prev => {
      const filtered = prev.filter(item => item.toLowerCase() !== query.toLowerCase());
      return [query, ...filtered].slice(0, 4);
    });
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    const messageId = Date.now();
    const startTime = Date.now();

    setInput('');
    setShowSuggestions(false);
    updateRecentQueries(userMessage);
    setMessages(prev => [...prev, {
      text: userMessage,
      isUser: true,
      id: messageId,
      timestamp: new Date().toISOString()
    }]);
    if (inputRef.current) {
      inputRef.current.style.height = '56px';
    }
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

      // Create metrics data - handle both classic and RAG responses
      const backendMetrics = response.metrics || {};
      let metricsData;

      if (response.result?.type === 'rag_response') {
        // RAG response metrics
        const ragMetrics = response.result.metrics || backendMetrics;
        metricsData = {
          totalTime: ragMetrics.total_time_ms || totalTime,
          dbTime: `${ragMetrics.retrieval_time_ms || 0}ms`,
          networkTime: `${totalTime - (ragMetrics.total_time_ms || 0)}ms`,
          resultCount: ragMetrics.documents_retrieved || 0,
          query: userMessage
        };
      } else {
        // Classic response metrics
        const dbTime = backendMetrics.db_time || totalTime - 50;
        const resultCount = backendMetrics.result_count || (response.result?.data?.length || 0);
        const postgresTime = backendMetrics.postgres_time || 0;
        const speedup = backendMetrics.speedup || 0;
        const networkTime = totalTime - dbTime;

        metricsData = {
          totalTime: totalTime,
          dbTime: `${dbTime}ms`,
          networkTime: `${networkTime}ms`,
          postgresTotal: postgresTime ? `${postgresTime}ms` : 'N/A',
          speedup: speedup ? `${speedup}x` : 'N/A',
          resultCount: resultCount,
          query: userMessage
        };
      }

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

  const handleInputChange = useCallback((event) => {
    const value = event.target.value;
    setInput(value);
    setShowSuggestions(false);

    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      const nextHeight = Math.min(inputRef.current.scrollHeight, 200);
      inputRef.current.style.height = `${Math.max(nextHeight, 56)}px`;
    }
  }, []);

  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const handleSmartQuerySelect = useCallback((query) => {
    setInput(query);
    setShowSuggestions(false);
    updateRecentQueries(query);
    if (inputRef.current) {
      requestAnimationFrame(() => {
        inputRef.current.style.height = 'auto';
        const nextHeight = Math.min(inputRef.current.scrollHeight, 200);
        inputRef.current.style.height = `${Math.max(nextHeight, 56)}px`;
        inputRef.current.focus();
      });
    }
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
      if (inputRef.current) {
        inputRef.current.style.height = '56px';
      }

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

          // Create metrics data - handle both classic and RAG responses
          const backendMetrics = response.metrics || {};
          let metricsData;

          if (response.result?.type === 'rag_response') {
            // RAG response metrics
            const ragMetrics = response.result.metrics || backendMetrics;
            metricsData = {
              totalTime: ragMetrics.total_time_ms || totalTime,
              dbTime: `${ragMetrics.retrieval_time_ms || 0}ms`,
              networkTime: `${totalTime - (ragMetrics.total_time_ms || 0)}ms`,
              resultCount: ragMetrics.documents_retrieved || 0,
              query: query
            };
          } else {
            // Classic response metrics
            const dbTime = backendMetrics.db_time || totalTime - 50;
            const resultCount = backendMetrics.result_count || (response.result?.data?.length || 0);
            const postgresTime = backendMetrics.postgres_time || 0;
            const speedup = backendMetrics.speedup || 0;
            const networkTime = totalTime - dbTime;

            metricsData = {
              totalTime: totalTime,
              dbTime: `${dbTime}ms`,
              networkTime: `${networkTime}ms`,
              postgresTotal: postgresTime ? `${postgresTime}ms` : 'N/A',
              speedup: speedup ? `${speedup}x` : 'N/A',
              resultCount: resultCount,
              query: query
            };
          }

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

  const agentStatus = isLoading ? stageStatus[aiStage] : 'Online • Ask anything about global aviation';

  return (
    <div className="chat-page">
      <div className="chat-background" />
      <div className="chat-container">
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

        <div className="chat-layout">
          <div className="chat-main-section">
            {viewMode === 'chat' ? (
              <div className="chat-content-area">
                <div className="conversation-card">
                  <div className="conversation-header">
                    <div className="conversation-profile">
                      <div className="profile-avatar">🤖</div>
                      <div className="profile-copy">
                        <h1>SkyChat Copilot</h1>
                        <span className={`profile-status ${isLoading ? 'busy' : 'online'}`}>{agentStatus}</span>
                      </div>
                    </div>
                    <div className="conversation-meta">
                      {queryMetrics?.resultCount !== undefined && (
                        <div className="meta-pill">📊 {queryMetrics.resultCount} results</div>
                      )}
                      {queryMetrics?.dbTime && (
                        <div className="meta-pill">⏱️ {queryMetrics.dbTime}</div>
                      )}
                      {isLoading && (
                        <div className="meta-pill ai-stage">{stageStatus[aiStage]}</div>
                      )}
                    </div>
                  </div>

                  <div className="conversation-body" ref={chatMessagesRef}>
                    {messages.map((msg) => (
                      <ChatMessage
                        key={msg.id}
                        message={msg.text}
                        isUser={msg.isUser}
                        type={msg.type}
                        timestamp={msg.timestamp}
                        metrics={msg.metrics}
                      />
                    ))}

                    {!isLoading && showSuggestions && (
                      <div className="suggestion-panel">
                        <SmartSuggestions
                          prompts={starterPrompts}
                          onSelectQuery={handleSmartQuerySelect}
                        />
                      </div>
                    )}

                    {!isLoading && !showSuggestions && messages.length > 1 && (
                      <button
                        className="show-suggestions-btn"
                        onClick={() => setShowSuggestions(true)}
                      >
                        ✨ Show Starter Prompts
                      </button>
                    )}

                    {isLoading && showAIProcess && (
                      <div className="thinking-panel">
                        <AIThinkingProcess
                          stage={aiStage}
                          stats={queryMetrics || {}}
                        />
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="conversation-footer">
                    {/* <div className="quick-questions">
                      {recentQueries.map((question, index) => (
                        <button
                          key={`${question}-${index}`}
                          className="quick-question-chip"
                          onClick={() => handleSmartQuerySelect(question)}
                          type="button"
                          disabled={isLoading}
                        >
                          {question}
                        </button>
                      ))}
                    </div> */}

                    <div className={`chat-input-bar ${isLoading ? 'disabled' : ''}`}>
                      <div className="chat-input-wrapper">
                        <textarea
                          ref={inputRef}
                          value={input}
                          onChange={handleInputChange}
                          onKeyDown={handleKeyDown}
                          placeholder="Ask about flights, routes, airlines or try Shift + Enter for a new line"
                          disabled={isLoading}
                          className="chat-input"
                          rows={1}
                        />
                        <button
                          className="send-button"
                          onClick={handleSendMessage}
                          disabled={isLoading || !input.trim()}
                          aria-label="Send message"
                          type="button"
                        >
                          {isLoading ? (
                            <span className="button-spinner">⟳</span>
                          ) : (
                            <span className="button-icon">➤</span>
                          )}
                        </button>
                      </div>
                      <div className="input-hint">SkyChat understands natural language. Paste data, ask comparisons, or explore aviation networks.</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <NetworkViewer />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
