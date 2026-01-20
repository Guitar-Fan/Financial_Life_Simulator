/**
 * TaxDashboard - Comprehensive tax reporting and 1099-B simulation
 * 
 * Features:
 * - Real-time capital gains tracking (short-term vs long-term)
 * - 1099-B report simulation
 * - Tax liability estimation
 * - Year-over-year comparison
 * - The "Churning Lesson" visualization
 * 
 * Educational Purpose: Shows the real impact of taxes on trading profits
 */

import React, { useState, useMemo } from 'react';
import {
  FileText,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertTriangle,
  Download,
  PieChart,
  BarChart3,
  Info,
  Clock
} from 'lucide-react';
import { usePlayerStore } from '../../stores/playerStore';
import { useMarketStore } from '../../stores/marketStore';
import { calculateTaxLiability, TAX_RATES } from '../../utils/taxCalculator';

export function TaxDashboard() {
  const [activeTab, setActiveTab] = useState('summary');
  
  const { 
    realizedGains, 
    taxLots, 
    orderHistory, 
    positions,
    startingCash,
    cash
  } = usePlayerStore();
  
  const { tickers } = useMarketStore();

  // Calculate unrealized gains
  const unrealizedGains = useMemo(() => {
    let shortTerm = 0;
    let longTerm = 0;
    const now = new Date();
    
    for (const lot of taxLots) {
      if (lot.shares <= 0) continue;
      const currentPrice = tickers[lot.ticker]?.price || lot.costBasis;
      const gain = (currentPrice - lot.costBasis) * lot.shares;
      
      const holdingDays = Math.floor((now - new Date(lot.acquiredDate)) / (1000 * 60 * 60 * 24));
      
      if (holdingDays > 365) {
        longTerm += gain;
      } else {
        shortTerm += gain;
      }
    }
    
    return { shortTerm, longTerm, total: shortTerm + longTerm };
  }, [taxLots, tickers]);

  // Calculate tax liability
  const taxLiability = useMemo(() => {
    return calculateTaxLiability(realizedGains.shortTerm, realizedGains.longTerm);
  }, [realizedGains]);

  // Calculate trading statistics for "Churning Lesson"
  const tradingStats = useMemo(() => {
    const trades = orderHistory.filter(o => o.status === 'FILLED');
    const buys = trades.filter(t => t.side === 'BUY');
    const sells = trades.filter(t => t.side === 'SELL');
    
    // Calculate average holding period from tax lots
    let totalHoldingDays = 0;
    let lotCount = 0;
    const now = new Date();
    
    for (const lot of taxLots) {
      const holdingDays = Math.floor((now - new Date(lot.acquiredDate)) / (1000 * 60 * 60 * 24));
      totalHoldingDays += holdingDays;
      lotCount++;
    }
    
    const avgHoldingDays = lotCount > 0 ? Math.round(totalHoldingDays / lotCount) : 0;
    
    // Estimate transaction costs (slippage)
    const estimatedSlippage = trades.length * 0.001 * 5000; // ~$5 per trade avg
    
    return {
      totalTrades: trades.length,
      buyTrades: buys.length,
      sellTrades: sells.length,
      avgHoldingDays,
      estimatedSlippage,
      tradesPerMonth: trades.length > 0 ? (trades.length / 12).toFixed(1) : 0
    };
  }, [orderHistory, taxLots]);

  const tabs = [
    { id: 'summary', label: 'Tax Summary', icon: PieChart },
    { id: '1099b', label: '1099-B Report', icon: FileText },
    { id: 'analysis', label: 'Cost Analysis', icon: BarChart3 }
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Panel Header */}
      <div className="terminal-header drag-handle cursor-move">
        <div className="flex items-center gap-2">
          <FileText className="w-3 h-3" />
          <span>Tax Center</span>
        </div>
        <span className="text-xxs text-terminal-muted">Tax Year 2024</span>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-terminal-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-terminal-accent border-b-2 border-terminal-accent'
                : 'text-terminal-muted hover:text-terminal-text'
            }`}
          >
            <tab.icon className="w-3 h-3" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-3">
        {activeTab === 'summary' && (
          <TaxSummaryTab 
            realizedGains={realizedGains}
            unrealizedGains={unrealizedGains}
            taxLiability={taxLiability}
          />
        )}
        {activeTab === '1099b' && (
          <Report1099BTab orderHistory={orderHistory} taxLots={taxLots} />
        )}
        {activeTab === 'analysis' && (
          <CostAnalysisTab 
            tradingStats={tradingStats}
            realizedGains={realizedGains}
            taxLiability={taxLiability}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Tax Summary Tab
 */
function TaxSummaryTab({ realizedGains, unrealizedGains, taxLiability }) {
  const totalRealized = realizedGains.shortTerm + realizedGains.longTerm;
  
  return (
    <div className="space-y-4">
      {/* Realized Gains Cards */}
      <div className="grid grid-cols-2 gap-3">
        <GainCard
          title="Short-Term Gains"
          subtitle="Held ≤ 1 year"
          amount={realizedGains.shortTerm}
          taxRate={TAX_RATES.shortTerm.flatRate}
          icon={Clock}
          variant="warning"
        />
        <GainCard
          title="Long-Term Gains"
          subtitle="Held > 1 year"
          amount={realizedGains.longTerm}
          taxRate={TAX_RATES.longTerm.flatRate}
          icon={Calendar}
          variant="success"
        />
      </div>

      {/* Tax Liability Summary */}
      <div className="p-4 bg-terminal-bg rounded border border-terminal-border">
        <h4 className="text-xs text-terminal-muted uppercase tracking-wider mb-3">
          Estimated Tax Liability
        </h4>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-terminal-muted">Short-Term Tax (37%):</span>
            <span className="font-mono text-loss">${taxLiability.shortTermTax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-terminal-muted">Long-Term Tax (15%):</span>
            <span className="font-mono text-yellow-500">${taxLiability.longTermTax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm pt-2 border-t border-terminal-border">
            <span className="text-terminal-text font-medium">Total Tax Owed:</span>
            <span className="font-mono text-loss font-medium">${taxLiability.totalTax.toFixed(2)}</span>
          </div>
          {totalRealized > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-terminal-muted">Effective Tax Rate:</span>
              <span className="font-mono text-terminal-text">
                {(taxLiability.effectiveRate * 100).toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Unrealized Gains */}
      <div className="p-4 bg-terminal-bg rounded border border-terminal-border">
        <h4 className="text-xs text-terminal-muted uppercase tracking-wider mb-3">
          Unrealized Gains (Current Positions)
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-terminal-muted mb-1">Would be Short-Term</div>
            <div className={`text-lg font-mono ${unrealizedGains.shortTerm >= 0 ? 'text-gain' : 'text-loss'}`}>
              {unrealizedGains.shortTerm >= 0 ? '+' : ''}${unrealizedGains.shortTerm.toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-xs text-terminal-muted mb-1">Would be Long-Term</div>
            <div className={`text-lg font-mono ${unrealizedGains.longTerm >= 0 ? 'text-gain' : 'text-loss'}`}>
              {unrealizedGains.longTerm >= 0 ? '+' : ''}${unrealizedGains.longTerm.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Wash Sale Warning */}
      {realizedGains.washSaleDisallowed > 0 && (
        <div className="p-3 bg-loss/10 border border-loss/30 rounded flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-loss flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-medium text-loss">Wash Sale Adjustment</div>
            <div className="text-xs text-terminal-text mt-1">
              ${realizedGains.washSaleDisallowed.toFixed(2)} in losses were disallowed due to wash sale rules.
              These losses have been added to the cost basis of replacement shares.
            </div>
          </div>
        </div>
      )}

      {/* Educational Tip */}
      <div className="p-3 bg-terminal-accent/10 border border-terminal-accent/30 rounded">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-terminal-accent flex-shrink-0 mt-0.5" />
          <div className="text-xs text-terminal-text">
            <strong className="text-terminal-accent">Tax Tip:</strong> Long-term capital gains 
            (assets held over 1 year) are taxed at 15%, while short-term gains are taxed as 
            ordinary income up to 37%. Consider holding profitable positions longer to reduce 
            your tax burden.
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Gain Card Component
 */
function GainCard({ title, subtitle, amount, taxRate, icon: Icon, variant }) {
  const isPositive = amount >= 0;
  const taxAmount = Math.max(0, amount * taxRate);
  
  return (
    <div className={`p-3 rounded border ${
      variant === 'warning' 
        ? 'bg-yellow-500/5 border-yellow-500/30' 
        : 'bg-gain/5 border-gain/30'
    }`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${variant === 'warning' ? 'text-yellow-500' : 'text-gain'}`} />
        <div>
          <div className="text-sm font-medium text-terminal-text">{title}</div>
          <div className="text-xxs text-terminal-muted">{subtitle}</div>
        </div>
      </div>
      <div className={`text-xl font-mono ${isPositive ? 'text-gain' : 'text-loss'}`}>
        {isPositive ? '+' : ''}${amount.toFixed(2)}
      </div>
      <div className="text-xs text-terminal-muted mt-1">
        Tax ({(taxRate * 100).toFixed(0)}%): ${taxAmount.toFixed(2)}
      </div>
    </div>
  );
}

