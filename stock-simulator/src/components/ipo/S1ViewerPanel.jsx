/**
 * S1ViewerPanel - IPO Prospectus Analysis Mini-Game
 * 
 * Features:
 * - Display simulated S-1 filing excerpts
 * - Highlight key risk factors
 * - Interactive quiz to identify risks
 * - Score tracking for due diligence skills
 * 
 * Educational Purpose: Teaches how to read and analyze IPO prospectuses,
 * identify red flags, and make informed investment decisions.
 */

import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  HelpCircle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Building,
  Scale,
  Award,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useIPOStore } from '../../stores/ipoStore';
import { calculateRiskScore } from '../../utils/ipoAllocation';

// Risk factor categories for the mini-game
const RISK_CATEGORIES = {
  profitability: { label: 'Profitability', icon: TrendingDown, color: 'text-loss' },
  concentration: { label: 'Customer Concentration', icon: Users, color: 'text-yellow-500' },
  competition: { label: 'Competition', icon: Building, color: 'text-terminal-accent' },
  regulatory: { label: 'Regulatory', icon: Scale, color: 'text-purple-400' },
  dilution: { label: 'Dilution Risk', icon: TrendingDown, color: 'text-orange-400' },
  execution: { label: 'Execution Risk', icon: AlertTriangle, color: 'text-yellow-500' },
  supply_chain: { label: 'Supply Chain', icon: Building, color: 'text-terminal-muted' }
};

export function S1ViewerPanel() {
  const { selectedIPO, ipoCalendar, analysisScores, recordAnalysisScore } = useIPOStore();
  const [activeSection, setActiveSection] = useState('overview');
  const [quizAnswers, setQuizAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);

  const ipo = useMemo(() => 
    ipoCalendar.find(i => i.id === selectedIPO), 
    [ipoCalendar, selectedIPO]
  );

  const existingScore = selectedIPO ? analysisScores[selectedIPO] : null;
  const riskScore = ipo ? calculateRiskScore(ipo) : 0;

  if (!ipo) {
    return (
      <div className="h-full flex flex-col">
        <div className="terminal-header drag-handle cursor-move">
          <div className="flex items-center gap-2">
            <FileText className="w-3 h-3" />
            <span>S-1 Prospectus</span>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center text-terminal-muted">
          <div className="text-center">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Select an IPO to view its prospectus</p>
            <p className="text-xs mt-1">Click on an IPO in the calendar</p>
          </div>
        </div>
      </div>
    );
  }

  const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'financials', label: 'Financials' },
    { id: 'risks', label: 'Risk Factors' },
    { id: 'quiz', label: 'Analysis Quiz' }
  ];

  const handleQuizAnswer = (riskIndex, category) => {
    setQuizAnswers(prev => ({
      ...prev,
      [riskIndex]: category
    }));
  };

  const submitQuiz = () => {
    if (!ipo.riskFactors) return;

    let correct = 0;
    ipo.riskFactors.forEach((risk, index) => {
      if (quizAnswers[index] === risk.category) {
        correct++;
      }
    });

    const score = Math.round((correct / ipo.riskFactors.length) * 100);
    recordAnalysisScore(ipo.id, score, correct, ipo.riskFactors.length);
    setShowResults(true);
  };

  const resetQuiz = () => {
    setQuizAnswers({});
    setShowResults(false);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Panel Header */}
      <div className="terminal-header drag-handle cursor-move">
        <div className="flex items-center gap-2">
          <FileText className="w-3 h-3" />
          <span>S-1 Prospectus</span>
        </div>
        <span className="font-mono text-terminal-text">{ipo.ticker}</span>
      </div>

      {/* Company Title Bar */}
      <div className="px-3 py-2 bg-terminal-bg border-b border-terminal-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-terminal-text">{ipo.company}</h3>
            <p className="text-xs text-terminal-muted">{ipo.sector}</p>
          </div>
          <div className="flex items-center gap-2">
            <RiskBadge score={riskScore} />
            {existingScore && (
              <span className="px-2 py-1 bg-gain/20 rounded text-xs text-gain flex items-center gap-1">
                <Award className="w-3 h-3" />
                {existingScore.score}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex border-b border-terminal-border">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
              activeSection === section.id
                ? 'text-terminal-accent border-b-2 border-terminal-accent'
                : 'text-terminal-muted hover:text-terminal-text'
            }`}
          >
            {section.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-3">
        {activeSection === 'overview' && <OverviewSection ipo={ipo} />}
        {activeSection === 'financials' && <FinancialsSection ipo={ipo} />}
        {activeSection === 'risks' && <RisksSection ipo={ipo} />}
        {activeSection === 'quiz' && (
          <QuizSection 
            ipo={ipo}
            answers={quizAnswers}
            onAnswer={handleQuizAnswer}
            onSubmit={submitQuiz}
            onReset={resetQuiz}
            showResults={showResults}
            existingScore={existingScore}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Risk Score Badge
 */
function RiskBadge({ score }) {
  let color, label;
  if (score >= 75) {
    color = 'bg-loss/20 text-loss';
    label = 'High Risk';
  } else if (score >= 50) {
    color = 'bg-yellow-500/20 text-yellow-500';
    label = 'Medium Risk';
  } else {
    color = 'bg-gain/20 text-gain';
    label = 'Lower Risk';
  }

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${color}`}>
      {label} ({score})
    </span>
  );
}

