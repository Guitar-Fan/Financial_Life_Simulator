/**
 * PositionsPanel - Portfolio positions and P&L tracking
 * 
 * Features:
 * - Current positions with unrealized P&L
 * - Order history / Recent trades
 * - Tax lot visibility (Stage 3 feature preview)
 * 
 * Educational Purpose: Teaches position management, cost basis
 * tracking, and the importance of monitoring unrealized gains.
 */

import React, { useState } from 'react';
import { Briefcase, History, Receipt, TrendingUp, TrendingDown } from 'lucide-react';
import { useMarketStore } from '../../stores/marketStore';
import { usePlayerStore } from '../../stores/playerStore';
import { useBeginnerMode } from '../education/BeginnerMode';
import { Term, PanelHelp } from '../education/TermHighlight';

export function PositionsPanel() {
  const [activeTab, setActiveTab] = useState('positions');
  
  const { tickers, selectTicker } = useMarketStore();
  const { positions, orderHistory, realizedGains } = usePlayerStore();
  const { isBeginnerMode, label } = useBeginnerMode();
  
  // Calculate position details with current prices
  const positionDetails = Object.entries(positions).map(([symbol, pos]) => {
    const currentPrice = tickers[symbol]?.price || pos.avgCost;
    const marketValue = pos.shares * currentPrice;
    const costBasis = pos.shares * pos.avgCost;
    const unrealizedPL = marketValue - costBasis;
    const unrealizedPLPercent = costBasis > 0 ? (unrealizedPL / costBasis) * 100 : 0;
    
    return {
      symbol,
      shares: pos.shares,
      avgCost: pos.avgCost,
      currentPrice,
      marketValue,
      costBasis,
      unrealizedPL,
      unrealizedPLPercent,
      isPositive: unrealizedPL >= 0
    };
  });
  
  // Calculate totals
  const totals = positionDetails.reduce((acc, pos) => ({
    marketValue: acc.marketValue + pos.marketValue,
    costBasis: acc.costBasis + pos.costBasis,
    unrealizedPL: acc.unrealizedPL + pos.unrealizedPL
  }), { marketValue: 0, costBasis: 0, unrealizedPL: 0 });

  const tabs = [
    { id: 'positions', label: label('Positions', '📍 My Stocks'), icon: Briefcase },
    { id: 'orders', label: label('Orders', '📝 Trade History'), icon: History },
    { id: 'realized', label: label('Realized P&L', '✅ Actual Profit/Loss'), icon: Receipt }
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Panel Header with Tabs */}
      <div className="terminal-header drag-handle cursor-move">
        <div className="flex items-center gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${
                activeTab === tab.id
                  ? 'bg-terminal-accent/20 text-terminal-accent'
                  : 'text-terminal-muted hover:text-terminal-text'
              }`}
            >
              <tab.icon className="w-3 h-3" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Tab Content */}
      <PanelHelp icon="💼" title="Your Portfolio">
        This shows stocks you own. Green P&L = you're making money. Red = losing.
        Remember: it's only "on paper" until you sell! Click a stock to trade it.
      </PanelHelp>
      <div className="flex-1 overflow-auto">
        {activeTab === 'positions' && (
          <PositionsTab 
            positions={positionDetails} 
            totals={totals}
            onSelectTicker={selectTicker}
          />
        )}
        {activeTab === 'orders' && (
          <OrdersTab orders={orderHistory} />
        )}
        {activeTab === 'realized' && (
          <RealizedTab gains={realizedGains} />
        )}
      </div>
    </div>
  );
}

/**
 * Positions Tab - Current holdings
 */
function PositionsTab({ positions, totals, onSelectTicker }) {
  if (positions.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-terminal-muted">
        <div className="text-center">
          <Briefcase className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No open positions</p>
          <p className="text-xs mt-1">Buy stocks to see them here</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <table className="data-table">
        <thead className="sticky top-0 bg-terminal-surface">
          <tr>
            <th><Term k="ticker">Symbol</Term></th>
            <th className="text-right"><Term k="share">Shares</Term></th>
            <th className="text-right"><Term k="cost_basis">Avg Cost</Term></th>
            <th className="text-right">Price</th>
            <th className="text-right"><Term k="market_value">Mkt Value</Term></th>
            <th className="text-right"><Term k="unrealized_pl">P&L</Term></th>
            <th className="text-right">%</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((pos) => (
            <tr
              key={pos.symbol}
              onClick={() => onSelectTicker(pos.symbol)}
              className="cursor-pointer"
            >
              <td>
                <span className="font-medium text-terminal-text">{pos.symbol}</span>
              </td>
              <td className="text-right font-mono">{pos.shares}</td>
              <td className="text-right font-mono">${pos.avgCost.toFixed(2)}</td>
              <td className="text-right font-mono">${pos.currentPrice.toFixed(2)}</td>
              <td className="text-right font-mono">${pos.marketValue.toFixed(2)}</td>
              <td className={`text-right font-mono ${pos.isPositive ? 'text-gain' : 'text-loss'}`}>
                <div className="flex items-center justify-end gap-1">
                  {pos.isPositive ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {pos.isPositive ? '+' : ''}${pos.unrealizedPL.toFixed(2)}
                </div>
              </td>
              <td className={`text-right font-mono ${pos.isPositive ? 'text-gain' : 'text-loss'}`}>
                {pos.isPositive ? '+' : ''}{pos.unrealizedPLPercent.toFixed(2)}%
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="border-t-2 border-terminal-border">
          <tr className="font-medium">
            <td colSpan={4} className="text-terminal-muted">Total</td>
            <td className="text-right font-mono">${totals.marketValue.toFixed(2)}</td>
            <td className={`text-right font-mono ${totals.unrealizedPL >= 0 ? 'text-gain' : 'text-loss'}`}>
              {totals.unrealizedPL >= 0 ? '+' : ''}${totals.unrealizedPL.toFixed(2)}
            </td>
            <td className={`text-right font-mono ${totals.unrealizedPL >= 0 ? 'text-gain' : 'text-loss'}`}>
              {totals.costBasis > 0 
                ? (totals.unrealizedPL >= 0 ? '+' : '') + ((totals.unrealizedPL / totals.costBasis) * 100).toFixed(2) + '%'
                : '--'}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

/**
 * Orders Tab - Trade history
 */
function OrdersTab({ orders }) {
  const recentOrders = orders.slice(-20).reverse(); // Show last 20, newest first

  if (recentOrders.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-terminal-muted">
        <div className="text-center">
          <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No orders yet</p>
          <p className="text-xs mt-1">Your trade history will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <table className="data-table">
      <thead className="sticky top-0 bg-terminal-surface">
        <tr>
          <th>Time</th>
          <th>Symbol</th>
          <th>Side</th>
          <th>Type</th>
          <th className="text-right">Qty</th>
          <th className="text-right">Price</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {recentOrders.map((order) => (
          <tr key={order.id}>
            <td className="text-terminal-muted text-xs">
              {formatTime(order.timestamp)}
            </td>
            <td className="font-medium">{order.ticker}</td>
            <td className={order.side === 'BUY' ? 'text-gain' : 'text-loss'}>
              {order.side}
            </td>
            <td className="text-terminal-muted">{order.type}</td>
            <td className="text-right font-mono">{order.quantity}</td>
            <td className="text-right font-mono">
              ${order.fillPrice?.toFixed(2) || '--'}
            </td>
            <td>
              <span className={`px-1.5 py-0.5 rounded text-xxs ${
                order.status === 'FILLED' ? 'bg-gain/20 text-gain' :
                order.status === 'CANCELLED' ? 'bg-loss/20 text-loss' :
                'bg-terminal-border text-terminal-muted'
              }`}>
                {order.status}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * Realized P&L Tab - Tax implications preview
 */
function RealizedTab({ gains }) {
  const totalRealized = gains.shortTerm + gains.longTerm;
  const estimatedTax = (gains.shortTerm * 0.37) + (gains.longTerm * 0.15);

  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Short-Term Gains */}
        <div className="p-3 bg-terminal-bg rounded border border-terminal-border">
          <div className="text-xs text-terminal-muted mb-1">
            <Term k="short_term_gains">Short-Term Gains</Term>
          </div>
          <div className="text-lg font-mono text-terminal-text">
            ${gains.shortTerm.toFixed(2)}
          </div>
          <div className="text-xxs text-loss mt-1">
            Tax Rate: ~37% 😬
          </div>
        </div>
        
        {/* Long-Term Gains */}
        <div className="p-3 bg-terminal-bg rounded border border-terminal-border">
          <div className="text-xs text-terminal-muted mb-1">
            <Term k="long_term_gains">Long-Term Gains</Term>
          </div>
          <div className="text-lg font-mono text-terminal-text">
            ${gains.longTerm.toFixed(2)}
          </div>
          <div className="text-xxs text-gain mt-1">
            Tax Rate: ~15% 🎉
          </div>
        </div>
      </div>
      
      {/* Tax Summary */}
      <div className="p-3 bg-terminal-bg rounded border border-terminal-border">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-terminal-muted">Total Realized</span>
          <span className={`font-mono ${totalRealized >= 0 ? 'text-gain' : 'text-loss'}`}>
            ${totalRealized.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-terminal-muted">Est. Tax Liability</span>
          <span className="font-mono text-loss">
            ${Math.max(0, estimatedTax).toFixed(2)}
          </span>
        </div>
      </div>
      
      {/* Educational Note */}
      <div className="p-3 bg-terminal-accent/10 border border-terminal-accent/30 rounded">
        <div className="text-xs text-terminal-accent font-medium mb-1">
          💡 Tax Tip
        </div>
        <div className="text-xs text-terminal-text">
          Holdings over 1 year qualify for long-term capital gains rates (15% vs 37%). 
          Patience can significantly reduce your tax burden.
        </div>
      </div>
    </div>
  );
}

function formatTime(timestamp) {
  if (!timestamp) return '--';
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
}

export default PositionsPanel;
