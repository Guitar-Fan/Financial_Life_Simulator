/**
 * WashSaleAlert - Wash sale detection and education
 * 
 * Features:
 * - Real-time wash sale rule monitoring
 * - 30-day window visualization
 * - Disallowed loss tracking
 * - Educational explanations
 * 
 * Educational Purpose: Prevents costly tax mistakes
 */

import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Shield,
  Clock,
  Calendar,
  Info,
  XCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { usePlayerStore } from '../../stores/playerStore';
import { useMarketStore } from '../../stores/marketStore';

export function WashSaleAlert() {
  const [showDetails, setShowDetails] = useState(false);
  const { taxLots, orderHistory, realizedGains } = usePlayerStore();
  const { tickers } = useMarketStore();

  // Analyze for potential wash sales
  const washSaleAnalysis = useMemo(() => {
    const now = new Date();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    
    const potentialWashSales = [];
    const triggeredWashSales = [];
    
    // Get all sells with losses in the last 30 days
    const recentSells = orderHistory.filter(o => {
      if (o.side !== 'SELL' || o.status !== 'FILLED') return false;
      const sellDate = new Date(o.filledAt || o.timestamp);
      return (now - sellDate) <= thirtyDays;
    });
    
    // For each recent sell, check if there's a potential wash sale
    for (const sell of recentSells) {
      const sellDate = new Date(sell.filledAt || sell.timestamp);
      
      // Find matching purchases within 30 days before or after the sale
      const matchingPurchases = orderHistory.filter(o => {
        if (o.side !== 'BUY' || o.status !== 'FILLED') return false;
        if (o.ticker !== sell.ticker) return false;
        
        const buyDate = new Date(o.filledAt || o.timestamp);
        const daysDiff = Math.abs(buyDate - sellDate) / (1000 * 60 * 60 * 24);
        
        return daysDiff <= 30;
      });
      
      if (matchingPurchases.length > 0) {
        // Estimate if this was a loss sale (simplified)
        const avgCost = taxLots
          .filter(lot => lot.ticker === sell.ticker)
          .reduce((sum, lot) => sum + lot.costBasis, 0) / 
          Math.max(1, taxLots.filter(lot => lot.ticker === sell.ticker).length);
        
        const wasLoss = sell.fillPrice < avgCost;
        
        if (wasLoss) {
          triggeredWashSales.push({
            ticker: sell.ticker,
            sellDate: sellDate,
            sellPrice: sell.fillPrice,
            quantity: sell.quantity,
            matchingBuys: matchingPurchases.length,
            estimatedDisallowedLoss: (avgCost - sell.fillPrice) * sell.quantity
          });
        }
      }
    }
    
    // Check for positions at risk (current holdings with unrealized losses)
    const atRiskPositions = [];
    
    for (const lot of taxLots) {
      if (lot.shares <= 0) continue;
      
      const currentPrice = tickers[lot.ticker]?.price || lot.costBasis;
      const unrealizedLoss = (lot.costBasis - currentPrice) * lot.shares;
      
      if (unrealizedLoss > 0) {
        // Check if there have been recent purchases of this ticker
        const recentPurchases = orderHistory.filter(o => {
          if (o.side !== 'BUY' || o.status !== 'FILLED') return false;
          if (o.ticker !== lot.ticker) return false;
          
          const buyDate = new Date(o.filledAt || o.timestamp);
          return (now - buyDate) <= thirtyDays;
        });
        
        if (recentPurchases.length > 0) {
          atRiskPositions.push({
            ticker: lot.ticker,
            shares: lot.shares,
            costBasis: lot.costBasis,
            currentPrice,
            unrealizedLoss,
            recentPurchaseDate: new Date(recentPurchases[0].filledAt || recentPurchases[0].timestamp)
          });
        }
      }
    }
    
    return {
      triggeredWashSales,
      atRiskPositions,
      totalDisallowed: realizedGains.washSaleDisallowed,
      hasActiveRisks: atRiskPositions.length > 0,
      hasTriggeredSales: triggeredWashSales.length > 0
    };
  }, [taxLots, orderHistory, tickers, realizedGains]);

  const hasIssues = washSaleAnalysis.hasActiveRisks || washSaleAnalysis.hasTriggeredSales;

  return (
    <div className="h-full flex flex-col">
      {/* Panel Header */}
      <div className="terminal-header drag-handle cursor-move">
        <div className="flex items-center gap-2">
          <Shield className="w-3 h-3" />
          <span>Wash Sale Monitor</span>
        </div>
        {hasIssues ? (
          <span className="flex items-center gap-1 text-xxs text-yellow-500">
            <AlertTriangle className="w-3 h-3" />
            Attention
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xxs text-gain">
            <CheckCircle className="w-3 h-3" />
            Clear
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-3 space-y-4">
        {/* Status Banner */}
        <div className={`p-4 rounded border ${
          hasIssues 
            ? 'bg-yellow-500/10 border-yellow-500/30'
            : 'bg-gain/10 border-gain/30'
        }`}>
          <div className="flex items-center gap-3">
            {hasIssues ? (
              <AlertTriangle className="w-6 h-6 text-yellow-500" />
            ) : (
              <CheckCircle className="w-6 h-6 text-gain" />
            )}
            <div>
              <div className={`font-medium ${hasIssues ? 'text-yellow-500' : 'text-gain'}`}>
                {hasIssues 
                  ? 'Wash Sale Risk Detected'
                  : 'No Wash Sale Issues'}
              </div>
              <div className="text-xs text-terminal-muted mt-0.5">
                {hasIssues
                  ? `${washSaleAnalysis.atRiskPositions.length} position(s) at risk`
                  : 'Your recent trades comply with wash sale rules'}
              </div>
            </div>
          </div>
        </div>

        {/* Disallowed Losses Summary */}
        {washSaleAnalysis.totalDisallowed > 0 && (
          <div className="p-3 bg-loss/10 border border-loss/30 rounded">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-loss" />
                <span className="text-sm text-terminal-text">Disallowed Losses</span>
              </div>
              <span className="font-mono text-loss">
                ${washSaleAnalysis.totalDisallowed.toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-terminal-muted mt-2">
              These losses cannot be claimed on your tax return. The disallowed amount 
              has been added to the cost basis of your replacement shares.
            </p>
          </div>
        )}

        {/* At-Risk Positions */}
        {washSaleAnalysis.atRiskPositions.length > 0 && (
          <div className="bg-terminal-bg rounded border border-terminal-border overflow-hidden">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full px-3 py-2 flex items-center justify-between hover:bg-terminal-border/30"
            >
              <span className="text-sm font-medium text-terminal-text">
                Positions at Risk ({washSaleAnalysis.atRiskPositions.length})
              </span>
              {showDetails ? (
                <ChevronUp className="w-4 h-4 text-terminal-muted" />
              ) : (
                <ChevronDown className="w-4 h-4 text-terminal-muted" />
              )}
            </button>
            
            {showDetails && (
              <div className="border-t border-terminal-border">
                {washSaleAnalysis.atRiskPositions.map((pos, i) => (
                  <div key={i} className="px-3 py-2 border-b border-terminal-border/50 last:border-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-terminal-text">{pos.ticker}</span>
                      <span className="text-xs text-loss font-mono">
                        -${pos.unrealizedLoss.toFixed(2)} unrealized
                      </span>
                    </div>
                    <div className="text-xs text-terminal-muted">
                      {pos.shares} shares @ ${pos.costBasis.toFixed(2)} • 
                      Recent buy on {pos.recentPurchaseDate.toLocaleDateString()}
                    </div>
                    <div className="mt-1 text-xs text-yellow-500">
                      ⚠️ Selling now would trigger a wash sale
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 30-Day Rule Explanation */}
        <div className="p-4 bg-terminal-bg rounded border border-terminal-border">
          <h4 className="text-xs text-terminal-muted uppercase tracking-wider mb-3 flex items-center gap-2">
            <Calendar className="w-3 h-3" />
            The 30-Day Rule
          </h4>
          
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-16 text-center">
                <div className="text-lg font-mono text-terminal-accent">30</div>
                <div className="text-xxs text-terminal-muted">days before</div>
              </div>
              <div className="flex-1 flex items-center">
                <div className="flex-1 h-1 bg-loss/30 rounded-l" />
              </div>
              <div className="flex-shrink-0 w-12 text-center">
                <div className="text-sm font-mono text-loss">SELL</div>
                <div className="text-xxs text-terminal-muted">at loss</div>
              </div>
              <div className="flex-1 flex items-center">
                <div className="flex-1 h-1 bg-loss/30 rounded-r" />
              </div>
              <div className="flex-shrink-0 w-16 text-center">
                <div className="text-lg font-mono text-terminal-accent">30</div>
                <div className="text-xxs text-terminal-muted">days after</div>
              </div>
            </div>
            
            <p className="text-xs text-terminal-muted">
              If you buy "substantially identical" securities within 30 days 
              <strong className="text-terminal-text"> before or after </strong> 
              selling at a loss, the loss is disallowed.
            </p>
          </div>
        </div>

        {/* Educational Tips */}
        <div className="p-3 bg-terminal-accent/10 border border-terminal-accent/30 rounded">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-terminal-accent flex-shrink-0 mt-0.5" />
            <div className="text-xs text-terminal-text space-y-2">
              <p>
                <strong className="text-terminal-accent">Avoiding Wash Sales:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 text-terminal-muted">
                <li>Wait 31+ days before repurchasing the same stock</li>
                <li>Buy a similar but not "substantially identical" security</li>
                <li>Use tax-loss harvesting strategically at year-end</li>
                <li>Track your 30-day windows carefully</li>
              </ul>
            </div>
          </div>
        </div>

        {/* What Counts as Substantially Identical */}
        <div className="p-3 bg-terminal-bg rounded border border-terminal-border">
          <h4 className="text-xs text-terminal-muted uppercase tracking-wider mb-2">
            What's "Substantially Identical"?
          </h4>
          <div className="text-xs text-terminal-text space-y-1">
            <p>✓ Same stock or security</p>
            <p>✓ Options on the same stock</p>
            <p>✓ Contracts to acquire the stock</p>
            <p className="text-terminal-muted">✗ Different companies in same sector (usually OK)</p>
            <p className="text-terminal-muted">✗ Different ETFs tracking same index (gray area)</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WashSaleAlert;
