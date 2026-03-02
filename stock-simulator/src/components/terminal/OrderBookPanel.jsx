/**
 * OrderBookPanel - Bid/Ask depth visualization
 * 
 * Educational Purpose: Teaches users about:
 * - Price discovery through bid/ask spreads
 * - Market depth and liquidity
 * - Why market orders may fill at unexpected prices
 * 
 * Implementation: We simulate an order book based on the current price.
 * Real order books would require Level 2 data (expensive/restricted).
 */

import React, { useMemo } from 'react';
import { BookOpen, ArrowUp, ArrowDown } from 'lucide-react';
import { useMarketStore } from '../../stores/marketStore';
import { useBeginnerMode } from '../education/BeginnerMode';
import { Term, PanelHelp } from '../education/TermHighlight';

export function OrderBookPanel() {
  const { selectedTicker, tickers } = useMarketStore();
  const { isBeginnerMode, label } = useBeginnerMode();
  
  const tickerData = tickers[selectedTicker];
  const currentPrice = tickerData?.price || 0;
  const bid = tickerData?.bid || currentPrice * 0.999;
  const ask = tickerData?.ask || currentPrice * 1.001;
  const spread = ask - bid;
  const spreadPercent = currentPrice ? (spread / currentPrice) * 100 : 0;

  /**
   * Generate simulated order book levels
   * 
   * In a real system, this would come from Level 2 market data.
   * We simulate realistic-looking depth based on the current price.
   */
  const orderBook = useMemo(() => {
    if (!currentPrice) return { bids: [], asks: [] };
    
    const levels = 8;
    const bids = [];
    const asks = [];
    
    // Base sizes - larger at the spread, tapering off
    for (let i = 0; i < levels; i++) {
      const offset = (i + 1) * 0.001 * currentPrice; // 0.1% increments
      const baseSize = Math.round(1000 + Math.random() * 2000);
      const sizeMultiplier = 1 + i * 0.3; // Larger sizes away from spread
      
      bids.push({
        price: Math.round((bid - offset) * 100) / 100,
        size: Math.round(baseSize * sizeMultiplier),
        total: 0 // Cumulative, calculated below
      });
      
      asks.push({
        price: Math.round((ask + offset) * 100) / 100,
        size: Math.round(baseSize * sizeMultiplier),
        total: 0
      });
    }
    
    // Calculate cumulative totals
    let bidTotal = 0;
    let askTotal = 0;
    
    for (let i = 0; i < levels; i++) {
      bidTotal += bids[i].size;
      askTotal += asks[i].size;
      bids[i].total = bidTotal;
      asks[i].total = askTotal;
    }
    
    // Calculate max for bar scaling
    const maxTotal = Math.max(bidTotal, askTotal);
    
    return {
      bids: bids.map(b => ({ ...b, percent: (b.total / maxTotal) * 100 })),
      asks: asks.map(a => ({ ...a, percent: (a.total / maxTotal) * 100 }))
    };
  }, [currentPrice, bid, ask]);

  return (
    <div className="h-full flex flex-col">
      {/* Panel Header */}
      <div className="terminal-header drag-handle cursor-move">
        <div className="flex items-center gap-2">
          <BookOpen className="w-3 h-3" />
          <span>{label('Order Book', '📖 Buy & Sell Orders')}</span>
        </div>
        {selectedTicker && (
          <span className="text-terminal-text font-medium">{selectedTicker}</span>
        )}
      </div>

      <PanelHelp icon="📖" title="What is this?">
        The Order Book shows people waiting to buy (green, bottom) and sell (red, top).
        The gap between them is called the "spread" — a smaller gap means
        easier, cheaper trading!
      </PanelHelp>
      
      {selectedTicker && currentPrice ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Column Headers */}
          <div className="grid grid-cols-3 text-xxs text-terminal-muted px-2 py-1 border-b border-terminal-border">
            <span>{label('Price', 'Price')}</span>
            <span className="text-right"><Term k="volume">{label('Size', 'Shares')}</Term></span>
            <span className="text-right">{label('Total', 'Cumulative')}</span>
          </div>
          
          {/* Asks (sells) - Reversed so lowest ask is at bottom */}
          <div className="flex-1 overflow-auto flex flex-col-reverse">
            {orderBook.asks.slice().reverse().map((level, i) => (
              <div
                key={`ask-${i}`}
                className="grid grid-cols-3 text-xs font-mono px-2 py-0.5 relative"
              >
                {/* Background bar */}
                <div
                  className="absolute inset-y-0 right-0 bg-loss/10"
                  style={{ width: `${level.percent}%` }}
                />
                <span className="text-loss relative z-10">
                  {level.price.toFixed(2)}
                </span>
                <span className="text-right relative z-10">
                  {formatSize(level.size)}
                </span>
                <span className="text-right text-terminal-muted relative z-10">
                  {formatSize(level.total)}
                </span>
              </div>
            ))}
          </div>
          
          {/* Spread Display */}
          <div className="px-2 py-2 bg-terminal-bg border-y border-terminal-border">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-terminal-muted">
                  <Term k="spread">{label('Spread:', 'Gap:')}</Term>
                </span>
                <span className="font-mono text-terminal-text">
                  ${spread.toFixed(2)}
                </span>
                <span className="text-terminal-muted">
                  ({spreadPercent.toFixed(3)}%)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <ArrowUp className="w-3 h-3 text-gain" />
                  <span className="font-mono text-gain" title={isBeginnerMode ? 'Ask price: lowest someone will sell for' : ''}>
                    {ask.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <ArrowDown className="w-3 h-3 text-loss" />
                  <span className="font-mono text-loss" title={isBeginnerMode ? 'Bid price: highest someone will pay' : ''}>
                    {bid.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
            {isBeginnerMode && (
              <div className="text-xxs text-yellow-400/70 mt-1">
                🟢 Bid = buyers offering | 🔴 Ask = sellers asking | Gap = your trading cost
              </div>
            )}
          </div>
          
          {/* Bids (buys) */}
          <div className="flex-1 overflow-auto">
            {orderBook.bids.map((level, i) => (
              <div
                key={`bid-${i}`}
                className="grid grid-cols-3 text-xs font-mono px-2 py-0.5 relative"
              >
                {/* Background bar */}
                <div
                  className="absolute inset-y-0 right-0 bg-gain/10"
                  style={{ width: `${level.percent}%` }}
                />
                <span className="text-gain relative z-10">
                  {level.price.toFixed(2)}
                </span>
                <span className="text-right relative z-10">
                  {formatSize(level.size)}
                </span>
                <span className="text-right text-terminal-muted relative z-10">
                  {formatSize(level.total)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-terminal-muted">
          <div className="text-center">
            <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Select a ticker</p>
          </div>
        </div>
      )}
    </div>
  );
}

function formatSize(value) {
  if (value >= 1000) {
    return (value / 1000).toFixed(1) + 'K';
  }
  return value.toString();
}

export default OrderBookPanel;