/**
 * Overview Section
 */
function OverviewSection({ ipo }) {
  return (
    <div className="space-y-4">
      {/* Deal Summary */}
      <div className="p-3 bg-terminal-bg rounded border border-terminal-border">
        <h4 className="text-xs text-terminal-muted uppercase tracking-wider mb-3">
          Deal Summary
        </h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-terminal-muted">Price Range:</span>
            <span className="ml-2 font-mono text-terminal-text">
              ${ipo.priceRange.low} - ${ipo.priceRange.high}
            </span>
          </div>
          <div>
            <span className="text-terminal-muted">Shares Offered:</span>
            <span className="ml-2 font-mono text-terminal-text">
              {(ipo.sharesOffered / 1e6).toFixed(1)}M
            </span>
          </div>
          <div>
            <span className="text-terminal-muted">Expected Date:</span>
            <span className="ml-2 text-terminal-text">
              {new Date(ipo.expectedDate).toLocaleDateString()}
            </span>
          </div>
          <div>
            <span className="text-terminal-muted">Deal Size:</span>
            <span className="ml-2 font-mono text-terminal-text">
              ${((ipo.priceRange.low + ipo.priceRange.high) / 2 * ipo.sharesOffered / 1e6).toFixed(0)}M
            </span>
          </div>
        </div>
      </div>

      {/* Use of Proceeds */}
      <div className="p-3 bg-terminal-bg rounded border border-terminal-border">
        <h4 className="text-xs text-terminal-muted uppercase tracking-wider mb-2">
          Use of Proceeds
        </h4>
        <p className="text-sm text-terminal-text">{ipo.useOfProceeds}</p>
      </div>

      {/* Business Description */}
      {ipo.businessDescription && (
        <div className="p-3 bg-terminal-bg rounded border border-terminal-border">
          <h4 className="text-xs text-terminal-muted uppercase tracking-wider mb-2">
            Business Description
          </h4>
          <p className="text-sm text-terminal-text">{ipo.businessDescription}</p>
        </div>
      )}
    </div>
  );
}

/**
 * Financials Section
 */
