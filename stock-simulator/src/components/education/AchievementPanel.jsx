/**
 * AchievementPanel - Player progression and achievement tracking
 * 
 * Features:
 * - Visual achievement tree
 * - Progress tracking across all game systems
 * - Unlock notifications
 * - Educational milestone rewards
 * 
 * Educational Purpose: Gamifies learning, encourages exploration of all features
 */

import React, { useState, useMemo } from 'react';
import {
  Trophy,
  Star,
  Lock,
  CheckCircle,
  TrendingUp,
  Landmark,
  Receipt,
  Target,
  Award,
  Zap,
  Shield,
  BookOpen,
  Clock,
  DollarSign
} from 'lucide-react';
import { usePlayerStore } from '../../stores/playerStore';
import { useIPOStore } from '../../stores/ipoStore';

// Achievement definitions
const ACHIEVEMENT_DEFINITIONS = {
  // Trading achievements
  first_trade: {
    id: 'first_trade',
    title: 'First Steps',
    description: 'Execute your first trade',
    category: 'trading',
    icon: TrendingUp,
    requirement: (state) => state.tradesExecuted >= 1
  },
  active_trader: {
    id: 'active_trader',
    title: 'Active Trader',
    description: 'Execute 25 trades',
    category: 'trading',
    icon: Zap,
    requirement: (state) => state.tradesExecuted >= 25
  },
  limit_master: {
    id: 'limit_master',
    title: 'Limit Master',
    description: 'Unlock and use limit orders',
    category: 'trading',
    icon: Target,
    requirement: (state) => state.unlockedOrderTypes.includes('LIMIT')
  },
  diversified: {
    id: 'diversified',
    title: 'Diversified',
    description: 'Hold 5 different positions simultaneously',
    category: 'trading',
    icon: Star,
    requirement: (state) => Object.keys(state.positions).length >= 5
  },
  
  // IPO achievements
  first_ioi: {
    id: 'first_ioi',
    title: 'IPO Participant',
    description: 'Submit your first Indication of Interest',
    category: 'ipo',
    icon: Landmark,
    requirement: (state) => state.ipoParticipations >= 1
  },
  first_allocation: {
    id: 'first_allocation',
    title: 'Allocation Received',
    description: 'Receive an IPO allocation',
    category: 'ipo',
    icon: Award,
    requirement: (state) => state.ipoAllocationsReceived >= 1
  },
  first_analysis: {
    id: 'first_analysis',
    title: 'Due Diligence',
    description: 'Complete an S-1 prospectus analysis',
    category: 'ipo',
    icon: BookOpen,
    requirement: (state) => state.s1AnalysesCompleted >= 1
  },
  perfect_analysis: {
    id: 'perfect_analysis',
    title: 'Risk Analyst',
    description: 'Score 100% on an S-1 analysis',
    category: 'ipo',
    icon: Shield,
    requirement: (state) => state.achievements.some(a => a.id === 'perfect_analysis')
  },
  
  // Tax achievements
  tax_strategist: {
    id: 'tax_strategist',
    title: 'Tax Strategist',
    description: 'Hold a position for over 1 year (long-term gains)',
    category: 'tax',
    icon: Receipt,
    requirement: (state) => state.realizedGains.longTerm > 0
  },
  wash_sale_survivor: {
    id: 'wash_sale_survivor',
    title: 'Wash Sale Survivor',
    description: 'Learn about wash sales by triggering one',
    category: 'tax',
    icon: Shield,
    requirement: (state) => state.realizedGains.washSaleDisallowed > 0
  },
  
  // Wealth achievements
  first_profit: {
    id: 'first_profit',
    title: 'In the Green',
    description: 'Achieve a positive realized gain',
    category: 'wealth',
    icon: DollarSign,
    requirement: (state) => (state.realizedGains.shortTerm + state.realizedGains.longTerm) > 0
  },
  portfolio_growth: {
    id: 'portfolio_growth',
    title: 'Growing Wealth',
    description: 'Grow your portfolio by 10%',
    category: 'wealth',
    icon: TrendingUp,
    requirement: (state, extra) => {
      const totalValue = state.cash + (extra?.portfolioValue || 0);
      return totalValue >= state.startingCash * 1.10;
    }
  },
  patient_investor: {
    id: 'patient_investor',
    title: 'Patient Investor',
    description: 'Average holding period over 30 days',
    category: 'wealth',
    icon: Clock,
    requirement: () => false // Calculated separately
  }
};

const CATEGORIES = {
  trading: { label: 'Trading', icon: TrendingUp, color: 'text-terminal-accent' },
  ipo: { label: 'IPO', icon: Landmark, color: 'text-purple-400' },
  tax: { label: 'Tax Strategy', icon: Receipt, color: 'text-yellow-500' },
  wealth: { label: 'Wealth Building', icon: DollarSign, color: 'text-gain' }
};

