import React from 'react';
import '../styles/CaseCard.css';

const CaseCard = ({ caseData, isSolved, onSelect }) => {
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return 'difficulty-easy';
      case 'medium':
        return 'difficulty-medium';
      case 'hard':
        return 'difficulty-hard';
      default:
        return '';
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
    <div
      className={`case-card ${isSolved ? 'solved' : ''}`}
      onClick={() => onSelect(caseData)}
    >
      {isSolved && (
        <div className="solved-badge">
          <span className="badge-icon">✓</span>
          Solved
        </div>
      )}

      <div className="case-header">
        <div className="case-number">Case #{caseData.id.split('-')[1]}</div>
        <div className={`case-difficulty ${getDifficultyColor(caseData.difficulty)}`}>
          {getDifficultyStars(caseData.difficulty)}
        </div>
      </div>

      <h3 className="case-title">{caseData.title}</h3>

      <div className="case-category">
        <span className="category-icon">📂</span>
        {caseData.category}
      </div>

      <p className="case-description">{caseData.description}</p>

      <div className="case-footer">
        <div className="clue-count">
          <span className="clue-icon">🔍</span>
          {caseData.clues.length} Clues
        </div>
        <button className="investigate-btn">
          Investigate →
        </button>
      </div>
    </div>
  );
};

export default CaseCard;
