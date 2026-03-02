/**
 * FeeTransparencyPanel - Trading costs breakdown
 * 
 * Features:
 * - SEC fees, FINRA TAF calculation
 * - Slippage tracking per trade
 * - Total cost of ownership analysis
 * - Commission comparison (historical context)
 * 
 * Educational Purpose: Shows the hidden costs that erode returns
 */

import React, { useMemo } from 'react';
import {
  Receipt,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  Info,
  BarChart3,
  Calculator
} from 'lucide-react';
import { usePlayerStore } from '../../stores/playerStore';
import { calculateRoundTripCost } from '../../utils/slippage';
import { useBeginnerMode } from '../education/BeginnerMode';
import { Term, PanelHelp } from '../education/TermHighlight';

// Current SEC and FINRA fee rates (as of 2024)
const FEE_RATES = {
  sec: {
    rate: 0.00002290, // $22.90 per $1,000,000
    description: 'SEC Transaction Fee',
    appliesTo: 'Sales only'
  },
  finraTaf: {
    rate: 0.000119, // $0.000119 per share
    cap: 5.95,
    description: 'FINRA Trading Activity Fee',
    appliesTo: 'Sales only'
  },
  // Historical comparison
  traditionalCommission: {
    rate: 9.95, // Per trade (historical)
    description: 'Traditional Broker Commission (pre-2019)'
  }
};