export function AchievementPanel() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const playerState = usePlayerStore();
  const { achievements } = playerState;
  const { analysisScores } = useIPOStore();

  // Calculate which achievements are earned
  const achievementStatus = useMemo(() => {
    const status = {};
    
    for (const [id, def] of Object.entries(ACHIEVEMENT_DEFINITIONS)) {
      const isEarned = achievements.some(a => a.id === id) || 
                       def.requirement(playerState, {});
      status[id] = {
        ...def,
        isEarned,
        earnedAt: achievements.find(a => a.id === id)?.earnedAt
      };
    }
    
    return status;
  }, [achievements, playerState]);

  // Calculate progress stats
  const progressStats = useMemo(() => {
    const total = Object.keys(ACHIEVEMENT_DEFINITIONS).length;
    const earned = Object.values(achievementStatus).filter(a => a.isEarned).length;
    
    const byCategory = {};
    for (const [catId, cat] of Object.entries(CATEGORIES)) {
      const catAchievements = Object.values(achievementStatus).filter(a => a.category === catId);
      byCategory[catId] = {
        total: catAchievements.length,
        earned: catAchievements.filter(a => a.isEarned).length
      };
    }
    
    return { total, earned, percentage: Math.round((earned / total) * 100), byCategory };
  }, [achievementStatus]);

  // Filter achievements
  const filteredAchievements = useMemo(() => {
    return Object.values(achievementStatus).filter(a => 
      selectedCategory === 'all' || a.category === selectedCategory
    );
  }, [achievementStatus, selectedCategory]);

  return (
    <div className="h-full flex flex-col">
      {/* Panel Header */}
      <div className="terminal-header drag-handle cursor-move">
        <div className="flex items-center gap-2">
          <Trophy className="w-3 h-3" />
          <span>Achievements</span>
        </div>
        <span className="text-xxs text-terminal-accent">
          {progressStats.earned}/{progressStats.total}
        </span>
      </div>

      {/* Overall Progress */}
      <div className="p-3 border-b border-terminal-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-terminal-muted">Overall Progress</span>
          <span className="text-xs font-mono text-terminal-accent">
            {progressStats.percentage}%
          </span>
        </div>
        <div className="h-2 bg-terminal-border rounded overflow-hidden">
          <div 
            className="h-full bg-terminal-accent transition-all duration-500"
            style={{ width: `${progressStats.percentage}%` }}
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-1 p-2 border-b border-terminal-border overflow-x-auto">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-2 py-1 text-xs rounded whitespace-nowrap transition-colors ${
            selectedCategory === 'all'
              ? 'bg-terminal-accent text-white'
              : 'text-terminal-muted hover:text-terminal-text'
          }`}
        >
          All ({progressStats.earned})
        </button>
        {Object.entries(CATEGORIES).map(([catId, cat]) => {
          const stats = progressStats.byCategory[catId];
          return (
            <button
              key={catId}
              onClick={() => setSelectedCategory(catId)}
              className={`px-2 py-1 text-xs rounded whitespace-nowrap transition-colors flex items-center gap-1 ${
                selectedCategory === catId
                  ? 'bg-terminal-accent text-white'
                  : 'text-terminal-muted hover:text-terminal-text'
              }`}
            >
              <cat.icon className="w-3 h-3" />
              {cat.label} ({stats.earned}/{stats.total})
            </button>
          );
        })}
      </div>

      {/* Achievement List */}
      <div className="flex-1 overflow-auto p-2">
        <div className="grid gap-2">
          {filteredAchievements.map((achievement) => (
            <AchievementCard key={achievement.id} achievement={achievement} />
          ))}
        </div>
      </div>

      {/* Motivational Footer */}
      <div className="p-2 border-t border-terminal-border text-center">
        <p className="text-xxs text-terminal-muted">
          {progressStats.percentage < 25 && "You're just getting started! Keep exploring."}
          {progressStats.percentage >= 25 && progressStats.percentage < 50 && "Making progress! Try the IPO market next."}
          {progressStats.percentage >= 50 && progressStats.percentage < 75 && "Halfway there! Don't forget about tax strategy."}
          {progressStats.percentage >= 75 && progressStats.percentage < 100 && "Almost a Terminal Master! Just a few more to go."}
          {progressStats.percentage === 100 && "🎉 Congratulations! You've mastered the Terminal!"}
        </p>
      </div>
    </div>
  );
}

/**
 * Individual Achievement Card
 */
function AchievementCard({ achievement }) {
  const { isEarned, title, description, icon: Icon, category, earnedAt } = achievement;
  const categoryInfo = CATEGORIES[category];

  return (
    <div className={`p-3 rounded border transition-all ${
      isEarned 
        ? 'bg-terminal-accent/10 border-terminal-accent/30'
        : 'bg-terminal-bg border-terminal-border opacity-60'
    }`}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`w-10 h-10 rounded flex items-center justify-center ${
          isEarned ? 'bg-terminal-accent/20' : 'bg-terminal-border'
        }`}>
          {isEarned ? (
            <Icon className={`w-5 h-5 ${categoryInfo.color}`} />
          ) : (
            <Lock className="w-5 h-5 text-terminal-muted" />
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`font-medium ${isEarned ? 'text-terminal-text' : 'text-terminal-muted'}`}>
              {title}
            </span>
            {isEarned && (
              <CheckCircle className="w-4 h-4 text-gain" />
            )}
          </div>
          <p className="text-xs text-terminal-muted mt-0.5">{description}</p>
          {isEarned && earnedAt && (
            <p className="text-xxs text-terminal-accent mt-1">
              Earned {new Date(earnedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default AchievementPanel;
