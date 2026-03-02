/**
 * TaxLotViewer - Detailed tax lot tracking with cost basis methods
 * 
 * Features:
 * - View all tax lots by ticker
 * - Select cost basis method (FIFO, LIFO, HIFO)
 * - See holding period and tax classification
 * - Identify lots approaching long-term status
 * 
 * Educational Purpose: Teaches tax-efficient selling strategies
 */

import React, { useState, useMemo } from 'react';
import {
  Layers,
  Clock,
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Filter,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { usePlayerStore } from '../../stores/playerStore';
import { useMarketStore } from '../../stores/marketStore';
import { useBeginnerMode } from '../education/BeginnerMode';
import { Term, PanelHelp } from '../education/TermHighlight';

const COST_BASIS_METHODS = {
  FIFO: { label: 'FIFO', description: 'First In, First Out — Sell your oldest shares first (like eating the oldest fruit)' },
  LIFO: { label: 'LIFO', description: 'Last In, First Out — Sell your newest shares first' },
  HIFO: { label: 'HIFO', description: 'Highest In, First Out — Sell the most expensive shares first (saves on taxes!)' }
};

export function TaxLotViewer() {
  const [selectedMethod, setSelectedMethod] = useState('FIFO');
  const [expandedTicker, setExpandedTicker] = useState(null);
  const [showOnlyOpen, setShowOnlyOpen] = useState(true);
  
  const { taxLots, positions } = usePlayerStore();
  const { tickers } = useMarketStore();

  // Group lots by ticker
  const lotsByTicker = useMemo(() => {
    const grouped = {};
    
    for (const lot of taxLots) {
      if (showOnlyOpen && lot.shares <= 0) continue;
      
      if (!grouped[lot.ticker]) {
        grouped[lot.ticker] = [];
      }
      grouped[lot.ticker].push(lot);
    }
    
    // Sort lots within each ticker based on selected method
    for (const ticker of Object.keys(grouped)) {
      grouped[ticker] = sortLotsByMethod(grouped[ticker], selectedMethod);
    }
    
    return grouped;
  }, [taxLots, selectedMethod, showOnlyOpen]);

  // Calculate summary stats
  const summary = useMemo(() => {
    const now = new Date();
    let totalCostBasis = 0;
    let totalMarketValue = 0;
    let lotsNearLongTerm = 0;
    let shortTermLots = 0;
    let longTermLots = 0;
    
    for (const lot of taxLots) {
      if (lot.shares <= 0) continue;
      
      const currentPrice = tickers[lot.ticker]?.price || lot.costBasis;
      totalCostBasis += lot.costBasis * lot.shares;
      totalMarketValue += currentPrice * lot.shares;
      
      const holdingDays = Math.floor((now - new Date(lot.acquiredDate)) / (1000 * 60 * 60 * 24));
      
      if (holdingDays > 365) {
        longTermLots++;
      } else {
        shortTermLots++;
        // Near long-term: 30 days away from 1 year
        if (holdingDays > 335) {
          lotsNearLongTerm++;
        }
      }
    }
    
    return {
      totalCostBasis,
      totalMarketValue,
      unrealizedGain: totalMarketValue - totalCostBasis,
      shortTermLots,
      longTermLots,
      lotsNearLongTerm
    };
  }, [taxLots, tickers]);

  return (
    <div className="h-full flex flex-col">
      {/* Panel Header */}
      <div className="terminal-header drag-handle cursor-move">
        <div className="flex items-center gap-2">
          <Layers className="w-3 h-3" />
          <span>📦 <Term k="tax_lot">Tax Lots</Term></span>
        </div>
        <span className="text-xxs text-terminal-muted">
          {Object.values(lotsByTicker).flat().length} lots
        </span>
      </div>

      <PanelHelp id="tax-lots">
        Each time you buy shares, it creates a "tax lot" — like a receipt that tracks when you bought and for how much.
        When you sell, the order you sell these lots matters for taxes! That's what FIFO/LIFO/HIFO means.
      </PanelHelp>

      {/* Controls */}
      <div className="p-2 border-b border-terminal-border space-y-2">
        {/* Cost Basis Method Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-terminal-muted"><Term k="cost_basis">Cost Basis</Term> Method:</span>
          <div className="flex gap-1">
            {Object.entries(COST_BASIS_METHODS).map(([key, { label }]) => (
              <button
                key={key}
                onClick={() => setSelectedMethod(key)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  selectedMethod === key
                    ? 'bg-terminal-accent text-white'
                    : 'bg-terminal-border text-terminal-muted hover:text-terminal-text'
                }`}
                title={COST_BASIS_METHODS[key].description}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Filter */}
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-terminal-muted cursor-pointer">
            <input
              type="checkbox"
              checked={showOnlyOpen}
              onChange={(e) => setShowOnlyOpen(e.target.checked)}
              className="rounded border-terminal-border bg-terminal-bg"
            />
            Show only open lots
          </label>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="p-2 border-b border-terminal-border">
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="p-2 bg-terminal-bg rounded">
            <div className="text-xxs text-terminal-muted">Cost Basis</div>
            <div className="text-xs font-mono">${summary.totalCostBasis.toFixed(0)}</div>
          </div>
          <div className="p-2 bg-terminal-bg rounded">
            <div className="text-xxs text-terminal-muted">Mkt Value</div>
            <div className="text-xs font-mono">${summary.totalMarketValue.toFixed(0)}</div>
          </div>
          <div className="p-2 bg-terminal-bg rounded">
            <div className="text-xxs text-terminal-muted">Short-Term</div>
            <div className="text-xs font-mono text-yellow-500">{summary.shortTermLots}</div>
          </div>
          <div className="p-2 bg-terminal-bg rounded">
            <div className="text-xxs text-terminal-muted">Long-Term</div>
            <div className="text-xs font-mono text-gain">{summary.longTermLots}</div>
          </div>
        </div>
        
        {summary.lotsNearLongTerm > 0 && (
          <div className="mt-2 p-2 bg-terminal-accent/10 border border-terminal-accent/30 rounded flex items-center gap-2">
            <Clock className="w-3 h-3 text-terminal-accent" />
            <span className="text-xs text-terminal-accent">
              {summary.lotsNearLongTerm} lot(s) within 30 days of long-term status!
            </span>
          </div>
        )}
      </div>

      {/* Lot List */}
      <div className="flex-1 overflow-auto">
        {Object.keys(lotsByTicker).length === 0 ? (
          <div className="h-full flex items-center justify-center text-terminal-muted">
            <div className="text-center">
              <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No tax lots</p>
              <p className="text-xs mt-1">Buy stocks to create tax lots</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-terminal-border">
            {Object.entries(lotsByTicker).map(([ticker, lots]) => (
              <TickerLotGroup
                key={ticker}
                ticker={ticker}
                lots={lots}
                currentPrice={tickers[ticker]?.price}
                isExpanded={expandedTicker === ticker}
                onToggle={() => setExpandedTicker(expandedTicker === ticker ? null : ticker)}
                method={selectedMethod}
              />
            ))}
          </div>
        )}
      </div>

      {/* Educational Footer */}
      <div className="p-2 border-t border-terminal-border">
        <div className="text-xxs text-terminal-muted">
          <strong className="text-terminal-accent">{selectedMethod}:</strong>{' '}
          {COST_BASIS_METHODS[selectedMethod].description}
        </div>
      </div>
    </div>
  );
}

/**
 * Ticker Lot Group - Expandable group of lots for a ticker
 */
function TickerLotGroup({ ticker, lots, currentPrice, isExpanded, onToggle, method }) {
  const totalShares = lots.reduce((sum, lot) => sum + lot.shares, 0);
  const totalCostBasis = lots.reduce((sum, lot) => sum + (lot.costBasis * lot.shares), 0);
  const avgCost = totalShares > 0 ? totalCostBasis / totalShares : 0;
  const marketValue = totalShares * (currentPrice || avgCost);
  const unrealizedGain = marketValue - totalCostBasis;
  const gainPercent = totalCostBasis > 0 ? (unrealizedGain / totalCostBasis) * 100 : 0;
  const isPositive = unrealizedGain >= 0;

  return (
    <div>
      {/* Ticker Header */}
      <button
        onClick={onToggle}
        className="w-full px-3 py-2 flex items-center justify-between hover:bg-terminal-border/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-terminal-muted" />
          ) : (
            <ChevronRight className="w-4 h-4 text-terminal-muted" />
          )}
          <span className="font-medium text-terminal-text">{ticker}</span>
          <span className="text-xs text-terminal-muted">({lots.length} lots)</span>
        </div>
        
        <div className="flex items-center gap-4 text-xs">
          <span className="font-mono">{totalShares} shares</span>
          <span className={`font-mono ${isPositive ? 'text-gain' : 'text-loss'}`}>
            {isPositive ? '+' : ''}{gainPercent.toFixed(1)}%
          </span>
        </div>
      </button>
      
      {/* Expanded Lot Details */}
      {isExpanded && (
        <div className="bg-terminal-bg border-t border-terminal-border">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-terminal-muted">
                <th className="px-3 py-1 text-left font-medium">Order</th>
                <th className="px-3 py-1 text-left font-medium">Acquired</th>
                <th className="px-3 py-1 text-right font-medium">Shares</th>
                <th className="px-3 py-1 text-right font-medium">Cost</th>
                <th className="px-3 py-1 text-right font-medium">Gain/Loss</th>
                <th className="px-3 py-1 text-center font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {lots.map((lot, index) => (
                <LotRow 
                  key={lot.id} 
                  lot={lot} 
                  currentPrice={currentPrice}
                  order={index + 1}
                  isFirst={index === 0}
                  method={method}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/**
 * Individual Lot Row
 */
function LotRow({ lot, currentPrice, order, isFirst, method }) {
  const now = new Date();
  const acquiredDate = new Date(lot.acquiredDate);
  const holdingDays = Math.floor((now - acquiredDate) / (1000 * 60 * 60 * 24));
  const isLongTerm = holdingDays > 365;
  const daysToLongTerm = 366 - holdingDays;
  const isNearLongTerm = !isLongTerm && daysToLongTerm <= 30 && daysToLongTerm > 0;
  
  const marketValue = lot.shares * (currentPrice || lot.costBasis);
  const costBasis = lot.shares * lot.costBasis;
  const gain = marketValue - costBasis;
  const isPositive = gain >= 0;

  return (
    <tr className={`border-t border-terminal-border/50 ${isFirst ? 'bg-terminal-accent/5' : ''}`}>
      <td className="px-3 py-2">
        <div className="flex items-center gap-1">
          <span className="text-terminal-muted">#{order}</span>
          {isFirst && (
            <span className="px-1 py-0.5 bg-terminal-accent/20 text-terminal-accent text-xxs rounded">
              {method === 'FIFO' ? 'NEXT' : method === 'LIFO' ? 'NEXT' : 'BEST'}
            </span>
          )}
        </div>
      </td>
      <td className="px-3 py-2">
        <div className="text-terminal-text">{acquiredDate.toLocaleDateString()}</div>
        <div className="text-xxs text-terminal-muted">{holdingDays} days</div>
      </td>
      <td className="px-3 py-2 text-right font-mono">{lot.shares}</td>
      <td className="px-3 py-2 text-right font-mono">${lot.costBasis.toFixed(2)}</td>
      <td className={`px-3 py-2 text-right font-mono ${isPositive ? 'text-gain' : 'text-loss'}`}>
        {isPositive ? '+' : ''}${gain.toFixed(2)}
      </td>
      <td className="px-3 py-2 text-center">
        {isLongTerm ? (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-gain/20 text-gain rounded text-xxs">
            <CheckCircle className="w-3 h-3" />
            Long-Term
          </span>
        ) : isNearLongTerm ? (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-terminal-accent/20 text-terminal-accent rounded text-xxs">
            <Clock className="w-3 h-3" />
            {daysToLongTerm}d to LT
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-yellow-500/20 text-yellow-500 rounded text-xxs">
            <AlertCircle className="w-3 h-3" />
            Short-Term
          </span>
        )}
        
        {lot.isWashSale && (
          <span className="ml-1 px-1.5 py-0.5 bg-loss/20 text-loss rounded text-xxs">
            Wash
          </span>
        )}
      </td>
    </tr>
  );
}

/**
 * Sort lots based on cost basis method
 */
function sortLotsByMethod(lots, method) {
  return [...lots].sort((a, b) => {
    switch (method) {
      case 'FIFO':
        return new Date(a.acquiredDate) - new Date(b.acquiredDate);
      case 'LIFO':
        return new Date(b.acquiredDate) - new Date(a.acquiredDate);
      case 'HIFO':
        return b.costBasis - a.costBasis;
      default:
        return 0;
    }
  });
}

export default TaxLotViewer;
