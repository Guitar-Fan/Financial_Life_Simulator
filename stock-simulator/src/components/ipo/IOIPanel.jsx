/**
 * IOIPanel - Indication of Interest Submission
 * 
 * Features:
 * - Submit non-binding bids for IPO shares
 * - Specify share quantity and maximum price
 * - View pending IOIs and allocation results
 * - Educational tips about the IOI process
 * 
 * Educational Purpose: Teaches how retail investors participate in IPOs,
 * and why their allocations are typically limited.
 */

import React, { useState, useMemo } from 'react';
import { 
  Send, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  XCircle,
  HelpCircle,
  DollarSign,
  Hash,
  Info,
  Calculator
} from 'lucide-react';
import { useIPOStore } from '../../stores/ipoStore';
import { usePlayerStore } from '../../stores/playerStore';
import { IPO_STATUS, simulateMarketDemand, calculateAllocation, simulateOpeningTrade, compareEntryStrategies } from '../../utils/ipoAllocation';
import { useBeginnerMode } from '../education/BeginnerMode';
import { Term, PanelHelp } from '../education/TermHighlight';

export function IOIPanel() {
  const { selectedIPO, ipoCalendar, playerIOIs, allocations, submitIOI, cancelIOI, processAllocation } = useIPOStore();
  const { cash } = usePlayerStore();
  
  const [shares, setShares] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  const ipo = useMemo(() => 
    ipoCalendar.find(i => i.id === selectedIPO), 
    [ipoCalendar, selectedIPO]
  );

  const existingIOI = selectedIPO ? playerIOIs[selectedIPO] : null;
  const existingAllocation = selectedIPO ? allocations[selectedIPO] : null;

  // Auto-fill max price with high end of range
  React.useEffect(() => {
    if (ipo && !maxPrice) {
      setMaxPrice(ipo.priceRange.high.toString());
    }
  }, [ipo, maxPrice]);

  // Calculate estimated cost
  const estimatedCost = useMemo(() => {
    const qty = parseInt(shares) || 0;
    const price = parseFloat(maxPrice) || (ipo?.priceRange.high || 0);
    return qty * price;
  }, [shares, maxPrice, ipo]);

  // Validation
  const validation = useMemo(() => {
    const errors = [];
    const qty = parseInt(shares) || 0;
    const price = parseFloat(maxPrice) || 0;

    if (!ipo) {
      errors.push('Select an IPO first');
      return { isValid: false, errors };
    }

    if (ipo.status !== IPO_STATUS.PRICING && ipo.status !== IPO_STATUS.UPCOMING) {
      errors.push('This IPO is not accepting IOIs');
      return { isValid: false, errors };
    }

    if (qty <= 0) {
      errors.push('Enter a valid share quantity');
    }

    if (qty > 1000) {
      errors.push('Maximum 1,000 shares per retail IOI');
    }

    if (price < ipo.priceRange.low) {
      errors.push(`Max price must be at least $${ipo.priceRange.low}`);
    }

    if (estimatedCost > cash) {
      errors.push('Insufficient funds for this order size');
    }

    if (existingIOI && existingIOI.status === 'PENDING') {
      errors.push('You already have a pending IOI for this IPO');
    }

    return { isValid: errors.length === 0, errors };
  }, [ipo, shares, maxPrice, estimatedCost, cash, existingIOI]);

  // Handle IOI submission
  const handleSubmit = () => {
    if (!validation.isValid || !ipo) return;

    const result = submitIOI(ipo.id, parseInt(shares), parseFloat(maxPrice));
    
    if (result.success) {
      setShares('');
      // Keep maxPrice for convenience
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (existingIOI && ipo) {
      cancelIOI(ipo.id);
    }
  };

  // Simulate allocation (for demo/testing)
  const handleSimulateAllocation = () => {
    if (!ipo || !existingIOI) return;

    const marketDemand = simulateMarketDemand(ipo);
    const allocationResult = calculateAllocation(existingIOI, ipo, marketDemand);
    
    // Add opening trade simulation
    if (allocationResult.sharesAllocated > 0) {
      const openingTrade = simulateOpeningTrade(ipo, allocationResult.allocationPrice, marketDemand);
      allocationResult.openPrice = openingTrade.openPrice;
      allocationResult.dayOneClose = openingTrade.dayOneClose;
      allocationResult.openPop = openingTrade.openPop;
    }

    processAllocation(ipo.id, allocationResult);
  };

  if (!ipo) {
    return (
      <div className="h-full flex flex-col">
        <div className="terminal-header drag-handle cursor-move">
          <div className="flex items-center gap-2">
            <Send className="w-3 h-3" />
            <span>✉️ Request Shares</span>
          </div>
        </div>
        <PanelHelp id="ioi-empty">
          Want to buy shares in a new company? Submit a request here! Select an IPO from the calendar first.
        </PanelHelp>
        <div className="flex-1 flex items-center justify-center text-terminal-muted p-4">
          <div className="text-center">
            <Send className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Select an IPO to request shares</p>
            <p className="text-xs mt-1">Pick a company you're interested in!</p>
          </div>
        </div>
      </div>
    );
  }

  const canSubmitIOI = ipo.status === IPO_STATUS.PRICING || ipo.status === IPO_STATUS.UPCOMING;

  return (
    <div className="h-full flex flex-col">
      {/* Panel Header */}
      <div className="terminal-header drag-handle cursor-move">
        <div className="flex items-center gap-2">
          <Send className="w-3 h-3" />
          <span>✉️ Request Shares</span>
        </div>
        <button 
          onClick={() => setShowHelp(!showHelp)}
          className="text-terminal-muted hover:text-terminal-text"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>

      <PanelHelp id="ioi-request">
        This is where you tell the company "I'd like to buy some of your new shares!" It's called an Indication of Interest (IOI).
        You might not get all the shares you ask for if lots of people want them too.
      </PanelHelp>

      {/* Help Panel */}
      {showHelp && (
        <div className="p-3 bg-terminal-accent/10 border-b border-terminal-accent/30">
          <h4 className="text-xs font-medium text-terminal-accent mb-1">What is an IOI? 🤔</h4>
          <p className="text-xs text-terminal-text">
            An <strong>Indication of Interest</strong> is like raising your hand to say 
            "I want some shares!" It's not a guarantee — if the company is super popular, 
            lots of people will want shares and you might only get a few, or none at all. 
            Think of it like trying to get tickets to a sold-out concert.
          </p>
        </div>
      )}

      {/* IPO Summary */}
      <div className="px-3 py-2 bg-terminal-bg border-b border-terminal-border">
        <div className="flex items-center justify-between mb-1">
          <span className="font-medium text-terminal-text">{ipo.company}</span>
          <span className="font-mono text-terminal-accent">{ipo.ticker}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-terminal-muted">
          <span>Price Range: ${ipo.priceRange.low} - ${ipo.priceRange.high}</span>
          <StatusBadge status={ipo.status} />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-3">
        {/* Existing Allocation Result */}
        {existingAllocation && (
          <AllocationResult allocation={existingAllocation} ipo={ipo} />
        )}

        {/* Existing Pending IOI */}
        {existingIOI && existingIOI.status === 'PENDING' && !existingAllocation && (
          <PendingIOI 
            ioi={existingIOI} 
            onCancel={handleCancel}
            onSimulate={handleSimulateAllocation}
          />
        )}

        {/* IOI Form */}
        {canSubmitIOI && (!existingIOI || existingIOI.status === 'CANCELLED') && (
          <div className="space-y-4">
            {/* Share Quantity */}
            <div>
              <label className="flex items-center gap-1 text-xs text-terminal-muted mb-1">
                <Hash className="w-3 h-3" />
                How Many Shares?
              </label>
              <input
                type="number"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                className="input-field"
                placeholder="100"
                min="1"
                max="1000"
              />
              <div className="flex justify-between mt-1">
                <span className="text-xxs text-terminal-muted">Max: 1,000 shares (retail limit)</span>
                <div className="flex gap-1">
                  {[50, 100, 250, 500].map((qty) => (
                    <button
                      key={qty}
                      onClick={() => setShares(qty.toString())}
                      className="px-2 py-0.5 text-xxs bg-terminal-border rounded hover:bg-terminal-muted/30"
                    >
                      {qty}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Maximum Price */}
            <div>
              <label className="flex items-center gap-1 text-xs text-terminal-muted mb-1">
                <DollarSign className="w-3 h-3" />
                Max Price You'll Pay
              </label>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="input-field"
                placeholder={ipo.priceRange.high.toString()}
                step="0.01"
                min={ipo.priceRange.low}
              />
              <p className="text-xxs text-terminal-muted mt-1">
                You won't pay more than this. If the IPO prices higher, you won't participate.
              </p>
            </div>

            {/* Estimated Cost */}
            <div className="p-3 bg-terminal-bg rounded border border-terminal-border">
              <div className="flex items-center justify-between">
                <span className="text-xs text-terminal-muted">Most You'd Spend:</span>
                <span className="font-mono text-terminal-text">${estimatedCost.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-terminal-muted">Available Cash:</span>
                <span className={`font-mono ${cash >= estimatedCost ? 'text-gain' : 'text-loss'}`}>
                  ${cash.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Validation Errors */}
            {validation.errors.length > 0 && (
              <div className="p-2 bg-loss/10 border border-loss/30 rounded">
                {validation.errors.map((err, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-loss">
                    <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                    {err}
                  </div>
                ))}
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={!validation.isValid}
              className="w-full py-2 bg-terminal-accent text-white font-medium rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              🚀 Request These Shares!
            </button>

            {/* Disclaimer */}
            <p className="text-xxs text-terminal-muted text-center">
              This is just a request — you might get fewer shares than you asked for, or none at all. That's normal!
            </p>
          </div>
        )}

        {/* Not Accepting IOIs */}
        {!canSubmitIOI && !existingAllocation && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-terminal-muted">
              <XCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">This IPO is not accepting IOIs</p>
              <p className="text-xs mt-1">Status: {ipo.status}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Status Badge Component
 */
function StatusBadge({ status }) {
  const config = {
    [IPO_STATUS.UPCOMING]: { color: 'bg-yellow-500/20 text-yellow-500', label: 'Upcoming' },
    [IPO_STATUS.PRICING]: { color: 'bg-terminal-accent/20 text-terminal-accent', label: 'Accepting IOIs' },
    [IPO_STATUS.PRICED]: { color: 'bg-purple-500/20 text-purple-400', label: 'Priced' },
    [IPO_STATUS.COMPLETED]: { color: 'bg-gain/20 text-gain', label: 'Trading' },
    [IPO_STATUS.WITHDRAWN]: { color: 'bg-loss/20 text-loss', label: 'Withdrawn' }
  }[status] || { color: 'bg-terminal-border text-terminal-muted', label: status };

  return (
    <span className={`px-1.5 py-0.5 rounded text-xxs ${config.color}`}>
      {config.label}
    </span>
  );
}

/**
 * Pending IOI Display
 */
function PendingIOI({ ioi, onCancel, onSimulate }) {
  return (
    <div className="space-y-4">
      <div className="p-4 bg-terminal-accent/10 border border-terminal-accent/30 rounded">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-5 h-5 text-terminal-accent" />
          <span className="font-medium text-terminal-text">IOI Pending</span>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-terminal-muted">Shares Requested:</span>
            <span className="font-mono text-terminal-text">{ioi.shares}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-terminal-muted">Max Price:</span>
            <span className="font-mono text-terminal-text">${ioi.maxPrice}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-terminal-muted">Submitted:</span>
            <span className="text-terminal-text">
              {new Date(ioi.submittedAt).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Educational Note */}
      <div className="p-3 bg-terminal-bg rounded border border-terminal-border">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-terminal-accent flex-shrink-0 mt-0.5" />
          <div className="text-xs text-terminal-muted">
            Your IOI has been submitted. Allocation will be determined when the IPO prices.
            Hot IPOs are often 10-20x oversubscribed, meaning you may receive only a 
            fraction of your requested shares—or none at all.
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 py-2 border border-terminal-border text-terminal-muted font-medium rounded hover:bg-terminal-border transition-colors"
        >
          Cancel IOI
        </button>
        <button
          onClick={onSimulate}
          className="flex-1 py-2 bg-terminal-accent text-white font-medium rounded flex items-center justify-center gap-2"
        >
          <Calculator className="w-4 h-4" />
          Simulate Allocation
        </button>
      </div>
    </div>
  );
}

/**
 * Allocation Result Display
 */
function AllocationResult({ allocation, ipo }) {
  const gotShares = allocation.sharesAllocated > 0;
  
  // Calculate comparison if we got shares
  const comparison = gotShares && allocation.openPrice
    ? compareEntryStrategies(
        allocation,
        allocation.openPrice,
        allocation.dayOneClose || allocation.openPrice,
        allocation.allocationPrice
      )
    : null;

  return (
    <div className="space-y-4">
      {/* Result Banner */}
      <div className={`p-4 rounded border ${
        gotShares 
          ? 'bg-gain/10 border-gain/30' 
          : 'bg-loss/10 border-loss/30'
      }`}>
        <div className="flex items-center gap-2 mb-2">
          {gotShares ? (
            <CheckCircle className="w-5 h-5 text-gain" />
          ) : (
            <XCircle className="w-5 h-5 text-loss" />
          )}
          <span className={`font-medium ${gotShares ? 'text-gain' : 'text-loss'}`}>
            {gotShares ? 'Allocation Received!' : 'No Allocation'}
          </span>
        </div>
        <p className="text-sm text-terminal-text">{allocation.reason}</p>
      </div>

      {/* Allocation Details */}
      {gotShares && (
        <div className="p-3 bg-terminal-bg rounded border border-terminal-border">
          <h4 className="text-xs text-terminal-muted uppercase tracking-wider mb-3">
            Allocation Details
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-terminal-muted">Shares Allocated:</span>
              <span className="font-mono text-terminal-text">{allocation.sharesAllocated}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-terminal-muted">Allocation Price:</span>
              <span className="font-mono text-terminal-text">${allocation.allocationPrice}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-terminal-muted">Total Cost:</span>
              <span className="font-mono text-terminal-text">
                ${(allocation.sharesAllocated * allocation.allocationPrice).toLocaleString()}
              </span>
            </div>
            {allocation.openPrice && (
              <>
                <div className="border-t border-terminal-border my-2 pt-2">
                  <div className="flex justify-between">
                    <span className="text-terminal-muted">Open Price:</span>
                    <span className="font-mono text-gain">${allocation.openPrice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-terminal-muted">Opening Pop:</span>
                    <span className="font-mono text-gain">+{allocation.openPop}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-terminal-muted">Unrealized Gain:</span>
                    <span className="font-mono text-gain">
                      +${((allocation.openPrice - allocation.allocationPrice) * allocation.sharesAllocated).toFixed(2)}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Educational Comparison */}
      {comparison && comparison.ipoEntry && (
        <div className="p-3 bg-terminal-accent/10 border border-terminal-accent/30 rounded">
          <h4 className="text-xs font-medium text-terminal-accent mb-2">
            💡 IPO vs Secondary Market Entry
          </h4>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2 bg-terminal-bg rounded">
              <div className="text-terminal-muted mb-1">IPO Allocation</div>
              <div className="font-mono text-gain">+{comparison.ipoEntry.gainPercent}%</div>
              <div className="text-xxs text-terminal-muted">at open</div>
            </div>
            <div className="p-2 bg-terminal-bg rounded">
              <div className="text-terminal-muted mb-1">If Bought at Open</div>
              <div className="font-mono text-terminal-text">{comparison.secondaryEntry.gainPercent}%</div>
              <div className="text-xxs text-terminal-muted">day 1 close</div>
            </div>
          </div>
          <p className="text-xs text-terminal-text mt-2">{comparison.lesson}</p>
        </div>
      )}

      {/* Oversubscription Info */}
      {allocation.oversubscription && (
        <div className="p-3 bg-terminal-bg rounded border border-terminal-border">
          <div className="flex items-center gap-2 text-sm">
            <BarChart3 className="w-4 h-4 text-terminal-muted" />
            <span className="text-terminal-muted">Oversubscription:</span>
            <span className="font-mono text-terminal-accent">
              {allocation.oversubscription.toFixed(1)}x
            </span>
          </div>
          <p className="text-xs text-terminal-muted mt-1">
            {allocation.oversubscription > 10 
              ? 'This was an extremely hot IPO. Getting any allocation was lucky!'
              : allocation.oversubscription > 5
              ? 'High demand meant limited retail allocation.'
              : 'Moderate demand allowed for reasonable allocation.'}
          </p>
        </div>
      )}
    </div>
  );
}

// Missing import
const BarChart3 = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 20V10M6 20V4M18 20v-4" />
  </svg>
);

export default IOIPanel;
