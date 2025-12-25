# Development Plan — Sweet Success Bakery Simulator

Goal: evolve the game into a richer, more realistic, and more educational bakery business simulator while keeping it fun and approachable.

## Priorities (why / impact)
- Realistic finances & teaching (high): improves learning outcomes and replay value.
- Player interactivity (high): mini-games and exploration increase engagement.
- Operations depth (medium): staffing and scheduling adds meaningful choices.
- Analytics & persistence (medium): enables learning feedback and longer campaigns.

---

## Suggested Feature Areas & Implementation Notes

1) Economic Simulation (core)
- Add variable costs: ingredient spot prices that fluctuate by vendor and season.
- Supply & demand model: customer arrival rates and purchase probability vary by time, price, weather/season, and marketing.
- Loans, interest, and cashflow: add short-term loans (interest rates, repayment schedules) and bank penalties.
- Cost drivers: rent, utilities, spoilage, and maintenance events.
- Implementation notes: keep engine decoupled (like `FinancialEngine`). Use small time-step simulation (minutes). Expose knobs for balancing.

2) Staff & Operations
- Staff profiles: skill, efficiency, salary, training cost, and happiness.
- Shift scheduling: open/close hours, staff fatigue, overtime costs.
- Equipment wear & maintenance: capacity, breakdown probability, repair costs.
- Implementation: add staff objects in engine, process payroll in daily summary.

3) Customers & Marketing
- Customer segments with different willingness-to-pay, frequency, and product preferences.
- Marketing actions: simple campaigns (discounts, flyers, social) with ROI and decay.
- Reviews & reputation: affect long-term demand and allow viral growth.
- Implementation: create customer pool sampled by hour with weighted choices.

4) Pricing & Elasticity
- Per-product pricing controls and price elasticity model.
- Tools: charts showing demand at different prices, quick A/B promotions.
- Implementation: price -> demand multiplier; compute expected revenue vs. margin.

5) Inventory & Spoilage
- Granular inventory: batch dates, shelf-life, FIFO consumption, spoilage risk.
- Bulk purchasing discounts and contracts with vendors.
- Implementation: track batches with timestamps and quality percentages.

6) Events, Seasonality, and Scenario System
- Random events (crises, health inspections) and scheduled seasonality (holidays, weather).
- Scenario editor: design scenarios teaching concepts (cash crunch, rapid growth).

7) Player Interactions & Mini-Games
- Baking mini-game: timing/skill affects product quality and yield.
- Service mini-game: quick-time events to improve customer satisfaction during rush.
- Setup/build mini-game: layout decisions that change traffic patterns.
- Use Phaser scenes for each mini-game and keep engine deterministic by returning quality modifiers.

8) Education & Feedback
- Curriculum-style tutorial paths (e.g., "Break-even basics", "Managing cashflow").
- KPI dashboard: cashflow, COGS, gross margin, break-even point, inventory turnover.
- Actionable tips: contextual hints when KPIs drop.

9) UX, Telemetry & Replays
- Save slots and scenario replays; store key events to allow post-run review.
- Telemetry: anonymized event logs for balance tuning (optional).

10) Testing & Balancing
- Add unit tests for `FinancialEngine` rules and deterministic scenarios for balancing.
- Staged releases: progressively unlock complexity (Beginner → Intermediate → Advanced).

---

## Quick Roadmap (3 releases)
- Release A (next sprint): Improve demand model, add loans, fix UI for hub, and one mini-game prototype.
- Release B (2–3 sprints): Staff/scheduling, inventory batches, pricing elasticity, tutorial expansion.
- Release C (longer): Events, marketing, analytics, scenario editor, polish and mobile performance.

## Metrics to Monitor
- Average day profit/loss, cash at day end, bankruptcy rate
- Player retention per session (do they return to hub?), time spent per phase
- Tutorial completion and learning outcome (do players hit positive gross profit within N days?)

## Tech Recommendations
- Keep `FinancialEngine` pure and testable; expose a small API for deterministic simulation.
- Use Phaser 3 for mini-games and hub; keep HTML overlays for rich forms/charts.
- Consider storing replays as compact event logs (not full snapshots).

---

## Next Steps (suggested immediate work)
1. Add a simple demand elasticity model and variable vendor prices.
2. Implement loan objects with UI and repayment schedule.
3. Prototype one mini-game (bake quality game) and wire its outcome to product quality.

If you'd like, I can start with step 1 and implement a basic demand elasticity and vendor price system in `FinancialEngine`.
