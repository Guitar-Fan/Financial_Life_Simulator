/**
 * EducationalTooltip - Contextual learning tooltips
 * 
 * Features:
 * - Rich tooltip content with examples
 * - Links to related concepts
 * - Progressive disclosure (basic -> advanced)
 * - Dismissible "got it" functionality
 * 
 * Educational Purpose: Just-in-time learning without interrupting flow
 */

import React, { useState } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { Info, BookOpen, ExternalLink, X } from 'lucide-react';

// Educational content library
export const EDUCATIONAL_CONTENT = {
  // Trading concepts
  bid_ask_spread: {
    title: 'Bid-Ask Spread',
    brief: 'The difference between the highest price a buyer will pay and the lowest price a seller will accept.',
    detailed: `The spread represents the cost of immediacy. Market makers profit from this difference.
    
A tight spread (e.g., $0.01) indicates high liquidity.
A wide spread (e.g., $0.50) indicates lower liquidity and higher trading costs.

When you buy with a market order, you pay the ask price.
When you sell with a market order, you receive the bid price.`,
    example: 'If AAPL shows Bid: $150.00, Ask: $150.05, the spread is $0.05 (0.03%)',
    related: ['market_order', 'limit_order', 'slippage']
  },
  
  market_order: {
    title: 'Market Order',
    brief: 'An order to buy or sell immediately at the best available price.',
    detailed: `Market orders prioritize speed over price. They guarantee execution but not the exact price.

Pros:
• Guaranteed to fill (in liquid markets)
• Fastest execution

Cons:
• May experience slippage
• Price uncertainty in volatile markets`,
    example: 'You place a market buy for 100 shares. The ask is $50.00, but by the time your order executes, it might fill at $50.05 due to slippage.',
    related: ['limit_order', 'slippage', 'bid_ask_spread']
  },
  
  limit_order: {
    title: 'Limit Order',
    brief: 'An order to buy or sell at a specific price or better.',
    detailed: `Limit orders give you price control but don't guarantee execution.

Buy Limit: Will only execute at the limit price or lower.
Sell Limit: Will only execute at the limit price or higher.

Pros:
• Price certainty
• No slippage

Cons:
• May not fill
• May fill partially`,
    example: 'You place a limit buy at $49.50 when the stock is at $50.00. Your order waits until the price drops to $49.50.',
    related: ['market_order', 'stop_order']
  },
  
  stop_order: {
    title: 'Stop Order',
    brief: 'An order that becomes a market order when a specified price is reached.',
    detailed: `Stop orders are used for risk management and momentum trading.

Stop Loss: Sell when price falls to protect against further losses.
Stop Entry: Buy when price rises to catch a breakout.

Warning: In fast markets, the execution price can be significantly different from the stop price.`,
    example: 'You own shares at $50 and set a stop-loss at $45. If the price hits $45, a market sell order is triggered.',
    related: ['market_order', 'stop_limit_order']
  },
  
  slippage: {
    title: 'Slippage',
    brief: 'The difference between expected and actual execution price.',
    detailed: `Slippage occurs due to:
• Market movement between order and execution
• Large orders moving the market
• Low liquidity (wide spreads)

Slippage is typically measured in basis points (bps).
1 basis point = 0.01%

High-frequency trading can reduce slippage but introduces other costs.`,
    example: 'You expect to buy at $100.00 but fill at $100.15. Your slippage is $0.15 or 15 bps.',
    related: ['bid_ask_spread', 'market_order', 'market_impact']
  },
  
  // Tax concepts
  short_term_gains: {
    title: 'Short-Term Capital Gains',
    brief: 'Profits from assets held 1 year or less, taxed as ordinary income.',
    detailed: `Short-term capital gains are taxed at your ordinary income tax rate, which can be as high as 37% for federal taxes.

This is why active trading can significantly reduce net returns compared to long-term investing.

The holding period starts the day after you buy and includes the day you sell.`,
    example: 'Buy AAPL on Jan 1, sell on Dec 15 same year = short-term (less than 1 year).',
    related: ['long_term_gains', 'tax_lot', 'wash_sale']
  },
  
  long_term_gains: {
    title: 'Long-Term Capital Gains',
    brief: 'Profits from assets held more than 1 year, taxed at preferential rates.',
    detailed: `Long-term capital gains rates (2024):
• 0% for income up to $47,025
• 15% for income $47,026 - $518,900
• 20% for income above $518,900

Plus potential 3.8% Net Investment Income Tax for high earners.

This preferential treatment incentivizes long-term investing.`,
    example: 'Buy AAPL on Jan 1, 2023, sell on Jan 2, 2024 = long-term (more than 1 year).',
    related: ['short_term_gains', 'tax_lot']
  },
  
  wash_sale: {
    title: 'Wash Sale Rule',
    brief: 'A tax rule that disallows loss deductions if you buy back within 30 days.',
    detailed: `The wash sale rule prevents you from claiming a tax loss if you purchase "substantially identical" securities within 30 days before or after the sale.

The 61-day window: 30 days before + sale day + 30 days after.

Disallowed losses are added to the cost basis of the replacement shares, deferring (not eliminating) the tax benefit.`,
    example: 'Sell AAPL at a loss on March 15, buy AAPL again on March 30 = wash sale. The loss is disallowed.',
    related: ['tax_lot', 'short_term_gains']
  },
  
  tax_lot: {
    title: 'Tax Lot',
    brief: 'A record of shares purchased at a specific time and price for tax purposes.',
    detailed: `Each purchase of shares creates a tax lot with:
• Acquisition date
• Cost basis (price per share)
• Number of shares

When selling, you can choose which lots to sell using different methods:
• FIFO: First In, First Out
• LIFO: Last In, First Out  
• Specific ID: Choose specific lots

Choosing wisely can minimize taxes.`,
    example: 'You bought 50 shares at $100 in January, 50 shares at $120 in March. You have 2 tax lots.',
    related: ['wash_sale', 'short_term_gains', 'long_term_gains']
  },
  
  // IPO concepts
  ipo: {
    title: 'Initial Public Offering',
    brief: 'The first sale of stock by a private company to the public.',
    detailed: `IPOs allow companies to raise capital from public investors. The process involves:

1. Filing S-1 prospectus with SEC
2. Roadshow to institutional investors
3. Book building (gauging demand)
4. Pricing the offering
5. First day of trading

Retail investors typically get limited access to IPO allocations.`,
    example: 'Company XYZ files to go public at $15-17 per share, prices at $18, opens trading at $25.',
    related: ['s1_prospectus', 'ipo_allocation', 'lock_up_period']
  },
  
  s1_prospectus: {
    title: 'S-1 Prospectus',
    brief: 'The registration document filed with SEC containing business and financial details.',
    detailed: `The S-1 is your primary research tool for IPO due diligence. Key sections:

• Business Description
• Risk Factors (legally required disclosures)
• Use of Proceeds
• Management Discussion & Analysis
• Financial Statements
• Selling Shareholders

Always read the Risk Factors section carefully.`,
    example: 'The Risk Factors section might disclose: "We have never been profitable and may never achieve profitability."',
    related: ['ipo', 'ipo_allocation']
  },
  
  ipo_allocation: {
    title: 'IPO Allocation',
    brief: 'The number of shares you receive in an oversubscribed IPO.',
    detailed: `When an IPO is oversubscribed (demand > supply):

• Institutional investors get 70-90% of shares
• Retail investors share the remaining 10-30%
• Pro-rata allocation based on order size

Hot IPOs can be 10-20x oversubscribed. Requesting 100 shares might get you 5-10.`,
    example: 'IPO is 15x oversubscribed. You requested 100 shares at $20. You receive 7 shares.',
    related: ['ipo', 'indication_of_interest']
  },
  
  indication_of_interest: {
    title: 'Indication of Interest (IOI)',
    brief: 'A non-binding expression of interest to purchase IPO shares.',
    detailed: `An IOI is not a guaranteed order. It tells the underwriters:
• How many shares you want
• The maximum price you'll pay

Based on total IOIs, the underwriters determine:
• Final IPO price
• How to allocate shares

You can cancel an IOI before pricing.`,
    example: 'You submit an IOI for 100 shares at max $22. If IPO prices at $24, you don\'t participate.',
    related: ['ipo', 'ipo_allocation']
  }
};