function FinancialsSection({ ipo }) {
  const { financials } = ipo;
  if (!financials) return <p className="text-terminal-muted">No financial data available.</p>;

  const metrics = [
    { 
      label: 'Revenue', 
      value: financials.revenue, 
      format: 'currency',
      icon: DollarSign
    },
    { 
      label: 'Revenue Growth', 
      value: financials.revenueGrowth, 
      format: 'percent',
      icon: TrendingUp,
      highlight: financials.revenueGrowth > 0.5
    },
    { 
      label: 'Gross Margin', 
      value: financials.grossMargin, 
      format: 'percent',
      icon: TrendingUp
    },
    { 
      label: 'Net Income', 
      value: financials.netLoss || financials.netIncome, 
      format: 'currency',
      icon: financials.netLoss < 0 ? TrendingDown : TrendingUp,
      negative: (financials.netLoss || 0) < 0
    },
    { 
      label: 'Cash Position', 
      value: financials.cashPosition, 
      format: 'currency',
      icon: DollarSign
    },
    { 
      label: 'Monthly Burn Rate', 
      value: financials.burnRate, 
      format: 'currency',
      icon: TrendingDown,
      negative: true
    }
  ];

  // Calculate runway
  const runway = financials.cashPosition && financials.burnRate 
    ? Math.floor(financials.cashPosition / financials.burnRate)
    : null;

  return (
    <div className="space-y-4">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((metric, i) => (
          <div key={i} className="p-3 bg-terminal-bg rounded border border-terminal-border">
            <div className="flex items-center gap-2 mb-1">
              <metric.icon className={`w-3 h-3 ${metric.negative ? 'text-loss' : 'text-terminal-muted'}`} />
              <span className="text-xs text-terminal-muted">{metric.label}</span>
            </div>
            <div className={`text-lg font-mono ${
              metric.negative ? 'text-loss' : 
              metric.highlight ? 'text-gain' : 'text-terminal-text'
            }`}>
              {formatMetric(metric.value, metric.format)}
            </div>
          </div>
        ))}
      </div>

      {/* Runway Warning */}
      {runway !== null && runway < 24 && (
        <div className={`p-3 rounded border flex items-start gap-2 ${
          runway < 12 
            ? 'bg-loss/10 border-loss/30 text-loss'
            : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500'
        }`}>
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <strong>Cash Runway Warning:</strong> At current burn rate, the company has 
            approximately {runway} months of runway. Additional capital may be needed.
          </div>
        </div>
      )}

      {/* Educational Note */}
      <div className="p-3 bg-terminal-accent/10 border border-terminal-accent/30 rounded">
        <div className="text-xs text-terminal-accent font-medium mb-1">
          💡 Due Diligence Tip
        </div>
        <div className="text-xs text-terminal-text">
          High revenue growth with persistent losses is common in growth-stage companies. 
          Evaluate the path to profitability and compare gross margins to industry peers.
        </div>
      </div>
    </div>
  );
}

/**
 * Risk Factors Section
 */
