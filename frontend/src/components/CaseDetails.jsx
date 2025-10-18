import React, { useState } from 'react';
import '../styles/CaseDetails.css';

const CaseDetails = ({
  caseData,
  currentClue,
  hintsUsed,
  showResult,
  isCorrect,
  score,
  onBack,
  onRevealClue,
  onSubmitAnswer
}) => {
  const [userAnswer, setUserAnswer] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (userAnswer.trim()) {
      onSubmitAnswer(userAnswer);
    }
  };

  const getDifficultyStars = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return '⭐';
      case 'medium':
        return '⭐⭐';
      case 'hard':
        return '⭐⭐⭐';
      default:
        return '';
    }
  };

  return (
    <div className="case-details">
      <div className="case-details-header">
        <button className="back-btn" onClick={onBack}>
          ← Back to Cases
        </button>
        <div className="case-meta">
          <span className="case-number">Case #{caseData.id.split('-')[1]}</span>
          <span className="difficulty-badge">{getDifficultyStars(caseData.difficulty)}</span>
        </div>
      </div>

      <div className="case-content">
        <div className="case-info-panel">
          <h1 className="case-title-large">
            <span className="title-icon">🕵️</span>
            {caseData.title}
          </h1>

          <div className="case-category-badge">
            <span className="category-icon">📂</span>
            {caseData.category}
          </div>

          <div className="case-briefing">
            <h3 className="briefing-header">Case Briefing</h3>
            <p className="briefing-text">{caseData.description}</p>
          </div>

          <div className="investigation-stats">
            <div className="stat-box">
              <span className="stat-icon">🔍</span>
              <div className="stat-content">
                <span className="stat-value">{currentClue + 1}/{caseData.clues.length}</span>
                <span className="stat-label">Clues Revealed</span>
              </div>
            </div>
            <div className="stat-box">
              <span className="stat-icon">💡</span>
              <div className="stat-content">
                <span className="stat-value">{hintsUsed}</span>
                <span className="stat-label">Hints Used</span>
              </div>
            </div>
          </div>
        </div>

        <div className="investigation-panel">
          <div className="clues-section">
            <h3 className="section-title">
              <span className="section-icon">📋</span>
              Evidence & Clues
            </h3>

            <div className="clues-list">
              {caseData.clues.slice(0, currentClue + 1).map((clue, index) => (
                <div key={clue.id} className="clue-item">
                  <div className="clue-header">
                    <span className="clue-icon">{clue.icon}</span>
                    <span className="clue-number">Clue {clue.id}</span>
                  </div>
                  <p className="clue-text">{clue.text}</p>
                </div>
              ))}
            </div>

            {currentClue < caseData.clues.length - 1 && !showResult && (
              <button className="reveal-clue-btn" onClick={onRevealClue}>
                <span className="btn-icon">💡</span>
                Reveal Next Clue (-10 points)
              </button>
            )}
          </div>

          <div className="solution-section">
            <h3 className="section-title">
              <span className="section-icon">✍️</span>
              Your Solution
            </h3>

            {!showResult ? (
              <form onSubmit={handleSubmit} className="answer-form">
                <label className="question-label">{caseData.question}</label>
                <input
                  type="text"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Enter your answer..."
                  className="answer-input"
                  disabled={showResult}
                />
                <button type="submit" className="submit-btn" disabled={!userAnswer.trim()}>
                  <span className="btn-icon">🔎</span>
                  Submit Solution
                </button>
              </form>
            ) : (
              <div className={`result-panel ${isCorrect ? 'correct' : 'incorrect'}`}>
                <div className="result-header">
                  <span className="result-icon">{isCorrect ? '🎉' : '❌'}</span>
                  <h2 className="result-title">
                    {isCorrect ? 'Case Solved!' : 'Not Quite Right'}
                  </h2>
                </div>

                {isCorrect && (
                  <div className="score-display">
                    <span className="score-label">Score:</span>
                    <span className="score-value">{score}</span>
                    <span className="score-max">/100</span>
                  </div>
                )}

                <div className="solution-box">
                  <h4 className="solution-header">Correct Answer:</h4>
                  <p className="solution-answer">{caseData.solution.answer}</p>
                </div>

                <div className="explanation-box">
                  <h4 className="explanation-header">Explanation:</h4>
                  <p className="explanation-text">{caseData.solution.explanation}</p>
                </div>

                <div className="fun-fact-box">
                  <h4 className="fun-fact-header">
                    <span className="fact-icon">💡</span>
                    Fun Fact
                  </h4>
                  <p className="fun-fact-text">{caseData.solution.funFact}</p>
                </div>

                <button className="back-to-cases-btn" onClick={onBack}>
                  <span className="btn-icon">🔙</span>
                  Back to All Cases
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseDetails;
