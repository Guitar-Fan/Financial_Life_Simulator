/**
 * IPOCalendarPanel - Upcoming IPO offerings display
 * 
 * Features:
 * - List of upcoming, pricing, and completed IPOs
 * - Key metrics at a glance (price range, size, sector)
 * - Status indicators and countdown to pricing
 * - Click to view S-1 details
 * 
 * Educational Purpose: Teaches market awareness and IPO timing
 */

import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  ChevronRight,
  Building2,
  DollarSign,
  BarChart3
} from 'lucide-react';
import { useIPOStore } from '../../stores/ipoStore';
import { IPO_STATUS } from '../../utils/ipoAllocation';

export function IPOCalendarPanel({ onSelectIPO }) {
  const [filter, setFilter] = useState('ALL');
  const { ipoCalendar, selectedIPO, selectIPO, playerIOIs, allocations } = useIPOStore();

  const filteredIPOs = useMemo(() => {
    if (filter === 'ALL') return ipoCalendar;
    return ipoCalendar.filter(ipo => ipo.status === filter);
  }, [ipoCalendar, filter]);

  const handleSelectIPO = (ipoId) => {
    selectIPO(ipoId);
    onSelectIPO?.(ipoId);
  };

  // Count by status
  const counts = useMemo(() => ({
    all: ipoCalendar.length,
    upcoming: ipoCalendar.filter(i => i.status === IPO_STATUS.UPCOMING).length,
    pricing: ipoCalendar.filter(i => i.status === IPO_STATUS.PRICING).length,
    completed: ipoCalendar.filter(i => i.status === IPO_STATUS.COMPLETED).length
  }), [ipoCalendar]);

  const filters = [
    { id: 'ALL', label: 'All', count: counts.all },
    { id: IPO_STATUS.UPCOMING, label: 'Upcoming', count: counts.upcoming },
    { id: IPO_STATUS.PRICING, label: 'Pricing', count: counts.pricing },
    { id: IPO_STATUS.COMPLETED, label: 'Completed', count: counts.completed }
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Panel Header */}
      <div className="terminal-header drag-handle cursor-move">
        <div className="flex items-center gap-2">
          <Calendar className="w-3 h-3" />
          <span>IPO Calendar</span>
        </div>
        <span className="text-xxs">{ipoCalendar.length} offerings</span>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 p-2 border-b border-terminal-border">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              filter === f.id
                ? 'bg-terminal-accent text-white'
                : 'text-terminal-muted hover:text-terminal-text hover:bg-terminal-border'
            }`}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* IPO List */}
      <div className="flex-1 overflow-auto">
        {filteredIPOs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-terminal-muted">
            <div className="text-center">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No IPOs in this category</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-terminal-border">
            {filteredIPOs.map((ipo) => (
              <IPORow 
                key={ipo.id} 
                ipo={ipo} 
                isSelected={selectedIPO === ipo.id}
                hasIOI={!!playerIOIs[ipo.id]}
                allocation={allocations[ipo.id]}
                onSelect={() => handleSelectIPO(ipo.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="p-2 border-t border-terminal-border">
        <div className="flex items-center justify-center gap-4 text-xxs text-terminal-muted">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-yellow-500" /> Upcoming
          </span>
          <span className="flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-terminal-accent" /> Pricing
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-gain" /> Completed
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Individual IPO Row Component
 */
function IPORow({ ipo, isSelected, hasIOI, allocation, onSelect }) {
  const { 
    company, 
    ticker, 
    sector, 
    priceRange, 
    sharesOffered, 
    expectedDate, 
    status,
    outcome 
  } = ipo;

  const dealSize = (priceRange.low + priceRange.high) / 2 * sharesOffered;
  const statusConfig = getStatusConfig(status, outcome);

  return (
    <div
      onClick={onSelect}
      className={`p-3 cursor-pointer transition-colors hover:bg-terminal-border/30 ${
        isSelected ? 'bg-terminal-accent/10 border-l-2 border-terminal-accent' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: Company Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-terminal-text truncate">
              {company}
            </span>
            <span className="px-1.5 py-0.5 bg-terminal-border rounded text-xxs font-mono text-terminal-accent">
              {ticker}
            </span>
            {hasIOI && (
              <span className="px-1.5 py-0.5 bg-gain/20 rounded text-xxs text-gain">
                IOI
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-3 text-xs text-terminal-muted">
            <span className="flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              {sector}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(expectedDate)}
            </span>
          </div>
        </div>

        {/* Right: Price & Status */}
        <div className="text-right flex-shrink-0">
          <div className="flex items-center justify-end gap-2 mb-1">
            {status === IPO_STATUS.COMPLETED && outcome ? (
              <div className="text-sm font-mono">
                <span className="text-terminal-muted">$</span>
                <span className="text-terminal-text">{outcome.finalPrice}</span>
                <span className={`ml-2 text-xs ${
                  outcome.openPrice > outcome.finalPrice ? 'text-gain' : 'text-loss'
                }`}>
                  {outcome.openPrice > outcome.finalPrice ? '+' : ''}
                  {(((outcome.openPrice - outcome.finalPrice) / outcome.finalPrice) * 100).toFixed(1)}%
                </span>
              </div>
            ) : (
              <div className="text-sm font-mono">
                <span className="text-terminal-muted">$</span>
                <span className="text-terminal-text">{priceRange.low}</span>
                <span className="text-terminal-muted"> - </span>
                <span className="text-terminal-text">{priceRange.high}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-end gap-2">
            <span className="text-xxs text-terminal-muted">
              {formatDealSize(dealSize)}
            </span>
            <span className={`flex items-center gap-1 text-xxs ${statusConfig.color}`}>
              <statusConfig.icon className="w-3 h-3" />
              {statusConfig.label}
            </span>
          </div>
        </div>

        <ChevronRight className="w-4 h-4 text-terminal-muted flex-shrink-0 self-center" />
      </div>

      {/* Allocation Result (if completed and had IOI) */}
      {allocation && (
        <div className={`mt-2 p-2 rounded text-xs ${
          allocation.sharesAllocated > 0 
            ? 'bg-gain/10 text-gain' 
            : 'bg-loss/10 text-loss'
        }`}>
          {allocation.sharesAllocated > 0 
            ? `✓ Allocated ${allocation.sharesAllocated} shares at $${allocation.allocationPrice}`
            : `✗ No allocation - ${allocation.reason}`
          }
        </div>
      )}
    </div>
  );
}

/**
 * Get status configuration (icon, color, label)
 */
function getStatusConfig(status, outcome) {
  switch (status) {
    case IPO_STATUS.UPCOMING:
      return { icon: Clock, color: 'text-yellow-500', label: 'Upcoming' };
    case IPO_STATUS.PRICING:
      return { icon: AlertCircle, color: 'text-terminal-accent', label: 'Pricing' };
    case IPO_STATUS.COMPLETED:
      const pop = outcome 
        ? ((outcome.openPrice - outcome.finalPrice) / outcome.finalPrice) * 100 
        : 0;
      return { 
        icon: CheckCircle, 
        color: pop > 0 ? 'text-gain' : 'text-loss', 
        label: 'Traded' 
      };
    case IPO_STATUS.WITHDRAWN:
      return { icon: XCircle, color: 'text-loss', label: 'Withdrawn' };
    default:
      return { icon: AlertCircle, color: 'text-terminal-muted', label: status };
  }
}

/**
 * Format date for display
 */
function formatDate(dateStr) {
  if (!dateStr) return 'TBD';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Format deal size
 */
function formatDealSize(value) {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(0)}M`;
  return `$${value.toLocaleString()}`;
}

export default IPOCalendarPanel;
