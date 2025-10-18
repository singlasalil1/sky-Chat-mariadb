import React, { useState, useCallback } from 'react';
import { cases } from '../data/cases';
import CaseCard from '../components/CaseCard';
import CaseDetails from '../components/CaseDetails';
import '../styles/Adventures.css';

const Adventures = () => {
  const [selectedCase, setSelectedCase] = useState(null);
  const [solvedCases, setSolvedCases] = useState([]);
  const [currentClue, setCurrentClue] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleCaseSelect = useCallback((caseData) => {
    setSelectedCase(caseData);
    setCurrentClue(0);
    setHintsUsed(0);
    setShowResult(false);
    setIsCorrect(false);
  }, []);

  const handleBackToCases = useCallback(() => {
    setSelectedCase(null);
  }, []);

  const handleRevealClue = useCallback(() => {
    if (selectedCase && currentClue < selectedCase.clues.length - 1) {
      setCurrentClue(prev => prev + 1);
      setHintsUsed(prev => prev + 1);
    }
  }, [selectedCase, currentClue]);

  const handleSubmitAnswer = useCallback((answer) => {
    if (!selectedCase) return;

    const correct = answer.toLowerCase().trim() === selectedCase.solution.answer.toLowerCase().trim();
    setIsCorrect(correct);
    setShowResult(true);

    if (correct && !solvedCases.includes(selectedCase.id)) {
      setSolvedCases(prev => [...prev, selectedCase.id]);
    }
  }, [selectedCase, solvedCases]);

  const calculateScore = useCallback(() => {
    if (!selectedCase) return 0;
    const baseScore = 100;
    const hintPenalty = hintsUsed * 10;
    return Math.max(baseScore - hintPenalty, 10);
  }, [selectedCase, hintsUsed]);

  return (
    <div className="adventures-page">
      {!selectedCase ? (
        <>
          <div className="adventures-header">
            <div className="header-content">
              <h1 className="adventures-title">
                <span className="title-icon">🕵️</span>
                Aviation Detective Cases
              </h1>
              <p className="adventures-subtitle">
                Solve mysteries using real flight data. Each case tests your detective skills and aviation knowledge!
              </p>
            </div>
            <div className="stats-panel">
              <div className="stat-item">
                <span className="stat-number">{cases.length}</span>
                <span className="stat-label">Total Cases</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{solvedCases.length}</span>
                <span className="stat-label">Solved</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{Math.round((solvedCases.length / cases.length) * 100)}%</span>
                <span className="stat-label">Completion</span>
              </div>
            </div>
          </div>

          <div className="difficulty-section">
            <h2 className="section-header">
              <span className="header-icon">⭐</span>
              Beginner Cases
            </h2>
            <div className="cases-grid">
              {cases.filter(c => c.difficulty === 'easy').map((caseData) => (
                <CaseCard
                  key={caseData.id}
                  caseData={caseData}
                  isSolved={solvedCases.includes(caseData.id)}
                  onSelect={handleCaseSelect}
                />
              ))}
            </div>
          </div>

          <div className="difficulty-section">
            <h2 className="section-header">
              <span className="header-icon">⭐⭐</span>
              Intermediate Cases
            </h2>
            <div className="cases-grid">
              {cases.filter(c => c.difficulty === 'medium').map((caseData) => (
                <CaseCard
                  key={caseData.id}
                  caseData={caseData}
                  isSolved={solvedCases.includes(caseData.id)}
                  onSelect={handleCaseSelect}
                />
              ))}
            </div>
          </div>

          <div className="difficulty-section">
            <h2 className="section-header">
              <span className="header-icon">⭐⭐⭐</span>
              Expert Cases
            </h2>
            <div className="cases-grid">
              {cases.filter(c => c.difficulty === 'hard').map((caseData) => (
                <CaseCard
                  key={caseData.id}
                  caseData={caseData}
                  isSolved={solvedCases.includes(caseData.id)}
                  onSelect={handleCaseSelect}
                />
              ))}
            </div>
          </div>
        </>
      ) : (
        <CaseDetails
          caseData={selectedCase}
          currentClue={currentClue}
          hintsUsed={hintsUsed}
          showResult={showResult}
          isCorrect={isCorrect}
          score={calculateScore()}
          onBack={handleBackToCases}
          onRevealClue={handleRevealClue}
          onSubmitAnswer={handleSubmitAnswer}
        />
      )}
    </div>
  );
};

export default Adventures;