function RisksSection({ ipo }) {
  const [expandedRisk, setExpandedRisk] = useState(null);
  const { riskFactors } = ipo;

  if (!riskFactors || riskFactors.length === 0) {
    return <p className="text-terminal-muted">No risk factors documented.</p>;
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-terminal-muted">
        The following risk factors were identified in the S-1 filing. Click to expand.
      </p>

      {riskFactors.map((risk, index) => {
        const category = RISK_CATEGORIES[risk.category] || RISK_CATEGORIES.execution;
        const isExpanded = expandedRisk === index;

        return (
          <div 
            key={index}
            className="bg-terminal-bg rounded border border-terminal-border overflow-hidden"
          >
            <button
              onClick={() => setExpandedRisk(isExpanded ? null : index)}
              className="w-full px-3 py-2 flex items-center justify-between hover:bg-terminal-border/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <category.icon className={`w-4 h-4 ${category.color}`} />
                <span className="text-sm font-medium text-terminal-text">
                  {category.label}
                </span>
                <span className={`px-1.5 py-0.5 rounded text-xxs ${
                  risk.severity === 'high' 
                    ? 'bg-loss/20 text-loss' 
                    : 'bg-yellow-500/20 text-yellow-500'
                }`}>
                  {risk.severity}
                </span>
              </div>
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-terminal-muted" />
              ) : (
                <ChevronDown className="w-4 h-4 text-terminal-muted" />
              )}
            </button>
            
            {isExpanded && (
              <div className="px-3 pb-3 border-t border-terminal-border pt-2">
                <p className="text-sm text-terminal-text italic">
                  "{risk.text}"
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Quiz Section - Risk Factor Identification Mini-Game
 */
function QuizSection({ ipo, answers, onAnswer, onSubmit, onReset, showResults, existingScore }) {
  const { riskFactors } = ipo;

  if (!riskFactors || riskFactors.length === 0) {
    return <p className="text-terminal-muted">No quiz available for this IPO.</p>;
  }

  const allAnswered = Object.keys(answers).length === riskFactors.length;
  const categoryOptions = Object.entries(RISK_CATEGORIES);

  return (
    <div className="space-y-4">
      {/* Instructions */}
      <div className="p-3 bg-terminal-bg rounded border border-terminal-border">
        <h4 className="text-sm font-medium text-terminal-text mb-1">
          🎯 Risk Factor Analysis Quiz
        </h4>
        <p className="text-xs text-terminal-muted">
          Read each excerpt from the S-1 and identify the primary risk category. 
          This tests your ability to analyze prospectus disclosures.
        </p>
      </div>

      {/* Existing Score */}
      {existingScore && !showResults && (
        <div className="p-3 bg-gain/10 border border-gain/30 rounded">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gain">
              Previous Score: {existingScore.score}% ({existingScore.correctAnswers}/{existingScore.totalQuestions})
            </span>
            <button
              onClick={onReset}
              className="text-xs text-terminal-accent hover:underline"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Quiz Questions */}
      {riskFactors.map((risk, index) => {
        const isCorrect = showResults && answers[index] === risk.category;
        const isWrong = showResults && answers[index] && answers[index] !== risk.category;
        const correctCategory = RISK_CATEGORIES[risk.category];

        return (
          <div 
            key={index}
            className={`p-3 bg-terminal-bg rounded border ${
              isCorrect ? 'border-gain' : isWrong ? 'border-loss' : 'border-terminal-border'
            }`}
          >
            {/* Risk Excerpt */}
            <div className="mb-3">
              <span className="text-xxs text-terminal-muted">EXCERPT {index + 1}:</span>
              <p className="text-sm text-terminal-text italic mt-1">
                "{risk.text}"
              </p>
            </div>

            {/* Category Selection */}
            <div className="grid grid-cols-2 gap-2">
              {categoryOptions.map(([key, cat]) => {
                const isSelected = answers[index] === key;
                const isCorrectAnswer = showResults && key === risk.category;

                return (
                  <button
                    key={key}
                    onClick={() => !showResults && onAnswer(index, key)}
                    disabled={showResults}
                    className={`px-2 py-1.5 text-xs rounded border flex items-center gap-1.5 transition-colors ${
                      isCorrectAnswer
                        ? 'bg-gain/20 border-gain text-gain'
                        : isSelected && isWrong
                        ? 'bg-loss/20 border-loss text-loss'
                        : isSelected
                        ? 'bg-terminal-accent/20 border-terminal-accent text-terminal-accent'
                        : 'border-terminal-border text-terminal-muted hover:border-terminal-muted'
                    } ${showResults ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    <cat.icon className="w-3 h-3" />
                    {cat.label}
                    {isCorrectAnswer && <CheckCircle2 className="w-3 h-3 ml-auto" />}
                    {isSelected && isWrong && <XCircle className="w-3 h-3 ml-auto" />}
                  </button>
                );
              })}
            </div>

            {/* Explanation (shown after results) */}
            {showResults && (
              <div className={`mt-2 p-2 rounded text-xs ${
                isCorrect ? 'bg-gain/10 text-gain' : 'bg-loss/10 text-loss'
              }`}>
                {isCorrect 
                  ? '✓ Correct! This excerpt describes ' + correctCategory.label.toLowerCase() + ' risk.'
                  : `✗ This was a ${correctCategory.label} risk. Look for keywords related to ${correctCategory.label.toLowerCase()}.`
                }
              </div>
            )}
          </div>
        );
      })}

      {/* Submit / Results */}
      {!showResults ? (
        <button
          onClick={onSubmit}
          disabled={!allAnswered}
          className="w-full py-2 bg-terminal-accent text-white font-medium rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {allAnswered ? 'Submit Analysis' : `Answer all ${riskFactors.length} questions`}
        </button>
      ) : (
        <div className="space-y-3">
          <div className="p-4 bg-terminal-bg rounded border border-terminal-border text-center">
            <div className="text-3xl font-mono text-terminal-accent mb-1">
              {existingScore?.score || 0}%
            </div>
            <div className="text-sm text-terminal-muted">
              {existingScore?.correctAnswers || 0} of {riskFactors.length} correct
            </div>
          </div>
          <button
            onClick={onReset}
            className="w-full py-2 border border-terminal-border text-terminal-text font-medium rounded hover:bg-terminal-border transition-colors"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Format metric value
 */
function formatMetric(value, format) {
  if (value === null || value === undefined) return 'N/A';
  
  switch (format) {
    case 'currency':
      if (Math.abs(value) >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
      if (Math.abs(value) >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
      return `$${value.toLocaleString()}`;
    case 'percent':
      return `${(value * 100).toFixed(1)}%`;
    default:
      return value.toLocaleString();
  }
}

export default S1ViewerPanel;
