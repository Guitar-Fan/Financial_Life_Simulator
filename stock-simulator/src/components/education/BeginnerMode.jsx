/**
 * BeginnerMode - Global context for beginner-friendly experience
 *
 * When Beginner Mode is ON:
 * - Jargon labels show friendly alternatives
 * - Inline term highlights appear with hover explanations
 * - A floating glossary button is available
 * - Guided missions become visible
 * - Panel headers include "What is this?" helper text
 *
 * Persistence: saved to localStorage so it remembers across sessions.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { BookOpen, X, Search, GraduationCap, ChevronDown, ChevronUp } from 'lucide-react';
import financeGlossary, { searchGlossary } from '../../data/financeGlossary';

// ── Context ──────────────────────────────────────────────
const BeginnerModeContext = createContext(null);

export function useBeginnerMode() {
  const ctx = useContext(BeginnerModeContext);
  if (!ctx) throw new Error('useBeginnerMode must be inside BeginnerModeProvider');
  return ctx;
}

// ── Provider ─────────────────────────────────────────────
export function BeginnerModeProvider({ children }) {
  const [isBeginnerMode, setIsBeginnerMode] = useState(() => {
    const saved = localStorage.getItem('beginner-mode');
    // Default ON for new users (no saved preference)
    return saved === null ? true : saved === 'true';
  });

  const [glossaryOpen, setGlossaryOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('beginner-mode', String(isBeginnerMode));
  }, [isBeginnerMode]);

  const toggleBeginnerMode = () => setIsBeginnerMode((v) => !v);
  const openGlossary = () => setGlossaryOpen(true);
  const closeGlossary = () => setGlossaryOpen(false);

  /**
   * label() – returns beginner-friendly text when mode is ON,
   * otherwise returns normal (pro) text.
   */
  const label = (proText, beginnerText) =>
    isBeginnerMode ? beginnerText : proText;

  const value = {
    isBeginnerMode,
    toggleBeginnerMode,
    glossaryOpen,
    openGlossary,
    closeGlossary,
    label,
  };

  return (
    <BeginnerModeContext.Provider value={value}>
      {children}

      {/* Floating Glossary Button (only in beginner mode) */}
      {isBeginnerMode && !glossaryOpen && (
        <button
          onClick={openGlossary}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 bg-terminal-accent text-white rounded-full shadow-lg hover:bg-terminal-accent/90 transition-all hover:scale-105 group"
          title="Open Finance Dictionary"
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-sm font-medium hidden sm:inline">📖 Finance Dictionary</span>
        </button>
      )}

      {/* Glossary Drawer */}
      {glossaryOpen && <GlossaryDrawer onClose={closeGlossary} />}
    </BeginnerModeContext.Provider>
  );
}

