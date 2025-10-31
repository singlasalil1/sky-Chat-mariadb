import React from 'react';
import '../styles/SmartSuggestions.css';

const fallbackPrompts = [
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
];

const SmartSuggestions = ({ onSelectQuery = () => {}, prompts }) => {
  const availablePrompts = Array.isArray(prompts) && prompts.length > 0 ? prompts : fallbackPrompts;

  const formatToneClass = (tone) => {
    if (!tone) return '';
    return `tone-${tone.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  };

  return (
    <div className="smart-suggestions-container">
      <div className="suggestions-header">
        <div className="suggestions-heading">
          <span className="sparkle">✨</span>
          Starter prompts
        </div>
        <p className="suggestions-subtext">
          Pick a card to auto-fill the chat or type your own question.
        </p>
      </div>

      <div className="prompts-grid">
        {availablePrompts.map(({ id, icon, title, description, prompt, tone }) => {
          const toneClass = formatToneClass(tone);
          const key = id || prompt;

          return (
            <button
              key={key}
              type="button"
              className="prompt-card"
              onClick={() => onSelectQuery(prompt)}
            >
              <div className="prompt-top">
                <div className="prompt-icon">{icon || '💬'}</div>
                <div className="prompt-info">
                  <div className="prompt-title-row">
                    <span className="prompt-label">{title}</span>
                    {tone && (
                      <span className={`prompt-badge ${toneClass}`}>
                        {tone}
                      </span>
                    )}
                  </div>
                  {description && (
                    <p className="prompt-description">{description}</p>
                  )}
                </div>
              </div>
              <span className="prompt-example">“{prompt}”</span>
            </button>
          );
        })}
      </div>

      <div className="prompt-footer">
        Tip: Shift + Enter adds a newline. SkyChat keeps context across messages.
      </div>
    </div>
  );
};

export default SmartSuggestions;
