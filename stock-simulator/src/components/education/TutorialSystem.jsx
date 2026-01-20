/**
 * TutorialSystem - Onboarding and guided tutorials
 * 
 * Features:
 * - First-time user onboarding
 * - Step-by-step guided tours
 * - Contextual help triggers
 * - Progress persistence
 * 
 * Educational Purpose: Smooth onboarding without overwhelming new users
 */

import React, { useState, useEffect, createContext, useContext } from 'react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Play,
  CheckCircle,
  Circle,
  Lightbulb,
  Target,
  TrendingUp,
  Landmark,
  Receipt,
  BookOpen
} from 'lucide-react';

// Tutorial context for global state
const TutorialContext = createContext(null);

export function useTutorial() {
  return useContext(TutorialContext);
}

// Tutorial definitions
const TUTORIALS = {
  welcome: {
    id: 'welcome',
    title: 'Welcome to Market Terminal',
    description: 'Learn the basics of the trading interface',
    icon: Play,
    steps: [
      {
        id: 'welcome_intro',
        title: 'Welcome, Investor!',
        content: `Market Terminal is a professional-grade stock market simulator designed to teach you real investing skills.

Unlike simplified games, this terminal replicates the complexity of actual trading platforms. You'll learn:

• How to analyze stocks and execute trades
• The mechanics of IPOs and primary markets
• The hidden costs that erode returns (taxes, fees, slippage)

Let's get started!`,
        position: 'center'
      },
      {
        id: 'welcome_cash',
        title: 'Your Starting Capital',
        content: `You begin with $25,000 in virtual cash. This is the same amount required for "Pattern Day Trader" status in the US.

This isn't a coincidence – it's designed to teach you about real trading constraints.

Your goal: Grow this capital while learning to manage risk.`,
        highlight: '[data-tutorial="cash-display"]',
        position: 'bottom'
      },
      {
        id: 'welcome_modes',
        title: 'Two Market Types',
        content: `The terminal has two modes:

📈 TRADING - Secondary market operations
Buy and sell existing securities. This is what most people think of as "the stock market."

🏛️ IPO - Primary market operations  
Participate in Initial Public Offerings before companies start trading publicly.

Switch between them using these buttons.`,
        highlight: '[data-tutorial="mode-switcher"]',
        position: 'bottom'
      },
      {
        id: 'welcome_watchlist',
        title: 'Your Watchlist',
        content: `The watchlist shows securities you can trade. You start with 5 "blue chip" stocks.

Click any ticker to select it for charting and trading.

More tickers unlock as you progress!`,
        highlight: '[data-tutorial="watchlist"]',
        position: 'right'
      },
      {
        id: 'welcome_complete',
        title: 'You\'re Ready!',
        content: `That's the basics! Here are your first objectives:

1. Select a stock from the watchlist
2. Study the chart
3. Execute your first trade

Don't worry about making mistakes – this is a simulator. The best way to learn is by doing.

Good luck, and remember: the market rewards patience and punishes overtrading.`,
        position: 'center'
      }
    ]
  },
  
  first_trade: {
    id: 'first_trade',
    title: 'Your First Trade',
    description: 'Learn how to execute a buy order',
    icon: TrendingUp,
    steps: [
      {
        id: 'trade_select',
        title: 'Step 1: Select a Stock',
        content: `Click on a ticker in your watchlist to select it.

The chart will update to show that stock's price history, and the order panel will be ready for trading.`,
        highlight: '[data-tutorial="watchlist"]',
        position: 'right'
      },
      {
        id: 'trade_analyze',
        title: 'Step 2: Analyze the Chart',
        content: `Before buying, always look at the chart.

• Green candles = price went up
• Red candles = price went down
• Volume bars show trading activity

Look for trends. Is the stock generally moving up, down, or sideways?`,
        highlight: '[data-tutorial="chart"]',
        position: 'left'
      },
      {
        id: 'trade_order',
        title: 'Step 3: Enter Your Order',
        content: `In the Order Entry panel:

1. Make sure "BUY" is selected
2. Enter the number of shares
3. Review the estimated cost

Start small! Try buying just 10-20 shares for your first trade.`,
        highlight: '[data-tutorial="order-panel"]',
        position: 'left'
      },
      {
        id: 'trade_execute',
        title: 'Step 4: Execute',
        content: `Click the "Buy" button to submit your order.

Market orders execute immediately at the current price. You'll see the trade appear in your Positions panel.

Congratulations on your first trade! 🎉`,
        highlight: '[data-tutorial="order-panel"]',
        position: 'left'
      }
    ]
  },
  
  ipo_basics: {
    id: 'ipo_basics',
    title: 'IPO Fundamentals',
    description: 'Understand how Initial Public Offerings work',
    icon: Landmark,
    steps: [
      {
        id: 'ipo_intro',
        title: 'What is an IPO?',
        content: `An Initial Public Offering (IPO) is when a private company sells shares to the public for the first time.

This is the "primary market" – you're buying shares directly from the company, not from other investors.

IPOs can be exciting opportunities, but they're also risky.`,
        position: 'center'
      },
      {
        id: 'ipo_calendar',
        title: 'The IPO Calendar',
        content: `The calendar shows upcoming, pricing, and completed IPOs.

• UPCOMING: Filed but not yet accepting orders
• PRICING: Accepting Indications of Interest (IOIs)
• COMPLETED: Now trading on the secondary market

Click an IPO to see its details.`,
        highlight: '[data-tutorial="ipo-calendar"]',
        position: 'right'
      },
      {
        id: 'ipo_s1',
        title: 'The S-1 Prospectus',
        content: `Before investing in an IPO, read the S-1 prospectus. It contains:

• Business description
• Financial statements
• Risk factors (very important!)
• Use of proceeds

The S-1 Viewer lets you analyze these documents and quiz yourself on risk factors.`,
        highlight: '[data-tutorial="s1-viewer"]',
        position: 'left'
      },
      {
        id: 'ipo_ioi',
        title: 'Indication of Interest',
        content: `To participate in an IPO, you submit an "Indication of Interest" (IOI).

This is NOT a guaranteed order. You're telling the underwriters:
• How many shares you want
• The maximum price you'll pay

Hot IPOs are often 10-20x oversubscribed. You may receive only a fraction of what you requested.`,
        highlight: '[data-tutorial="ioi-panel"]',
        position: 'left'
      },
      {
        id: 'ipo_lesson',
        title: 'The IPO Reality',
        content: `Here's what most people don't understand:

Retail investors rarely get meaningful IPO allocations. The "pop" you hear about? Institutional investors capture most of it.

By the time you can buy on the secondary market, the easy gains are often gone.

This simulator teaches this reality through experience.`,
        position: 'center'
      }
    ]
  },
  
  tax_strategy: {
    id: 'tax_strategy',
    title: 'Tax-Smart Investing',
    description: 'Learn how taxes impact your returns',
    icon: Receipt,
    steps: [
      {
        id: 'tax_intro',
        title: 'The Hidden Cost',
        content: `Taxes are the "silent killer" of investment returns.

Many traders focus only on gross returns, ignoring that 20-40% can go to taxes.

This tutorial shows you how to think about taxes BEFORE you trade.`,
        position: 'center'
      },
      {
        id: 'tax_stlt',
        title: 'Short-Term vs Long-Term',
        content: `The holding period determines your tax rate:

SHORT-TERM (≤1 year): Taxed up to 37%
LONG-TERM (>1 year): Taxed at 15-20%

This difference is huge! On a $10,000 gain:
• Short-term tax: $3,700
• Long-term tax: $1,500

Patience literally pays.`,
        position: 'center'
      },
      {
        id: 'tax_lots',
        title: 'Tax Lot Tracking',
        content: `Every purchase creates a "tax lot" with:
• Date acquired
• Cost basis
• Number of shares

When you sell, you can choose WHICH lots to sell:
• FIFO (First In, First Out)
• LIFO (Last In, First Out)
• HIFO (Highest In, First Out)

HIFO is often most tax-efficient – you sell highest-cost shares first.`,
        highlight: '[data-tutorial="tax-lots"]',
        position: 'left'
      },
      {
        id: 'tax_wash',
        title: 'Wash Sale Warning',
        content: `The "wash sale" rule:

If you sell at a LOSS and buy back within 30 days (before or after), the loss is DISALLOWED.

This prevents tax-loss harvesting while maintaining the position.

The Tax Center monitors for potential wash sales.`,
        position: 'center'
      },
      {
        id: 'tax_churning',
        title: 'The Churning Lesson',
        content: `Active traders often underperform buy-and-hold investors. Why?

1. Short-term tax rates (up to 37%)
2. Slippage on every trade
3. SEC and FINRA fees
4. The difficulty of timing markets

Two investors with the same 20% gross return:
• Churner (150 trades): ~12% net
• Holder (8 trades): ~17% net

The Cost Analysis tab shows YOUR friction costs.`,
        position: 'center'
      }
    ]
  }
};

