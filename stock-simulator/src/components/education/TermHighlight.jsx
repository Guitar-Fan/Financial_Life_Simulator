/**
 * TermHighlight – Inline jargon highlighter for Beginner Mode
 *
 * Wraps a finance term in a highlighted span with a hover tooltip
 * showing the plain‑English definition from the glossary.
 * Invisible / passthrough when Beginner Mode is OFF.
 *
 * Usage:
 *   <Term k="spread">Bid-Ask Spread</Term>
 *   <Term k="slippage" />  ← uses glossary term as display text
 */

import React, { useState } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import financeGlossary from '../../data/financeGlossary';
import { useBeginnerMode } from './BeginnerMode';

export function Term({ k, children }) {
  const { isBeginnerMode } = useBeginnerMode();
  const entry = financeGlossary[k];
  const [showLong, setShowLong] = useState(false);

  const displayText = children || entry?.term || k;

  // In pro mode, just render the text
  if (!isBeginnerMode || !entry) {
    return <>{displayText}</>;
  }

  return (
    <Tooltip.Root delayDuration={200}>
      <Tooltip.Trigger asChild>
        <span className="inline-flex items-center gap-0.5 cursor-help border-b border-dotted border-yellow-500/50 text-yellow-300/90 hover:text-yellow-200 transition-colors">
          {displayText}
          <span className="text-[0.6rem] opacity-70 select-none">ⓘ</span>
        </span>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          side="top"
          sideOffset={6}
          className="z-[100] max-w-xs p-3 bg-terminal-surface border border-yellow-500/30 rounded-lg shadow-xl"
          onPointerDownOutside={() => setShowLong(false)}
        >
          {/* Term header */}
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-base">{entry.emoji}</span>
            <span className="font-semibold text-sm text-terminal-text">{entry.term}</span>
          </div>

          {/* Short definition */}
          <p className="text-xs text-terminal-muted leading-relaxed">{entry.short}</p>

          {/* Expandable long definition */}
          {showLong && (
            <div className="mt-2 space-y-2 border-t border-terminal-border pt-2">
              <p className="text-xs text-terminal-text whitespace-pre-line leading-relaxed">
                {entry.long}
              </p>
              {entry.analogy && (
                <div className="p-2 bg-terminal-accent/10 border border-terminal-accent/20 rounded">
                  <span className="text-[0.65rem] font-medium text-terminal-accent">💡 Think of it like:</span>
                  <p className="text-xs text-terminal-text mt-0.5">{entry.analogy}</p>
                </div>
              )}
            </div>
          )}

          <button
            onClick={(e) => { e.stopPropagation(); setShowLong((v) => !v); }}
            className="mt-2 text-[0.65rem] text-yellow-400 hover:underline"
          >
            {showLong ? '▲ Show less' : '▼ Tell me more…'}
          </button>

          <Tooltip.Arrow className="fill-terminal-surface" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

/**
 * PanelHelp – A small "What is this?" banner at the top of panels
 * Only visible in Beginner Mode.
 */
export function PanelHelp({ icon, title, children }) {
  const { isBeginnerMode } = useBeginnerMode();
  const [dismissed, setDismissed] = useState(false);

  if (!isBeginnerMode || dismissed) return null;

  return (
    <div className="px-3 py-2 bg-yellow-500/10 border-b border-yellow-500/20 flex items-start gap-2">
      {icon && <span className="text-sm flex-shrink-0 mt-0.5">{icon}</span>}
      <div className="flex-1 min-w-0">
        {title && <div className="text-xs font-medium text-yellow-300 mb-0.5">{title}</div>}
        <div className="text-xs text-yellow-100/80 leading-relaxed">{children}</div>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-yellow-500/50 hover:text-yellow-400 flex-shrink-0"
        title="Dismiss hint"
      >
        ✕
      </button>
    </div>
  );
}

export default Term;
