import React, { useState, useEffect } from 'react';
import '../styles/AIThinkingProcess.css';

const AIThinkingProcess = ({ stage = 'understanding', stats = {} }) => {
  const [currentFactIndex, setCurrentFactIndex] = useState(0);

  const aviationFacts = [
    "✈️ The busiest air route is between Seoul and Jeju with over 180 flights daily",
    "🌍 Singapore Changi Airport has won 'World's Best Airport' 12 times",
    "⚡ The Boeing 787 Dreamliner uses 20% less fuel than similar-sized aircraft",
    "🛫 Dubai International handles over 90 million passengers annually",
    "🌏 The longest non-stop flight is Singapore to New York - 18 hours, 15,345 km",
    "🏢 Hartsfield-Jackson Atlanta is the world's busiest airport by passenger traffic",
    "💨 Modern aircraft cruise at 900 km/h (560 mph) at 35,000 feet",
    "🌐 IATA codes help identify 17,000+ airports worldwide",
    "🔄 Major hub airports can connect you to 200+ destinations globally",
    "📊 Air traffic doubles approximately every 15 years worldwide"
  ];

  const stages = {
    understanding: { text: 'Understanding your query', icon: '🔍', color: '#667eea' },
    vector: { text: 'Searching flight database', icon: '🧮', color: '#764ba2' },
    analytics: { text: 'Analyzing routes & connections', icon: '📊', color: '#f093fb' },
    generation: { text: 'Generating intelligent response', icon: '💡', color: '#4facfe' }
  };

  const currentStage = stages[stage] || stages.understanding;

  useEffect(() => {
    const factInterval = setInterval(() => {
      setCurrentFactIndex((prev) => (prev + 1) % aviationFacts.length);
    }, 3500);

    return () => clearInterval(factInterval);
  }, [aviationFacts.length]);

  return (
    <div className="airline-loader">
      <div className="airplane-animation">
        <div className="flight-path"></div>
        <div className="airplane">✈️</div>
      </div>

      <div className="loading-status">
        <span className="status-icon">{currentStage.icon}</span>
        <span className="status-text">{currentStage.text}</span>
        <span className="loading-dots">
          <span></span><span></span><span></span>
        </span>
      </div>

      <div className="aviation-fact">
        <div className="fact-content" key={currentFactIndex}>
          {aviationFacts[currentFactIndex]}
        </div>
      </div>
    </div>
  );
};

export default AIThinkingProcess;