/**
 * Educational Tooltip Component
 */
export function EducationalTooltip({ 
  concept, 
  children, 
  showIcon = true,
  side = 'top',
  align = 'center'
}) {
  const [showDetailed, setShowDetailed] = useState(false);
  const content = EDUCATIONAL_CONTENT[concept];
  
  if (!content) {
    console.warn(`Educational content not found for: ${concept}`);
    return children;
  }

  return (
    <Tooltip.Provider delayDuration={300}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <span className="inline-flex items-center gap-1 cursor-help border-b border-dotted border-terminal-muted">
            {children}
            {showIcon && <Info className="w-3 h-3 text-terminal-muted" />}
          </span>
        </Tooltip.Trigger>
        
        <Tooltip.Portal>
          <Tooltip.Content
            side={side}
            align={align}
            sideOffset={5}
            className="z-50 max-w-sm p-3 bg-terminal-surface border border-terminal-border rounded shadow-lg"
          >
            {/* Title */}
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-terminal-accent" />
              <span className="font-medium text-terminal-text">{content.title}</span>
            </div>
            
            {/* Brief or Detailed */}
            <p className="text-xs text-terminal-muted whitespace-pre-line">
              {showDetailed ? content.detailed : content.brief}
            </p>
            
            {/* Example */}
            {content.example && (
              <div className="mt-2 p-2 bg-terminal-bg rounded text-xs">
                <span className="text-terminal-accent font-medium">Example: </span>
                <span className="text-terminal-text">{content.example}</span>
              </div>
            )}
            
            {/* Toggle detailed view */}
            <button
              onClick={() => setShowDetailed(!showDetailed)}
              className="mt-2 text-xxs text-terminal-accent hover:underline"
            >
              {showDetailed ? 'Show less' : 'Learn more...'}
            </button>
            
            {/* Related concepts */}
            {showDetailed && content.related && (
              <div className="mt-2 pt-2 border-t border-terminal-border">
                <span className="text-xxs text-terminal-muted">Related: </span>
                {content.related.map((rel, i) => (
                  <span key={rel} className="text-xxs text-terminal-accent">
                    {EDUCATIONAL_CONTENT[rel]?.title || rel}
                    {i < content.related.length - 1 && ', '}
                  </span>
                ))}
              </div>
            )}
            
            <Tooltip.Arrow className="fill-terminal-border" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

/**
 * Standalone Info Button that opens a modal
 */
export function InfoButton({ concept, size = 'sm' }) {
  const [isOpen, setIsOpen] = useState(false);
  const content = EDUCATIONAL_CONTENT[concept];
  
  if (!content) return null;
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-terminal-muted hover:text-terminal-accent transition-colors"
        title={`Learn about ${content.title}`}
      >
        <Info className={sizeClasses[size]} />
      </button>
      
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-terminal-surface border border-terminal-border rounded-lg shadow-xl max-w-md mx-4 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-terminal-border">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-terminal-accent" />
                <span className="font-medium text-terminal-text">{content.title}</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-terminal-muted hover:text-terminal-text"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-4 max-h-96 overflow-y-auto">
              <p className="text-sm text-terminal-text whitespace-pre-line mb-4">
                {content.detailed}
              </p>
              
              {content.example && (
                <div className="p-3 bg-terminal-bg rounded mb-4">
                  <span className="text-xs text-terminal-accent font-medium">Example:</span>
                  <p className="text-sm text-terminal-text mt-1">{content.example}</p>
                </div>
              )}
              
              {content.related && (
                <div className="pt-3 border-t border-terminal-border">
                  <span className="text-xs text-terminal-muted">Related concepts: </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {content.related.map((rel) => (
                      <span 
                        key={rel}
                        className="px-2 py-0.5 bg-terminal-border rounded text-xs text-terminal-text"
                      >
                        {EDUCATIONAL_CONTENT[rel]?.title || rel}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-terminal-border bg-terminal-bg">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full py-2 bg-terminal-accent text-white font-medium rounded hover:bg-terminal-accent/90"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default EducationalTooltip;