/**
 * Tutorial Provider - Wraps the app to provide tutorial state
 */
export function TutorialProvider({ children }) {
  const [activeTutorial, setActiveTutorial] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedTutorials, setCompletedTutorials] = useState(() => {
    const saved = localStorage.getItem('completed-tutorials');
    return saved ? JSON.parse(saved) : [];
  });
  const [showWelcome, setShowWelcome] = useState(() => {
    return !localStorage.getItem('welcome-dismissed');
  });

  // Save completed tutorials
  useEffect(() => {
    localStorage.setItem('completed-tutorials', JSON.stringify(completedTutorials));
  }, [completedTutorials]);

  const startTutorial = (tutorialId) => {
    const tutorial = TUTORIALS[tutorialId];
    if (tutorial) {
      setActiveTutorial(tutorial);
      setCurrentStep(0);
    }
  };

  const nextStep = () => {
    if (activeTutorial && currentStep < activeTutorial.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTutorial();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeTutorial = () => {
    if (activeTutorial && !completedTutorials.includes(activeTutorial.id)) {
      setCompletedTutorials([...completedTutorials, activeTutorial.id]);
    }
    setActiveTutorial(null);
    setCurrentStep(0);
  };

  const dismissWelcome = () => {
    setShowWelcome(false);
    localStorage.setItem('welcome-dismissed', 'true');
  };

  const resetTutorials = () => {
    setCompletedTutorials([]);
    localStorage.removeItem('completed-tutorials');
    localStorage.removeItem('welcome-dismissed');
    setShowWelcome(true);
  };

  const value = {
    activeTutorial,
    currentStep,
    completedTutorials,
    showWelcome,
    tutorials: TUTORIALS,
    startTutorial,
    nextStep,
    prevStep,
    completeTutorial,
    dismissWelcome,
    resetTutorials,
    isTutorialComplete: (id) => completedTutorials.includes(id)
  };

  return (
    <TutorialContext.Provider value={value}>
      {children}
      {activeTutorial && (
        <TutorialOverlay 
          tutorial={activeTutorial}
          step={currentStep}
          onNext={nextStep}
          onPrev={prevStep}
          onClose={completeTutorial}
        />
      )}
      {showWelcome && !activeTutorial && (
        <WelcomeModal 
          onStartTutorial={() => {
            dismissWelcome();
            startTutorial('welcome');
          }}
          onDismiss={dismissWelcome}
        />
      )}
    </TutorialContext.Provider>
  );
}

/**
 * Tutorial Overlay - Shows current step
 */
function TutorialOverlay({ tutorial, step, onNext, onPrev, onClose }) {
  const currentStepData = tutorial.steps[step];
  const isLastStep = step === tutorial.steps.length - 1;
  const isFirstStep = step === 0;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" />
      
      {/* Content Card */}
      <div className={`absolute ${getPositionClasses(currentStepData.position)} transform`}>
        <div className="bg-terminal-surface border border-terminal-accent rounded-lg shadow-xl max-w-md overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-terminal-border bg-terminal-accent/10">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-terminal-accent" />
              <span className="font-medium text-terminal-text">{currentStepData.title}</span>
            </div>
            <button onClick={onClose} className="text-terminal-muted hover:text-terminal-text">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-4">
            <p className="text-sm text-terminal-text whitespace-pre-line">
              {currentStepData.content}
            </p>
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-between p-4 border-t border-terminal-border bg-terminal-bg">
            {/* Progress dots */}
            <div className="flex items-center gap-1">
              {tutorial.steps.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i === step ? 'bg-terminal-accent' : 
                    i < step ? 'bg-gain' : 'bg-terminal-border'
                  }`}
                />
              ))}
            </div>
            
            {/* Navigation */}
            <div className="flex items-center gap-2">
              {!isFirstStep && (
                <button
                  onClick={onPrev}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-terminal-muted hover:text-terminal-text"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
              )}
              <button
                onClick={onNext}
                className="flex items-center gap-1 px-4 py-1.5 bg-terminal-accent text-white text-sm font-medium rounded hover:bg-terminal-accent/90"
              >
                {isLastStep ? 'Finish' : 'Next'}
                {!isLastStep && <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Welcome Modal - First-time user greeting
 */
function WelcomeModal({ onStartTutorial, onDismiss }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-terminal-surface border border-terminal-border rounded-lg shadow-xl max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="p-6 text-center border-b border-terminal-border">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-terminal-accent/20 flex items-center justify-center">
            <TrendingUp className="w-8 h-8 text-terminal-accent" />
          </div>
          <h2 className="text-xl font-bold text-terminal-text">Welcome to Market Terminal</h2>
          <p className="text-sm text-terminal-muted mt-2">
            A professional-grade stock market simulator
          </p>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <p className="text-sm text-terminal-text mb-4">
            This simulator teaches real investing skills through hands-on experience. 
            You'll learn to navigate complex trading interfaces, analyze IPO prospectuses, 
            and understand the hidden costs that erode returns.
          </p>
          
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="p-3 bg-terminal-bg rounded text-center">
              <TrendingUp className="w-6 h-6 mx-auto mb-1 text-terminal-accent" />
              <div className="text-xs text-terminal-muted">Secondary Market</div>
            </div>
            <div className="p-3 bg-terminal-bg rounded text-center">
              <Landmark className="w-6 h-6 mx-auto mb-1 text-purple-400" />
              <div className="text-xs text-terminal-muted">IPO Market</div>
            </div>
            <div className="p-3 bg-terminal-bg rounded text-center">
              <Receipt className="w-6 h-6 mx-auto mb-1 text-yellow-500" />
              <div className="text-xs text-terminal-muted">Tax Strategy</div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-terminal-border bg-terminal-bg flex gap-3">
          <button
            onClick={onDismiss}
            className="flex-1 py-2 border border-terminal-border text-terminal-muted font-medium rounded hover:bg-terminal-border transition-colors"
          >
            Skip Tutorial
          </button>
          <button
            onClick={onStartTutorial}
            className="flex-1 py-2 bg-terminal-accent text-white font-medium rounded hover:bg-terminal-accent/90 transition-colors flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4" />
            Start Tutorial
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Tutorial List Panel - Shows available tutorials
 */
export function TutorialListPanel() {
  const { tutorials, completedTutorials, startTutorial, resetTutorials } = useTutorial();

  return (
    <div className="h-full flex flex-col">
      <div className="terminal-header drag-handle cursor-move">
        <div className="flex items-center gap-2">
          <BookOpen className="w-3 h-3" />
          <span>Tutorials</span>
        </div>
        <span className="text-xxs text-terminal-muted">
          {completedTutorials.length}/{Object.keys(tutorials).length}
        </span>
      </div>

      <div className="flex-1 overflow-auto p-2">
        <div className="space-y-2">
          {Object.values(tutorials).map((tutorial) => {
            const isComplete = completedTutorials.includes(tutorial.id);
            const Icon = tutorial.icon;
            
            return (
              <button
                key={tutorial.id}
                onClick={() => startTutorial(tutorial.id)}
                className={`w-full p-3 rounded border text-left transition-colors ${
                  isComplete
                    ? 'bg-gain/5 border-gain/30 hover:bg-gain/10'
                    : 'bg-terminal-bg border-terminal-border hover:border-terminal-accent'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded flex items-center justify-center ${
                    isComplete ? 'bg-gain/20' : 'bg-terminal-border'
                  }`}>
                    {isComplete ? (
                      <CheckCircle className="w-4 h-4 text-gain" />
                    ) : (
                      <Icon className="w-4 h-4 text-terminal-muted" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-terminal-text text-sm">
                      {tutorial.title}
                    </div>
                    <div className="text-xs text-terminal-muted mt-0.5">
                      {tutorial.description}
                    </div>
                    <div className="text-xxs text-terminal-accent mt-1">
                      {tutorial.steps.length} steps
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-2 border-t border-terminal-border">
        <button
          onClick={resetTutorials}
          className="w-full py-1.5 text-xs text-terminal-muted hover:text-terminal-text"
        >
          Reset all tutorials
        </button>
      </div>
    </div>
  );
}

/**
 * Get position classes for tutorial overlay
 */
function getPositionClasses(position) {
  switch (position) {
    case 'center':
      return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
    case 'top':
      return 'top-20 left-1/2 -translate-x-1/2';
    case 'bottom':
      return 'bottom-20 left-1/2 -translate-x-1/2';
    case 'left':
      return 'top-1/2 left-20 -translate-y-1/2';
    case 'right':
      return 'top-1/2 right-20 -translate-y-1/2';
    default:
      return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
  }
}

export default TutorialProvider;
