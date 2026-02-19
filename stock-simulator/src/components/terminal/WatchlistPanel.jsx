/**
 * WatchlistPanel - Ticker monitoring and selection
 * 
 * Features:
 * - Display all unlocked tickers with real-time prices
 * - Click to select for charting/trading
 * - Visual indicators for price movement
 * 
 * Educational Purpose: Teaches users to monitor multiple securities
 * and identify opportunities across their watchlist.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Star, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useMarketStore } from '../../stores/marketStore';
import { usePlayerStore } from '../../stores/playerStore';
import { useBeginnerMode } from '../education/BeginnerMode';
import { Term, PanelHelp } from '../education/TermHighlight';

export function WatchlistPanel() {
  const { tickerIndex, tickers, selectedTicker, selectTicker } = useMarketStore();
  const { unlockedTickers } = usePlayerStore();
  const { isBeginnerMode, label } = useBeginnerMode();
  
  // Track previous prices for flash animation
  const prevPrices = useRef({});
  const [flashState, setFlashState] = useState({});

  // Filter to only show unlocked tickers
  const availableTickers = tickerIndex.filter(t => 
    unlockedTickers.includes(t.symbol)
  );

  // Detect price changes and trigger flash
  useEffect(() => {
    const newFlashState = {};
    
    for (const ticker of availableTickers) {
      const currentPrice = tickers[ticker.symbol]?.price;
      const prevPrice = prevPrices.current[ticker.symbol];
      
      if (prevPrice !== undefined && currentPrice !== prevPrice) {
        newFlashState[ticker.symbol] = currentPrice > prevPrice ? 'gain' : 'loss';
      }
      
      prevPrices.current[ticker.symbol] = currentPrice;
    }
    
    if (Object.keys(newFlashState).length > 0) {
      setFlashState(newFlashState);
      // Clear flash after animation
      setTimeout(() => setFlashState({}), 300);
    }
  }, [tickers, availableTickers]);

  return (
    <div className="h-full flex flex-col">
      {/* Panel Header */}
      <div className="terminal-header drag-handle cursor-move">
        <div className="flex items-center gap-2">
          <Star className="w-3 h-3" />
          <span>{label('Watchlist', '🎯 My Stocks')}</span>
        </div>
        <span className="text-xxs">{availableTickers.length} {label('symbols', 'stocks')}</span>
      </div>
      
      <PanelHelp icon="🎯" title="Your Watchlist">
        These are the stocks you can trade. Click any row to select it — the chart
        and order panel will update. Green = price going up, Red = going down.
      </PanelHelp>
      
      {/* Watchlist Table */}
      <div className="flex-1 overflow-auto">
        <table className="data-table">
          <thead className="sticky top-0 bg-terminal-surface">
            <tr>
              <th><Term k="ticker">{label('Symbol', 'Stock')}</Term></th>
              <th className="text-right">{label('Last', 'Price')}</th>
              <th className="text-right">{label('Chg', '+/-')}</th>
              <th className="text-right">%</th>
            </tr>
          </thead>
          <tbody>
            {availableTickers.map((ticker) => {
              const data = tickers[ticker.symbol] || {};
              const isSelected = selectedTicker === ticker.symbol;
              const change = data.price && ticker.latestPrice 
                ? data.price - ticker.latestPrice 
                : 0;
              const changePercent = ticker.latestPrice 
                ? (change / ticker.latestPrice) * 100 
                : 0;
              const isPositive = change >= 0;
              const flash = flashState[ticker.symbol];
              
              return (
                <tr
                  key={ticker.symbol}
                  onClick={() => selectTicker(ticker.symbol)}
                  className={`cursor-pointer transition-colors ${
                    isSelected ? 'bg-terminal-accent/20' : ''
                  } ${flash === 'gain' ? 'flash-gain' : ''} ${flash === 'loss' ? 'flash-loss' : ''}`}
                >
                  <td>
                    <div className="flex flex-col">
                      <span className="font-medium text-terminal-text">
                        {ticker.symbol}
                      </span>
                      <span className="text-xxs text-terminal-muted truncate max-w-[100px]">
                        {ticker.name}
                      </span>
                    </div>
                  </td>
                  <td className="text-right font-mono">
                    {data.price ? formatPrice(data.price) : '--'}
                  </td>
                  <td className={`text-right font-mono ${isPositive ? 'text-gain' : 'text-loss'}`}>
                    <div className="flex items-center justify-end gap-1">
                      {isPositive ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : change < 0 ? (
                        <TrendingDown className="w-3 h-3" />
                      ) : (
                        <Minus className="w-3 h-3 text-terminal-muted" />
                      )}
                      {change !== 0 ? (isPositive ? '+' : '') + formatPrice(change) : '--'}
                    </div>
                  </td>
                  <td className={`text-right font-mono ${isPositive ? 'text-gain' : 'text-loss'}`}>
                    {changePercent !== 0 
                      ? (isPositive ? '+' : '') + changePercent.toFixed(2) + '%' 
                      : '--'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Locked Tickers Hint */}
      {unlockedTickers.length < tickerIndex.length && (
        <div className="p-2 border-t border-terminal-border">
          <div className="text-xxs text-terminal-muted text-center">
            {isBeginnerMode
              ? `🔒 ${tickerIndex.length - unlockedTickers.length} more stocks unlock as you play! Keep trading to discover them.`
              : `🔒 ${tickerIndex.length - unlockedTickers.length} more symbols unlock with progress`}
          </div>
        </div>
      )}
    </div>
  );
}

function formatPrice(value) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

export default WatchlistPanel;