/**
 * 1099-B Report Tab
 */
function Report1099BTab({ orderHistory, taxLots }) {
  const sales = orderHistory.filter(o => o.side === 'SELL' && o.status === 'FILLED');
  
  return (
    <div className="space-y-4">
      {/* Report Header */}
      <div className="p-4 bg-terminal-bg rounded border border-terminal-border">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-medium text-terminal-text">Form 1099-B Simulation</h3>
            <p className="text-xs text-terminal-muted">Proceeds from Broker Transactions</p>
          </div>
          <button className="flex items-center gap-1 px-3 py-1.5 bg-terminal-border rounded text-xs hover:bg-terminal-muted/30 transition-colors">
            <Download className="w-3 h-3" />
            Export CSV
          </button>
        </div>
        
        <div className="grid grid-cols-4 gap-4 text-center">
          <div className="p-2 bg-terminal-surface rounded">
            <div className="text-xxs text-terminal-muted">Total Proceeds</div>
            <div className="text-sm font-mono text-terminal-text">
              ${sales.reduce((sum, s) => sum + (s.fillPrice * s.quantity), 0).toFixed(2)}
            </div>
          </div>
          <div className="p-2 bg-terminal-surface rounded">
            <div className="text-xxs text-terminal-muted">Total Cost Basis</div>
            <div className="text-sm font-mono text-terminal-text">--</div>
          </div>
          <div className="p-2 bg-terminal-surface rounded">
            <div className="text-xxs text-terminal-muted">Transactions</div>
            <div className="text-sm font-mono text-terminal-text">{sales.length}</div>
          </div>
          <div className="p-2 bg-terminal-surface rounded">
            <div className="text-xxs text-terminal-muted">Wash Sales</div>
            <div className="text-sm font-mono text-loss">0</div>
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="bg-terminal-bg rounded border border-terminal-border overflow-hidden">
        <div className="p-2 border-b border-terminal-border">
          <h4 className="text-xs text-terminal-muted uppercase tracking-wider">
            Reported Transactions
          </h4>
        </div>
        
        {sales.length === 0 ? (
          <div className="p-8 text-center text-terminal-muted">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No sales to report</p>
            <p className="text-xs mt-1">Sell positions to see 1099-B entries</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table text-xs">
              <thead>
                <tr>
                  <th>Date Sold</th>
                  <th>Symbol</th>
                  <th className="text-right">Qty</th>
                  <th className="text-right">Proceeds</th>
                  <th className="text-right">Cost Basis</th>
                  <th className="text-right">Gain/Loss</th>
                  <th>Term</th>
                </tr>
              </thead>
              <tbody>
                {sales.slice(-20).reverse().map((sale, i) => {
                  const proceeds = sale.fillPrice * sale.quantity;
                  // Simplified - would need to match with tax lots
                  const costBasis = proceeds * 0.95; // Placeholder
                  const gain = proceeds - costBasis;
                  
                  return (
                    <tr key={i}>
                      <td className="text-terminal-muted">
                        {new Date(sale.filledAt || sale.timestamp).toLocaleDateString()}
                      </td>
                      <td className="font-medium">{sale.ticker}</td>
                      <td className="text-right font-mono">{sale.quantity}</td>
                      <td className="text-right font-mono">${proceeds.toFixed(2)}</td>
                      <td className="text-right font-mono">${costBasis.toFixed(2)}</td>
                      <td className={`text-right font-mono ${gain >= 0 ? 'text-gain' : 'text-loss'}`}>
                        {gain >= 0 ? '+' : ''}${gain.toFixed(2)}
                      </td>
                      <td>
                        <span className="px-1.5 py-0.5 rounded text-xxs bg-yellow-500/20 text-yellow-500">
                          Short
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Educational Note */}
      <div className="p-3 bg-terminal-accent/10 border border-terminal-accent/30 rounded">
        <div className="text-xs text-terminal-text">
          <strong className="text-terminal-accent">About Form 1099-B:</strong> Your broker sends 
          this form to both you and the IRS, reporting your trading activity. It's crucial for 
          accurate tax filing. Discrepancies between your records and the 1099-B can trigger 
          an IRS notice.
        </div>
      </div>
    </div>
  );
}

/**
 * Cost Analysis Tab - The "Churning Lesson"
 */
function CostAnalysisTab({ tradingStats, realizedGains, taxLiability }) {
  const totalRealized = realizedGains.shortTerm + realizedGains.longTerm;
  const netAfterTax = totalRealized - taxLiability.totalTax;
  const totalFriction = taxLiability.totalTax + tradingStats.estimatedSlippage;
  
  // Hypothetical: What if all gains were long-term?
  const hypotheticalLTTax = Math.max(0, totalRealized * TAX_RATES.longTerm.flatRate);
  const taxSavingsIfLT = taxLiability.totalTax - hypotheticalLTTax;

  return (
    <div className="space-y-4">
      {/* Trading Activity Summary */}
      <div className="p-4 bg-terminal-bg rounded border border-terminal-border">
        <h4 className="text-xs text-terminal-muted uppercase tracking-wider mb-3">
          Your Trading Activity
        </h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-mono text-terminal-accent">{tradingStats.totalTrades}</div>
            <div className="text-xs text-terminal-muted">Total Trades</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-mono text-terminal-text">{tradingStats.avgHoldingDays}</div>
            <div className="text-xs text-terminal-muted">Avg Holding (Days)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-mono text-yellow-500">{tradingStats.tradesPerMonth}</div>
            <div className="text-xs text-terminal-muted">Trades/Month</div>
          </div>
        </div>
      </div>

      {/* The True Cost of Trading */}
      <div className="p-4 bg-terminal-bg rounded border border-terminal-border">
        <h4 className="text-xs text-terminal-muted uppercase tracking-wider mb-3">
          The True Cost of Trading
        </h4>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-gain" />
              <span className="text-sm text-terminal-text">Gross Realized Gains</span>
            </div>
            <span className="font-mono text-gain">${totalRealized.toFixed(2)}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 pl-6">
              <span className="text-terminal-muted">− Taxes</span>
            </div>
            <span className="font-mono text-loss">-${taxLiability.totalTax.toFixed(2)}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 pl-6">
              <span className="text-terminal-muted">− Est. Slippage/Fees</span>
            </div>
            <span className="font-mono text-loss">-${tradingStats.estimatedSlippage.toFixed(2)}</span>
          </div>
          
          <div className="flex items-center justify-between pt-2 border-t border-terminal-border">
            <span className="text-sm font-medium text-terminal-text">Net After All Costs</span>
            <span className={`font-mono font-medium ${netAfterTax >= 0 ? 'text-gain' : 'text-loss'}`}>
              ${(netAfterTax - tradingStats.estimatedSlippage).toFixed(2)}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-xs">
            <span className="text-terminal-muted">Friction as % of Gross</span>
            <span className="font-mono text-loss">
              {totalRealized > 0 ? ((totalFriction / totalRealized) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Churning Comparison */}
      <div className="p-4 bg-terminal-bg rounded border border-terminal-border">
        <h4 className="text-xs text-terminal-muted uppercase tracking-wider mb-3">
          💡 The "What If" Scenario
        </h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-loss/10 border border-loss/30 rounded">
            <div className="text-xs text-loss font-medium mb-1">Your Strategy</div>
            <div className="text-xs text-terminal-muted mb-2">
              Avg hold: {tradingStats.avgHoldingDays} days
            </div>
            <div className="text-lg font-mono text-terminal-text">
              ${(netAfterTax - tradingStats.estimatedSlippage).toFixed(2)}
            </div>
            <div className="text-xxs text-terminal-muted">Net after tax & fees</div>
          </div>
          
          <div className="p-3 bg-gain/10 border border-gain/30 rounded">
            <div className="text-xs text-gain font-medium mb-1">If Held 1+ Year</div>
            <div className="text-xs text-terminal-muted mb-2">
              Same gains, 15% tax
            </div>
            <div className="text-lg font-mono text-terminal-text">
              ${(totalRealized - hypotheticalLTTax).toFixed(2)}
            </div>
            <div className="text-xxs text-terminal-muted">Net with LT rates</div>
          </div>
        </div>
        
        {taxSavingsIfLT > 0 && (
          <div className="mt-3 p-2 bg-terminal-accent/10 rounded text-center">
            <span className="text-sm text-terminal-accent font-medium">
              Potential tax savings from holding longer: ${taxSavingsIfLT.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* Key Insight */}
      <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-terminal-text">
            <strong className="text-yellow-500">The Churning Lesson:</strong> Active traders often 
            underestimate how much taxes and fees erode their returns. A 20% gross return can 
            become 12% net after short-term capital gains taxes (37%) and trading friction. 
            Meanwhile, a patient investor with the same 20% gain, held long-term, keeps ~17%.
          </div>
        </div>
      </div>
    </div>
  );
}

export default TaxDashboard;