// ── Glossary Drawer ──────────────────────────────────────
function GlossaryDrawer({ onClose }) {
  const [query, setQuery] = useState('');
  const [expandedKey, setExpandedKey] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = {
    all: 'All',
    basics: 'Market Basics',
    trading: 'Trading',
    orders: 'Order Types',
    pricing: 'Pricing',
    charts: 'Charts',
    results: 'P&L',
    taxes: 'Taxes',
    ipo: 'IPO',
    account: 'Account',
  };

  const categoryMap = {
    stock: 'basics', share: 'basics', ticker: 'basics', portfolio: 'basics',
    market: 'basics', bull_market: 'basics', bear_market: 'basics',
    buy: 'trading', sell: 'trading', position: 'trading',
    market_order: 'orders', limit_order: 'orders', stop_order: 'orders', stop_limit_order: 'orders',
    bid: 'pricing', ask: 'pricing', spread: 'pricing', slippage: 'pricing',
    basis_points: 'pricing',
    order_book: 'pricing', volume: 'pricing', liquidity: 'pricing',
    candlestick: 'charts', ohlc: 'charts', trend: 'charts',
    profit_loss: 'results', unrealized_pl: 'results', realized_pl: 'results',
    cost_basis: 'results', market_value: 'results',
    capital_gains: 'taxes', short_term_gains: 'taxes', long_term_gains: 'taxes',
    tax_lot: 'taxes', wash_sale: 'taxes', fifo: 'taxes',
    ipo: 'ipo', s1_prospectus: 'ipo', ioi: 'ipo', oversubscribed: 'ipo',
    allocation: 'ipo', underwriter: 'ipo',
    cash: 'account', total_value: 'account', diversification: 'account',
    commission: 'account',
    playback_speed: 'basics', simulation: 'basics',
  };

  // Filtered entries
  const entries = Object.entries(financeGlossary)
    .filter(([key, entry]) => {
      const matchesCategory = activeCategory === 'all' || categoryMap[key] === activeCategory;
      const matchesQuery =
        !query ||
        entry.term.toLowerCase().includes(query.toLowerCase()) ||
        entry.short.toLowerCase().includes(query.toLowerCase()) ||
        key.includes(query.toLowerCase());
      return matchesCategory && matchesQuery;
    })
    .sort(([, a], [, b]) => a.term.localeCompare(b.term));

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-terminal-surface border-l border-terminal-border flex flex-col shadow-2xl animate-slideIn">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-terminal-border bg-terminal-accent/10">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-terminal-accent" />
            <h2 className="text-lg font-bold text-terminal-text">📖 Finance Dictionary</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-terminal-border rounded">
            <X className="w-5 h-5 text-terminal-muted" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-terminal-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-terminal-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='Search terms... e.g. "stock", "bid"'
              className="w-full pl-9 pr-3 py-2 bg-terminal-bg border border-terminal-border rounded text-sm text-terminal-text placeholder:text-terminal-muted focus:outline-none focus:border-terminal-accent"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-1 p-3 border-b border-terminal-border">
          {Object.entries(categories).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                activeCategory === key
                  ? 'bg-terminal-accent text-white'
                  : 'bg-terminal-border text-terminal-muted hover:text-terminal-text'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Entries */}
        <div className="flex-1 overflow-auto p-2 space-y-1">
          {entries.length === 0 ? (
            <div className="text-center text-terminal-muted p-8">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No terms found for "{query}"</p>
            </div>
          ) : (
            entries.map(([key, entry]) => (
              <GlossaryCard
                key={key}
                entry={entry}
                isExpanded={expandedKey === key}
                onToggle={() => setExpandedKey(expandedKey === key ? null : key)}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-terminal-border text-center">
          <span className="text-xxs text-terminal-muted">
            {entries.length} terms • Tap any term to learn more
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Glossary Card ────────────────────────────────────────
function GlossaryCard({ entry, isExpanded, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="w-full text-left p-3 rounded border border-terminal-border bg-terminal-bg hover:border-terminal-accent/50 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{entry.emoji}</span>
          <span className="font-medium text-terminal-text text-sm">{entry.term}</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-terminal-muted" />
        ) : (
          <ChevronDown className="w-4 h-4 text-terminal-muted" />
        )}
      </div>
      <p className="text-xs text-terminal-muted mt-1">{entry.short}</p>

      {isExpanded && (
        <div className="mt-3 space-y-3 border-t border-terminal-border pt-3">
          <p className="text-sm text-terminal-text whitespace-pre-line">{entry.long}</p>
          {entry.analogy && (
            <div className="p-2 bg-terminal-accent/10 rounded border border-terminal-accent/20">
              <span className="text-xs font-medium text-terminal-accent">💡 Real-world analogy:</span>
              <p className="text-xs text-terminal-text mt-1">{entry.analogy}</p>
            </div>
          )}
        </div>
      )}
    </button>
  );
}

// ── Beginner Mode Toggle Button (for Header) ────────────
export function BeginnerModeToggle() {
  const { isBeginnerMode, toggleBeginnerMode, openGlossary } = useBeginnerMode();

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={toggleBeginnerMode}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-all ${
          isBeginnerMode
            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
            : 'text-terminal-muted hover:text-terminal-text hover:bg-terminal-border border border-transparent'
        }`}
        title={isBeginnerMode ? 'Switch to Pro Mode' : 'Switch to Beginner Mode'}
      >
        <GraduationCap className="w-3.5 h-3.5" />
        {isBeginnerMode ? '🎓 Beginner' : 'Pro'}
      </button>
      {isBeginnerMode && (
        <button
          onClick={openGlossary}
          className="p-1.5 rounded text-yellow-400 hover:bg-yellow-500/20 transition-colors"
          title="Open Finance Dictionary"
        >
          <BookOpen className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

export default BeginnerModeProvider;