export function FeeTransparencyPanel() {
  const { orderHistory } = usePlayerStore();
  
  // Calculate all fees from order history
  const feeBreakdown = useMemo(() => {
    let totalSECFees = 0;
    let totalFINRAFees = 0;
    let totalSlippage = 0;
    let totalVolume = 0;
    let sellVolume = 0;
    let sellCount = 0;
    let totalTrades = 0;
    
    const filledOrders = orderHistory.filter(o => o.status === 'FILLED');
    
    for (const order of filledOrders) {
      const orderValue = order.fillPrice * order.quantity;
      totalVolume += orderValue;
      totalTrades++;
      
      if (order.side === 'SELL') {
        sellVolume += orderValue;
        sellCount++;
        
        // SEC fee (on sales)
        totalSECFees += orderValue * FEE_RATES.sec.rate;
        
        // FINRA TAF (on sales, capped)
        const finraFee = Math.min(order.quantity * FEE_RATES.finraTaf.rate, FEE_RATES.finraTaf.cap);
        totalFINRAFees += finraFee;
      }
      
      // Estimate slippage (simplified - would be tracked per order in real system)
      const estimatedSlippage = orderValue * 0.0005; // 5 bps average
      totalSlippage += estimatedSlippage;
    }
    
    // What traditional commissions would have been
    const traditionalCommissions = totalTrades * FEE_RATES.traditionalCommission.rate;
    
    return {
      secFees: totalSECFees,
      finraFees: totalFINRAFees,
      slippage: totalSlippage,
      totalFees: totalSECFees + totalFINRAFees,
      totalFriction: totalSECFees + totalFINRAFees + totalSlippage,
      totalVolume,
      sellVolume,
      totalTrades,
      sellCount,
      traditionalCommissions,
      savingsVsTraditional: traditionalCommissions - (totalSECFees + totalFINRAFees),
      avgFeePerTrade: totalTrades > 0 ? (totalSECFees + totalFINRAFees) / totalTrades : 0,
      feeAsPercentOfVolume: totalVolume > 0 ? ((totalSECFees + totalFINRAFees) / totalVolume) * 100 : 0
    };
  }, [orderHistory]);

  return (
    <div className="h-full flex flex-col">
      {/* Panel Header */}
      <div className="terminal-header drag-handle cursor-move">
        <div className="flex items-center gap-2">
          <Receipt className="w-3 h-3" />
          <span>💳 Hidden Costs</span>
        </div>
        <span className="text-xxs text-terminal-muted">
          {feeBreakdown.totalTrades} trades
        </span>
      </div>

      <PanelHelp id="fee-transparency">
        Trading isn't free! Even on "commission-free" apps, there are tiny fees from the SEC and FINRA (financial regulators),
        plus "slippage" (the price moving slightly between when you click Buy and when it actually executes).
        These small costs add up fast, especially if you trade a lot!
      </PanelHelp>

      {/* Content */}
      <div className="flex-1 overflow-auto p-3 space-y-4">
        {/* Total Friction Summary */}
        <div className="p-4 bg-terminal-bg rounded border border-terminal-border">
          <h4 className="text-xs text-terminal-muted uppercase tracking-wider mb-3">
            Total Trading Friction
          </h4>
          
          <div className="text-3xl font-mono text-loss mb-2">
            ${feeBreakdown.totalFriction.toFixed(2)}
          </div>
          
          <div className="text-xs text-terminal-muted">
            {feeBreakdown.feeAsPercentOfVolume.toFixed(4)}% of total volume
          </div>
          
          {/* Friction breakdown bar */}
          <div className="mt-3 h-2 bg-terminal-border rounded overflow-hidden flex">
            {feeBreakdown.totalFriction > 0 && (
              <>
                <div 
                  className="h-full bg-loss"
                  style={{ width: `${(feeBreakdown.secFees / feeBreakdown.totalFriction) * 100}%` }}
                  title="SEC Fees"
                />
                <div 
                  className="h-full bg-yellow-500"
                  style={{ width: `${(feeBreakdown.finraFees / feeBreakdown.totalFriction) * 100}%` }}
                  title="FINRA Fees"
                />
                <div 
                  className="h-full bg-terminal-accent"
                  style={{ width: `${(feeBreakdown.slippage / feeBreakdown.totalFriction) * 100}%` }}
                  title="Slippage"
                />
              </>
            )}
          </div>
          
          <div className="mt-2 flex items-center gap-4 text-xxs">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-loss rounded" />
              SEC
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-yellow-500 rounded" />
              FINRA
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-terminal-accent rounded" />
              Slippage
            </span>
          </div>
        </div>

        {/* Fee Breakdown */}
        <div className="p-4 bg-terminal-bg rounded border border-terminal-border">
          <h4 className="text-xs text-terminal-muted uppercase tracking-wider mb-3">
            Fee Breakdown
          </h4>
          
          <div className="space-y-3">
            <FeeRow
              label="SEC Transaction Fee"
              amount={feeBreakdown.secFees}
              description="$22.90 per $1M of sales"
              icon={DollarSign}
            />
            
            <FeeRow
              label="FINRA TAF"
              amount={feeBreakdown.finraFees}
              description="$0.000119/share, max $5.95"
              icon={DollarSign}
            />
            
            <FeeRow
              label="Estimated Slippage"
              amount={feeBreakdown.slippage}
              description="Bid/ask spread + market impact"
              icon={TrendingDown}
              variant="accent"
            />
            
            <div className="pt-2 border-t border-terminal-border flex justify-between">
              <span className="text-sm font-medium text-terminal-text">Total Friction</span>
              <span className="font-mono text-loss font-medium">
                ${feeBreakdown.totalFriction.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Trading Volume Stats */}
        <div className="p-4 bg-terminal-bg rounded border border-terminal-border">
          <h4 className="text-xs text-terminal-muted uppercase tracking-wider mb-3">
            Trading Activity
          </h4>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="p-2 bg-terminal-surface rounded">
              <div className="text-xxs text-terminal-muted">Total Volume</div>
              <div className="text-sm font-mono">${feeBreakdown.totalVolume.toFixed(0)}</div>
            </div>
            <div className="p-2 bg-terminal-surface rounded">
              <div className="text-xxs text-terminal-muted">Sell Volume</div>
              <div className="text-sm font-mono">${feeBreakdown.sellVolume.toFixed(0)}</div>
            </div>
            <div className="p-2 bg-terminal-surface rounded">
              <div className="text-xxs text-terminal-muted">Total Trades</div>
              <div className="text-sm font-mono">{feeBreakdown.totalTrades}</div>
            </div>
            <div className="p-2 bg-terminal-surface rounded">
              <div className="text-xxs text-terminal-muted">Avg Fee/Trade</div>
              <div className="text-sm font-mono">${feeBreakdown.avgFeePerTrade.toFixed(4)}</div>
            </div>
          </div>
        </div>

        {/* Historical Comparison */}
        <div className="p-4 bg-gain/5 border border-gain/30 rounded">
          <h4 className="text-xs text-gain uppercase tracking-wider mb-3 flex items-center gap-2">
            <Calculator className="w-3 h-3" />
            Commission-Free Savings
          </h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-terminal-muted mb-1">Pre-2019 Commissions</div>
              <div className="text-lg font-mono text-terminal-text line-through opacity-50">
                ${feeBreakdown.traditionalCommissions.toFixed(2)}
              </div>
              <div className="text-xxs text-terminal-muted">
                @ $9.95/trade × {feeBreakdown.totalTrades} trades
              </div>
            </div>
            <div>
              <div className="text-xs text-terminal-muted mb-1">Your Actual Fees</div>
              <div className="text-lg font-mono text-gain">
                ${feeBreakdown.totalFees.toFixed(2)}
              </div>
              <div className="text-xxs text-terminal-muted">
                SEC + FINRA only
              </div>
            </div>
          </div>
          
          <div className="mt-3 p-2 bg-gain/10 rounded text-center">
            <span className="text-sm text-gain font-medium">
              You saved ${feeBreakdown.savingsVsTraditional.toFixed(2)} vs traditional brokers!
            </span>
          </div>
        </div>

        {/* Educational Note */}
        <div className="p-3 bg-terminal-accent/10 border border-terminal-accent/30 rounded">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-terminal-accent flex-shrink-0 mt-0.5" />
            <div className="text-xs text-terminal-text">
              <strong className="text-terminal-accent">The Hidden Cost:</strong> While 
              commission-free trading has eliminated explicit fees, slippage remains. 
              The bid-ask spread and market impact on your orders typically cost 5-50 
              basis points per trade. Active traders can lose 1-2% annually to slippage alone.
            </div>
          </div>
        </div>

        {/* Slippage Warning for Active Traders */}
        {feeBreakdown.totalTrades > 20 && (
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-terminal-text">
                <strong className="text-yellow-500">High Trading Activity:</strong> With {' '}
                {feeBreakdown.totalTrades} trades, your estimated slippage of ${feeBreakdown.slippage.toFixed(2)} {' '}
                may be significantly impacting your returns. Consider reducing trade frequency 
                or using limit orders to minimize market impact.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Fee Row Component
 */
function FeeRow({ label, amount, description, icon: Icon, variant = 'default' }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${
          variant === 'accent' ? 'text-terminal-accent' : 'text-terminal-muted'
        }`} />
        <div>
          <div className="text-sm text-terminal-text">{label}</div>
          <div className="text-xxs text-terminal-muted">{description}</div>
        </div>
      </div>
      <span className={`font-mono ${
        variant === 'accent' ? 'text-terminal-accent' : 'text-loss'
      }`}>
        ${amount.toFixed(4)}
      </span>
    </div>
  );
}

export default FeeTransparencyPanel;
