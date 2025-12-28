# Development Plan — Sweet Success Bakery Simulator

Goal: evolve the game into a richer, more realistic, and more educational bakery business simulator while keeping it fun and approachable.

## Priorities (why / impact)
- Realistic finances & teaching (high): improves learning outcomes and replay value.
- Player interactivity (high): mini-games and exploration increase engagement.
- Operations depth (medium): staffing and scheduling adds meaningful choices.
- Analytics & persistence (medium): enables learning feedback and longer campaigns.

## Owner-Only Gameplay Architecture
Move the player away from manual labor and toward strategic decision-making. The core loop becomes: analyze data → set strategy knobs → approve/adjust → review results.

### Autonomous Operations Layer
- Convert buying, baking, and selling into NPC-run flows. Staff execute production queues, purchasing agents replenish stock, and floor teams serve customers. Players set policies, not micro-actions.
- Introduce "Operating Playbooks" that bundle recurring automation rules (e.g., conservative cash mode vs. aggressive growth). Switching playbooks immediately reconfigures staffing, inventory buffers, and marketing spend.
- Expand staff AI to cover shift bidding, task routing, and escalation when bottlenecks appear. Track KPIs such as capacity utilization and service level to visualize automation efficiency.

### Strategic Controls & Business Philosophy
- Add a Business Philosophy board where players pick guiding principles (quality focus, cost leadership, community brand, etc.). Each principle modifies systems (ingredient sourcing, marketing tone, staffing morale).
- Allow custom recipes. Players choose ingredients, prep complexity, and desired quality targets; the engine derives cost, bake time, and risk. Recipes can be bundled into product lines aimed at specific customer personas.
- Create pricing and promotion workflows. For each recipe/product line, the player sets base price, discount cadence, loyalty perks, and bundling strategies. Tie these to elasticity curves and tracked experiments.
- Implement market targeting. Players allocate marketing budgets toward customer cohorts (tourists, commuters, foodies) and neighborhoods. Each cohort has spending power, taste profile, and visit frequency.
- Layer in sourcing strategies. Let players negotiate vendor contracts (fixed price vs. spot, bulk commits, ethical sourcing) and hedge via futures-like instruments that stabilize ingredient costs.

### Finance-Forward Learning Loop
- Replace manual baking mini-games with scenario planning: players specify production targets, capital expenditures, and risk appetite; automation attempts to execute and reports constraints.
- Build dashboards focused on finance ratios (gross margin, contribution margin, asset turnover, leverage). Trigger contextual lessons when metrics drift.
- Surface decision journals: every time the player changes philosophy, recipes, or prices, log the hypothesis and show outcome metrics later to reinforce financial thinking.

### Fun Hooks While Staying Hands-Off
- Introduce challenge cards (e.g., investor pitch, surprise inspection) that require choosing between strategic trade-offs rather than manual tasks.
- Let players run "What-if Sims" that fast-forward a week under draft strategies, encouraging experimentation before committing capital.
- Gamify staff automation by unlocking specialist roles (procurement analyst, culinary R&D, yield engineer) that open deeper policy controls when hired.

---

## Suggested Feature Areas & Implementation Notes

1) Economic Simulation (core) ✅ COMPLETED v3.1.0
- ✅ Add variable costs: ingredient spot prices that fluctuate by vendor and season.
- ✅ Supply & demand model: customer arrival rates and purchase probability vary by time, price, weather/season, and marketing.
- ✅ Loans, interest, and cashflow: add short-term loans (interest rates, repayment schedules) and bank penalties.
- ✅ Cost drivers: rent, utilities, spoilage, and maintenance events.
- ✅ Financial Dashboard: comprehensive analytics with Chart.js visualizations
  - 4-tab interface: Overview, Market Conditions, Business Performance, Pricing Analysis
  - KPI tracking with trend indicators
  - Historical data visualization (90-day rolling window)
- ✅ Economic Events: random events affecting market conditions
- ✅ Inflation tracking: realistic economic cycles
- ✅ Seasonal effects: spring, summer, fall, winter modifiers
- Implementation: Complete. EconomicSimulation.js and FinancialDashboard.js fully integrated.

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
