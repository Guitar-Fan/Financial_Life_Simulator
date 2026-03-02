/**
 * Header Component - Top navigation and status bar
 * 
 * Displays: Market time, playback controls, account summary
 * 
 * Design: Mimics the dense information bar found at the top of
 * professional terminals. Every pixel serves a purpose.
 */

import React from 'react';
import { 
  Play, 
  Pause, 
  FastForward, 
  RotateCcw,
  Settings,
  Bell,
  TrendingUp,
  Landmark,
  Receipt
} from 'lucide-react';
import { useMarketStore } from '../../stores/marketStore';
import { usePlayerStore } from '../../stores/playerStore';
import { BeginnerModeToggle, useBeginnerMode } from '../education/BeginnerMode';
import { Term } from '../education/TermHighlight';

export function Header({ currentDate, currentTime, isPlaying, cash, mode, onModeChange }) {
  const { 
    play, 
    pause, 
    togglePlayback, 
    playbackSpeed, 
    setPlaybackSpeed,
    reset 
  } = useMarketStore();
  const { isBeginnerMode, label } = useBeginnerMode();
  
  const { positions } = usePlayerStore();
  const tickers = useMarketStore((s) => s.tickers);
  
  // Calculate portfolio value
  const portfolioValue = Object.entries(positions).reduce((total, [symbol, pos]) => {
    const currentPrice = tickers[symbol]?.price || 0;
    return total + (pos.shares * currentPrice);
  }, 0);
  
  const totalValue = cash + portfolioValue;
  const startingCash = usePlayerStore((s) => s.startingCash);
  const totalGain = totalValue - startingCash;
  const totalGainPercent = ((totalGain / startingCash) * 100).toFixed(2);
  const isPositive = totalGain >= 0;

  const speedOptions = [1, 5, 10, 50];

  return (
    <header className="h-12 px-4 flex items-center justify-between bg-terminal-surface border-b border-terminal-border">
      {/* Left: Logo & Market Time */}
      <div className="flex items-center gap-6">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-terminal-accent flex items-center justify-center">
            <span className="text-white font-bold text-sm">MT</span>
          </div>
          <span className="text-terminal-text font-semibold hidden sm:block">
            Market Terminal
          </span>
        </div>
        
        {/* Market Time Display */}
        <div className="flex items-center gap-3 pl-4 border-l border-terminal-border">
          <div className="text-center">
            <div className="text-xxs text-terminal-muted uppercase">Date</div>
            <div className="text-sm font-mono text-terminal-text">
              {currentDate || '----/--/--'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xxs text-terminal-muted uppercase">Time</div>
            <div className="text-sm font-mono text-terminal-text">
              {currentTime || '--:--'}
            </div>
          </div>
        </div>
        
        {/* Mode Switcher */}
        <div className="flex items-center gap-1 pl-4 border-l border-terminal-border" data-tutorial="mode-switcher">
          <button
            onClick={() => onModeChange?.('TRADING')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              mode === 'TRADING'
                ? 'bg-terminal-accent text-white'
                : 'text-terminal-muted hover:text-terminal-text hover:bg-terminal-border'
            }`}
            title={label('Secondary Market Trading', 'Buy & Sell Stocks')}
          >
            <TrendingUp className="w-3 h-3" />
            {label('Trading', '📈 Buy & Sell')}
          </button>
          <button
            onClick={() => onModeChange?.('IPO')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              mode === 'IPO'
                ? 'bg-terminal-accent text-white'
                : 'text-terminal-muted hover:text-terminal-text hover:bg-terminal-border'
            }`}
            title={label('Primary Market (IPOs)', 'New Companies Going Public')}
          >
            <Landmark className="w-3 h-3" />
            {label('IPO', '🎉 New Stocks')}
          </button>
          <button
            onClick={() => onModeChange?.('TAX')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              mode === 'TAX'
                ? 'bg-terminal-accent text-white'
                : 'text-terminal-muted hover:text-terminal-text hover:bg-terminal-border'
            }`}
            title={label('Tax Center & Reports', 'See your taxes and fees')}
          >
            <Receipt className="w-3 h-3" />
            {label('Tax', '💸 Taxes')}
          </button>
        </div>
        
        {/* Playback Controls */}
        <div className="flex items-center gap-1 pl-4 border-l border-terminal-border">
          <button
            onClick={togglePlayback}
            className="p-2 hover:bg-terminal-border rounded transition-colors"
            title={isPlaying ? 'Pause simulation' : (isBeginnerMode ? '▶️ Start — watch time pass and prices change' : 'Play')}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 text-terminal-text" />
            ) : (
              <Play className="w-4 h-4 text-gain" />
            )}
          </button>
          
          {/* Speed Selector */}
          <div className="flex items-center gap-1 ml-2">
            <FastForward className="w-3 h-3 text-terminal-muted" />
            {speedOptions.map((speed) => (
              <button
                key={speed}
                onClick={() => setPlaybackSpeed(speed)}
                className={`px-2 py-1 text-xs font-mono rounded transition-colors ${
                  playbackSpeed === speed
                    ? 'bg-terminal-accent text-white'
                    : 'text-terminal-muted hover:text-terminal-text hover:bg-terminal-border'
                }`}
                title={isBeginnerMode ? `${speed}x speed — ${speed === 1 ? 'real time' : `${speed} times faster`}` : `${speed}x`}
              >
                {speed}x
              </button>
            ))}
          </div>
          
          <button
            onClick={reset}
            className="p-2 ml-2 hover:bg-terminal-border rounded transition-colors"
            title={label('Reset Simulation', '🔄 Start over with fresh $25,000')}
          >
            <RotateCcw className="w-4 h-4 text-terminal-muted" />
          </button>
        </div>
      </div>
      
      {/* Right: Account Summary */}
      <div className="flex items-center gap-6">
        {/* Beginner Mode Toggle */}
        <BeginnerModeToggle />
        
        {/* Account Values */}
        <div className="flex items-center gap-4">
          <div className="text-right" data-tutorial="cash-display">
            <div className="text-xxs text-terminal-muted uppercase">
              {label('Cash', '💵 Spending Money')}
            </div>
            <div className="text-sm font-mono text-terminal-text">
              {formatCurrency(cash)}
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-xxs text-terminal-muted uppercase">
              {label('Portfolio', '📊 Stocks Owned')}
            </div>
            <div className="text-sm font-mono text-terminal-text">
              {formatCurrency(portfolioValue)}
            </div>
          </div>
          
          <div className="text-right pl-3 border-l border-terminal-border">
            <div className="text-xxs text-terminal-muted uppercase">
              {label('Total Value', '🏆 Total Worth')}
            </div>
            <div className="text-sm font-mono text-terminal-text">
              {formatCurrency(totalValue)}
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-xxs text-terminal-muted uppercase">
              {label('P&L', '💰 Profit / Loss')}
            </div>
            <div className={`text-sm font-mono ${isPositive ? 'text-gain' : 'text-loss'}`}>
              {isPositive ? '+' : ''}{formatCurrency(totalGain)} ({isPositive ? '+' : ''}{totalGainPercent}%)
            </div>
          </div>
        </div>
        
        {/* Action Icons */}
        <div className="flex items-center gap-2 pl-4 border-l border-terminal-border">
          <button className="p-2 hover:bg-terminal-border rounded transition-colors relative">
            <Bell className="w-4 h-4 text-terminal-muted" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-loss rounded-full" />
          </button>
          <button className="p-2 hover:bg-terminal-border rounded transition-colors">
            <Settings className="w-4 h-4 text-terminal-muted" />
          </button>
        </div>
      </div>
    </header>
  );
}

/**
 * Format number as currency
 */
function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

export default Header;
