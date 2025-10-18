import React from 'react';
import '../styles/AIThinkingProcess.css';

const AIThinkingProcess = ({ stage = 'understanding', stats = {} }) => {
  const stages = [
    {
      id: 'understanding',
      icon: '🔍',
      title: 'Understanding query intent',
      description: stats.intent || 'Analyzing natural language...',
      color: '#6366f1'
    },
    {
      id: 'vector',
      icon: '🧮',
      title: 'Vector similarity search',
      description: stats.vectorMatch ? `Found ${stats.vectorMatch} relevant routes` : 'Searching 67,000+ vectors...',
      time: stats.vectorTime || '47ms',
      color: '#8b5cf6'
    },
    {
      id: 'analytics',
      icon: '📊',
      title: 'ColumnStore analytics',
      description: stats.analytics || 'Filtering and ranking results...',
      time: stats.analyticsTime || '123ms',
      color: '#ec4899'
    },
    {
      id: 'generation',
      icon: '💡',
      title: 'Generating response',
      description: stats.model || 'Processing with Llama 3.2...',
      time: stats.generationTime || '289ms',
      color: '#f59e0b'
    }
  ];

  const getCurrentStageIndex = () => {
    return stages.findIndex(s => s.id === stage);
  };

  const currentIndex = getCurrentStageIndex();

  return (
    <div className="ai-thinking-container">
      <div className="thinking-header">
        <div className="thinking-title">
          <span className="brain-icon">🧠</span>
          <span>AI Processing</span>
        </div>
        {stats.totalTime && (
          <div className="total-time">
            <span className="time-label">Total:</span>
            <span className="time-value">{stats.totalTime}ms</span>
          </div>
        )}
      </div>

      <div className="thinking-stages">
        {stages.map((stageData, index) => {
          const isActive = index === currentIndex;
          const isCompleted = index < currentIndex;
          const isPending = index > currentIndex;

          return (
            <div
              key={stageData.id}
              className={`thinking-stage ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${isPending ? 'pending' : ''}`}
            >
              <div className="stage-indicator">
                <div
                  className="stage-icon"
                  style={{ backgroundColor: stageData.color }}
                >
                  {isCompleted ? '✓' : stageData.icon}
                </div>
                <div className={`stage-connector ${isCompleted ? 'completed' : ''}`}></div>
              </div>

              <div className="stage-content">
                <div className="stage-header">
                  <h4 className="stage-title">{stageData.title}</h4>
                  {stageData.time && (isActive || isCompleted) && (
                    <span className="stage-time">{stageData.time}</span>
                  )}
                </div>
                <p className="stage-description">
                  {isActive && <span className="loading-dots">
                    <span></span><span></span><span></span>
                  </span>}
                  {stageData.description}
                </p>
                {isActive && stats.confidence && (
                  <div className="confidence-bar">
                    <div className="confidence-label">
                      <span>Semantic match:</span>
                      <span className="confidence-value">{stats.confidence}%</span>
                    </div>
                    <div className="confidence-track">
                      <div
                        className="confidence-fill"
                        style={{
                          width: `${stats.confidence}%`,
                          backgroundColor: stageData.color
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {stats.totalTime && (
        <div className="thinking-footer">
          <div className="performance-stat">
            <span className="stat-icon">⚡</span>
            <span className="stat-text">Sub-500ms response</span>
          </div>
          <div className="performance-stat">
            <span className="stat-icon">🔒</span>
            <span className="stat-text">On-premise (Private)</span>
          </div>
          <div className="performance-stat">
            <span className="stat-icon">💰</span>
            <span className="stat-text">90% cost savings</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIThinkingProcess;
