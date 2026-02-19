/**
 * GuidedMissions – Interactive quest system for first-time players
 *
 * Missions are small, encouraging, step-by-step goals that teach
 * fundamental concepts through action. They feel like game quests
 * rather than boring tutorials.
 *
 * Each mission has:
 *   - A friendly title & emoji
 *   - Plain-English explanation of WHY
 *   - Clear steps with auto-detection of completion
 *   - A celebratory "reward" message when done
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Rocket,
  CheckCircle2,
  Circle,
  ChevronRight,
  Trophy,
  Star,
  X,
  Sparkles,
} from 'lucide-react';
import { usePlayerStore } from '../../stores/playerStore';
import { useMarketStore } from '../../stores/marketStore';
import { useBeginnerMode } from './BeginnerMode';

// ── Mission Definitions ──────────────────────────────────
const MISSIONS = [
  {
    id: 'explore_watchlist',
    emoji: '👀',
    title: 'Look Around',
    subtitle: 'Get familiar with the terminal',
    why: "Before jumping in, let's see what we're working with. Every trader starts by checking what stocks are available.",
    steps: [
      {
        label: 'Click on any stock in the Watchlist panel (left side)',
        check: (player, market) => !!market.selectedTicker,
      },
    ],
    reward: '🎉 Nice! You just selected your first stock. The chart now shows its price history!',
    xp: 10,
  },
  {
    id: 'read_the_chart',
    emoji: '📊',
    title: 'Read the Chart',
    subtitle: 'Understand price movement',
    why: 'Charts tell you the story of a stock. Green candles = the price went UP that day. Red candles = it went DOWN. The chart helps you decide when to buy.',
    steps: [
      {
        label: 'Select a stock from the Watchlist (if you haven\'t already)',
        check: (player, market) => !!market.selectedTicker,
      },
      {
        label: 'Look at the chart — hover over candles to see prices',
        check: () => true, // Always passes — encouragement step
      },
    ],
    reward: '📈 Great! Now you can read a basic stock chart. Green = up, Red = down, and volume bars show activity.',
    xp: 10,
  },
  {
    id: 'first_buy',
    emoji: '🛒',
    title: 'Your First Purchase',
    subtitle: 'Buy your first stock',
    why: "You have $25,000 in virtual cash. Let's spend a small amount on your first stock. Don't worry — this is practice money!",
    steps: [
      {
        label: 'Select a stock from the Watchlist',
        check: (player, market) => !!market.selectedTicker,
      },
      {
        label: 'In the Order Entry panel, make sure "BUY" is selected (green button)',
        check: () => true, // UI guidance step
      },
      {
        label: 'Type a small number of shares (try 5-10) and click "Buy"',
        check: (player) => player.tradesExecuted >= 1,
      },
    ],
    reward: '🎉 Congratulations! You just bought your first stock! Check the Positions panel to see it.',
    xp: 25,
  },
  {
    id: 'check_position',
    emoji: '📋',
    title: 'Check Your Holdings',
    subtitle: 'See what you own',
    why: "After buying, it's important to monitor your position. Is the price going up or down since you bought? This is called your \"unrealized\" profit or loss.",
    steps: [
      {
        label: 'Look at the Positions panel — you should see your stock listed there',
        check: (player) => Object.keys(player.positions).length >= 1,
      },
      {
        label: 'Notice the P&L column — is it green (profit) or red (loss)?',
        check: () => true, // Awareness step
      },
    ],
    reward: '👀 You\'re monitoring like a real investor! The P&L updates in real-time as prices change.',
    xp: 10,
  },
  {
    id: 'first_sell',
    emoji: '💰',
    title: 'Take Some Profit (or Cut a Loss)',
    subtitle: 'Sell shares you own',
    why: "You only truly make (or lose) money when you SELL. Until then, gains and losses are just \"on paper.\" Let's practice selling.",
    steps: [
      {
        label: 'Click on a stock you OWN in the Watchlist or Positions panel',
        check: (player, market) =>
          !!market.selectedTicker && !!player.positions[market.selectedTicker],
      },
      {
        label: 'In Order Entry, click "SELL" (red button), enter a quantity, and submit',
        check: (player) => player.tradesExecuted >= 2,
      },
    ],
    reward: '✅ You completed a round trip — buy then sell! Check the "Realized P&L" tab to see your actual profit or loss.',
    xp: 25,
  },
  {
    id: 'speed_control',
    emoji: '⏩',
    title: 'Time Traveler',
    subtitle: 'Control the simulation speed',
    why: 'Real markets move slowly. The speed buttons let you fast-forward through time so you can see how stocks move over days and weeks in just minutes.',
    steps: [
      {
        label: 'Press the Play ▶️ button in the top bar to start the simulation',
        check: (player, market) => market.replayIndex > 0,
      },
      {
        label: 'Try clicking different speed buttons (1x, 5x, 10x, 50x)',
        check: (player, market) => market.replayIndex > 5,
      },
    ],
    reward: '⏩ You\'re controlling time! Watch how stock prices change as days pass. Higher speeds are great for seeing long-term trends.',
    xp: 15,
  },
  {
    id: 'diversify',
    emoji: '🌈',
    title: 'Don\'t Put All Eggs in One Basket',
    subtitle: 'Buy stocks in at least 2 different companies',
    why: '"Diversification" means spreading your money across multiple companies. If one goes down, the others might go up. It\'s the #1 rule of smart investing!',
    steps: [
      {
        label: 'Buy shares in at least 2 different companies',
        check: (player) => Object.keys(player.positions).length >= 2,
      },
    ],
    reward: '🌈 Smart move! You\'re diversified now. Professional investors hold dozens of different stocks.',
    xp: 20,
  },
  {
    id: 'explore_ipo',
    emoji: '🎉',
    title: 'IPO Explorer',
    subtitle: 'Check out the IPO market',
    why: 'An IPO is when a company goes public for the first time. Switch to the IPO tab to see companies that are about to start trading!',
    steps: [
      {
        label: 'Click the "IPO" button in the top navigation bar',
        check: () => true, // Can't auto-detect mode switch easily; honor system
      },
    ],
    reward: '🏛️ Welcome to the primary market! Here you can see upcoming IPOs and try to get shares before they start trading publicly.',
    xp: 10,
  },
];

// ── Missions Panel Component ─────────────────────────────
export function GuidedMissionsPanel() {
  const { isBeginnerMode } = useBeginnerMode();
  const playerState = usePlayerStore();
  const marketState = useMarketStore();
  const [completedMissions, setCompletedMissions] = useState(() => {
    const saved = localStorage.getItem('completed-missions');
    return saved ? JSON.parse(saved) : [];
  });
  const [celebratingId, setCelebratingId] = useState(null);
  const [minimized, setMinimized] = useState(false);

  // Save progress
  useEffect(() => {
    localStorage.setItem('completed-missions', JSON.stringify(completedMissions));
  }, [completedMissions]);

  // Check for newly completed missions
  useEffect(() => {
    for (const mission of MISSIONS) {
      if (completedMissions.includes(mission.id)) continue;

      const allDone = mission.steps.every((s) => s.check(playerState, marketState));
      if (allDone) {
        setCompletedMissions((prev) => [...prev, mission.id]);
        setCelebratingId(mission.id);
        setTimeout(() => setCelebratingId(null), 4000);
      }
    }
  }, [playerState, marketState, completedMissions]);

  // Current mission = first incomplete one
  const currentMission = MISSIONS.find((m) => !completedMissions.includes(m.id));
  const completedCount = completedMissions.length;
  const totalXP = MISSIONS.filter((m) => completedMissions.includes(m.id)).reduce(
    (sum, m) => sum + m.xp,
    0
  );

  if (!isBeginnerMode) return null;

  // Celebration toast
  if (celebratingId) {
    const celMission = MISSIONS.find((m) => m.id === celebratingId);
    return (
      <div className="fixed bottom-20 right-6 z-50 max-w-sm animate-bounceIn">
        <div className="bg-terminal-surface border border-gain/40 rounded-lg shadow-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-gain" />
            <span className="font-bold text-gain text-sm">Mission Complete!</span>
          </div>
          <div className="text-sm text-terminal-text">{celMission?.reward}</div>
          <div className="text-xs text-terminal-accent mt-2">+{celMission?.xp} XP</div>
        </div>
      </div>
    );
  }

  return (
    <div className="terminal-panel" data-tutorial="missions">
      {/* Panel Header */}
      <div
        className="terminal-header drag-handle cursor-move"
        onClick={() => setMinimized((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <Rocket className="w-3 h-3" />
          <span>Missions</span>
          <span className="ml-2 px-1.5 py-0.5 bg-terminal-accent/20 text-terminal-accent text-xxs rounded">
            {completedCount}/{MISSIONS.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xxs text-yellow-400">⭐ {totalXP} XP</span>
        </div>
      </div>

      {!minimized && (
        <div className="p-3 space-y-3 max-h-80 overflow-auto">
          {/* Progress bar */}
          <div className="w-full h-2 bg-terminal-border rounded overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-terminal-accent to-gain transition-all duration-500"
              style={{ width: `${(completedCount / MISSIONS.length) * 100}%` }}
            />
          </div>

          {/* Current Mission */}
          {currentMission ? (
            <CurrentMissionCard
              mission={currentMission}
              playerState={playerState}
              marketState={marketState}
            />
          ) : (
            <div className="text-center p-4">
              <Trophy className="w-10 h-10 text-yellow-400 mx-auto mb-2" />
              <div className="text-sm font-bold text-terminal-text">All Missions Complete!</div>
              <div className="text-xs text-terminal-muted mt-1">
                You've mastered the basics. Keep exploring — there's always more to learn!
              </div>
            </div>
          )}

          {/* Completed list */}
          {completedCount > 0 && (
            <div className="space-y-1">
              <div className="text-xxs text-terminal-muted uppercase tracking-wider">Completed</div>
              {MISSIONS.filter((m) => completedMissions.includes(m.id)).map((m) => (
                <div key={m.id} className="flex items-center gap-2 text-xs text-gain/70">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>
                    {m.emoji} {m.title}
                  </span>
                  <span className="text-xxs text-terminal-muted ml-auto">+{m.xp} XP</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Current Mission Card ─────────────────────────────────
function CurrentMissionCard({ mission, playerState, marketState }) {
  return (
    <div className="p-3 bg-terminal-bg border border-terminal-accent/30 rounded-lg">
      {/* Title */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{mission.emoji}</span>
        <div>
          <div className="text-sm font-bold text-terminal-text">{mission.title}</div>
          <div className="text-xs text-terminal-muted">{mission.subtitle}</div>
        </div>
      </div>

      {/* Why */}
      <p className="text-xs text-terminal-muted leading-relaxed mb-3 p-2 bg-terminal-surface rounded">
        💡 {mission.why}
      </p>

      {/* Steps */}
      <div className="space-y-2">
        {mission.steps.map((step, i) => {
          const done = step.check(playerState, marketState);
          return (
            <div key={i} className="flex items-start gap-2">
              {done ? (
                <CheckCircle2 className="w-4 h-4 text-gain flex-shrink-0 mt-0.5" />
              ) : (
                <Circle className="w-4 h-4 text-terminal-muted flex-shrink-0 mt-0.5" />
              )}
              <span
                className={`text-xs ${done ? 'text-gain line-through' : 'text-terminal-text'}`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Reset missions (for dev/testing)
 */
export function resetMissions() {
  localStorage.removeItem('completed-missions');
}

export default GuidedMissionsPanel;
