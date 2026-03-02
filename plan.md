
Used 1 reference
Planned redesign for bakery game and researched codebase
Subagent: Research bakery game codebase

Reviewed content file
Excellent research completed. I have a thorough understanding of the current architecture. Let me clarify a few key decisions before drafting the plan.

Asked 4 questions (Target, Time Scale, Complexity, Education)

Skipped
Planned redesign strategy for legacy JS bakery game
Now let me do one more targeted research pass on the specific files I'll need to reference in the plan.

Subagent: Research specific extension points

Reviewed content file
I now have a thorough understanding of the codebase. Here's the draft plan:

Plan: Open-World Bakery Simulation Redesign
TL;DR — Transform the bakery game from a rigid buy→bake→sell→summary day-loop into an open-ended simulation where a living world runs independently and the player freely chooses what to do each day. The existing phase system in GameController.js stays but becomes optional activities within a time-budgeted day. A new WorldSimulation engine orchestrates 6 core systems (customers, ingredients, competition, weather, staff, equipment) that tick daily and cross-influence each other. Financial education surfaces through contextual mentor hints and a persistent discoverable journal. All changes are additive — existing methods are wrapped/extended, never deleted.

Steps

Step 1 — World Simulation Foundation
Create js/WorldSimulation.js — a central orchestrator class that owns a WorldState object and ticks once per game-day inside showSummaryPhase() at GameController.js:3768, right after economy.simulateDay().

WorldState holds all persistent world data: weather, competitor state, community events, reputation score, equipment wear, staff morale aggregate — everything external to the player's direct inventory/cash.
WorldSimulation.simulateDay(dayNumber, engineSnapshot) calls each subsystem's tick() method in order, passing cross-system data (e.g., weather output feeds into customer and ingredient systems).
Integrate into FinancialEngine.save()/load() at FinancialEngine.js:1638 so world state persists across sessions.
Add <script src="js/WorldSimulation.js"></script> to main.html before GameController.js in the loading order at main.html:4933.
Wire window.game.world = new WorldSimulation() inside GameController.init() at GameController.js:37.
Emit 'world_tick' event via FinancialEngine.emit() after each daily simulation so other systems can react.
Step 2 — Soften Phase Boundaries (Open-Ended Day)
Modify the hub and phase system so phases become optional activities the player can do in any order, multiple times, limited by a time budget per day.

Add a dayTimeRemaining property to GameController, initialized in startDay() at GameController.js:1957. Each activity (buying trip, baking session, selling shift) costs time.
Modify enterPhaseFromHub() at GameController.js:1946 to deduct time rather than switch phases permanently. When time runs out, prompt the player to end the day (but don't force it — they can push into overtime at a cost).
Remove the numbered labels "① ② ③ ④" from hex pads in ModeHubScene.js:280 to eliminate implied ordering. Relabel to activity names only ("SHOP FOR INGREDIENTS", "BAKE", "OPEN SHOP", "REVIEW DAY").
Add a clock display to the ModeHub scene showing time-of-day and time remaining, ticking in real-time via TimeManager.
Modify confirmNextPhase() at GameController.js:2010 to suggest the most urgent activity (determined by WorldSimulation state) rather than the sequential next phase.
Add a "skip to evening" button on the hub so the player can end the day early and go to summary.
Keep the existing phase HTML renderers (showBuyingPhase, showBakingPhase, showSellingPhase) intact — they become reusable activity screens the player returns from to the hub.
Step 3 — Core System 1: Enhanced Customer Behavior
Extend CustomerDatabase.js to create a persistent customer population that lives in the world.

Add a CustomerPopulation class (new section in the file) maintaining ~200 persistent customer profiles that evolve daily: changing preferences, loyalty tier shifts, moving away/arriving.
Implement peak hours using existing DEMAND.hourlyMultiplier at GameConfig.js:1128 but make it dynamic: influenced by weather (Step 6), community events (WorldSimulation), and day-of-week patterns at GameConfig.js:965.
Add word-of-mouth system: satisfied customers bring friends (new profiles created), dissatisfied ones reduce foot traffic. Wire into processSale() events at FinancialEngine.js:1278.
Add customer preference trends: WorldSimulation shifts demand toward/away from product categories over multi-week cycles (e.g., health trend boosts muffins, holiday trend boosts cakes). Store trend data in WorldState.
Add returning customer recognition: when a known customer spawns during selling, show their name, loyalty tier, and past preferences. Influences CustomerInteractionScene dialogue at CustomerInteractionScene.js.
Extend CustomerDatabase.startDay() / endDay() methods to tick population changes.
Step 4 — Core System 2: Ingredient Availability & Seasons
Extend EconomicSimulation.js and GameConfig.js with richer ingredient dynamics.

Add SEASONAL_AVAILABILITY config section to GAME_CONFIG: per-ingredient availability multipliers by season (e.g., berries abundant in SUMMER, scarce in WINTER). Currently only category-level season mods exist at GameConfig.js:935.
Create vendor relationship system: add a vendors array to WorldState. Each vendor has reliability, quality tier, relationship score. Buying repeatedly from one vendor improves prices and unlocks exclusive seasonal ingredients. Add vendor selection UI to showBuyingPhase().
Implement supply chain disruptions as WorldSimulation events: delivery delays (vendor unavailable for 1-3 days), quality drops (bad batch), and shortages (ingredient unavailable at any vendor). These extend the existing ECONOMIC_EVENTS array at GameConfig.js:978.
Add ingredient quality variance: batches bought during peak season have higher baseQuality, off-season batches are lower. Feeds into product quality in finishProductionItem() at FinancialEngine.js:1145.
Show market forecasts (imperfect) on the buying phase UI so the player can plan purchases strategically.
Step 5 — Core System 3: Competition
Create js/CompetitorSimulation.js — persistent AI bakeries that compete for customers.

Define 2-3 competitor archetypes: Budget Chain (low price, low quality), Artisan Boutique (high price, high quality), Café Hybrid (medium, coffee focus). Each has AI behavior: pricing strategy, product mix, marketing spend.
Competitors tick daily via WorldSimulation.simulateDay(). They adjust prices based on market conditions, launch promotions, and sometimes close/open.
Market share tracked in WorldState: total customer demand is split between player and competitors based on relative price, quality, reputation, and marketing.
Competitors affect the player through: price pressure (customers compare), customer poaching (competitor promotions steal regulars), and opportunity (competitor closure floods market).
Surface competitor activity through notifications using NotificationSystem at NotificationSystem.js — "Sweet Deals Bakery is running a 20% off sale this week."
Replace the one-off new_competitor scenario in DynamicScenarios.js:8 with a reference to the persistent competitor system. Keep the scenario trigger as the event that introduces a new competitor into the simulation.
Add a "Market Intel" section to the ModeHub showing competitor prices and estimated market share (costs time/money to unlock, simulating real-world market research).
Step 6 — Core System 4: Weather System
Create js/WeatherSystem.js — daily weather generation with cascading effects.

Weather types: sunny, cloudy, rainy, stormy, snowy, heat wave, cold snap. Generated with seasonal probability tables (storms more likely in spring, heat waves in summer, etc.).
3-day forecast shown on ModeHub (60% accurate for day 2, 40% for day 3) so the player can plan.
Weather affects:
Foot traffic: rainy = -30%, sunny weekend = +20%. Applied as a multiplier in startSellingLoop() at GameController.js:3294 alongside existing scenario modifiers.
Ingredient delivery: storms can delay deliveries (vendor unavailable, feeds into Step 4).
Product demand: hot weather boosts cold drinks/light pastries, cold weather boosts hearty bread/hot items. Applied via WorldState.demandModifiers consumed by customer purchasing logic.
Staff morale: extended bad weather slightly reduces morale (Step 7).
Equipment: extreme temperatures increase wear rate (Step 8).
Wire into WorldSimulation.simulateDay() as the first subsystem to tick, since other systems depend on weather output.
Add weather icon + temperature display to ModeHub scene and phase screens.
Step 7 — Core System 5: Enhanced Staff Behavior
Extend StaffManager.js and FinancialEngine.js staff logic.

Add morale system: each staff member gets a morale score (0-100) affected by: workload, pay fairness, consecutive days worked, workplace events, weather. Low morale = lower performance, higher quit risk.
Add skill growth: staff improve at tasks they repeatedly perform (existing experience tracking at StaffManager extended with skill specializations: baking, customer service, cleaning).
Add staff events as WorldSimulation triggers: sick days (staff unavailable 1-3 days), personal requests (day off, raise), training opportunities (pay to boost skills), interpersonal conflicts (two staff morale drops).
Add autonomous behavior: when the player doesn't assign tasks, staff follow their own priorities based on personality and skill. Well-trained staff make good decisions; new hires make mistakes.
Modify the existing staff_crisis scenario in DynamicScenarios.js to be triggered by the morale system rather than pure random chance.
Add staff management UI to the ModeHub: a small panel showing staff status, morale indicators, and quick actions (schedule adjustment, raise, training).
Step 8 — Core System 6: Equipment Lifecycle
Extend the equipment system in FinancialEngine.js (existing equipment property in reset() at L10).

Add condition (0-100%), maintenanceSchedule, totalUses, and lastMaintained to each equipment piece.
Degradation: each bake cycle degrades equipment condition based on usage intensity. Extreme weather (Step 6) accelerates wear.
Maintenance: player can spend time + money on maintenance during a hub activity. Neglected equipment has increasing breakdown probability.
Breakdown effects: reduced baking capacity (fewer items per batch), lower quality output, or complete stoppage requiring expensive emergency repair. Replaces the one-off equipment_failure scenario in DynamicScenarios.js with a continuous system.
Upgrades: purchasable equipment improvements (larger oven, faster mixer, better refrigeration) that cost significant cash but improve capacity/quality/efficiency. Added to GAME_CONFIG as an EQUIPMENT section.
Visual indicators on baking phase UI showing equipment health and estimated remaining life.
Step 9 — Education System: Journal + Contextual Hints
Create js/BusinessJournal.js and extend NotificationSystem.js.

BusinessJournal: a persistent, discoverable encyclopedia the player builds up. Entries unlock when the player encounters relevant situations (first supply shortage unlocks "Supply Chain Management", first competitor opens unlocks "Competitive Analysis").
Draw content from existing FinancialEducation.js data at FinancialEducation.js (375 lines of business terms with explanations, examples, strategies).
Add journal entries for each of the 14+ world systems, cross-referenced with DynamicScenarios.educationalContent.
Contextual Mentor Hints: extend NotificationSystem with a new mentor notification type featuring Pierre (the existing tutorial character from TutorialSystem.js). Pierre appears non-intrusively when:
A world event happens that the player hasn't encountered before.
The player's actions conflict with sound financial strategy (e.g., buying at peak prices, ignoring equipment maintenance).
A journal entry is about to unlock ("You just experienced your first supply disruption! Check your Business Journal.").
Add a journal button to the ModeHub and a journal view accessible from any phase.
Track encounteredConcepts[] in save data so hints don't repeat.
Step 10 — Cross-System Integration & Emergence
Wire all 6 core systems together through WorldSimulation so they create emergent, unpredictable situations.

Weather → Customers + Ingredients: storms reduce foot traffic AND delay ingredient deliveries simultaneously, forcing player to adapt on multiple fronts.
Competition → Customers → Revenue: competitor promotions shift customer loyalty, reducing foot traffic. Player must decide: match prices, differentiate on quality, or increase marketing.
Staff Morale → Product Quality → Customer Satisfaction → Reputation → Foot Traffic: a chain where neglecting staff eventually reduces revenue through multiple intermediaries — the player discovers the connection organically.
Equipment Condition → Baking Capacity → Stock Availability → Lost Sales: poorly maintained equipment limits what the player can produce, causing stockouts during peak demand.
Seasonal Ingredients → Menu Innovation → Customer Interest → Revenue: seasonal ingredients become available/unavailable, incentivizing recipe experimentation using the existing recipe lab.
Replace activeScenarioEffects[] in GameController (currently not saved) with a persistent effects system in WorldState that properly serializes. Migrate existing effect application in getScenarioModifier() at GameController.js:4958 to read from WorldState.
Add a "World Conditions" overlay to the ModeHub showing a summary dashboard of all active factors (weather, market trends, competitor activity, staff status, equipment health) so the player can make informed decisions.
Step 11 — Expand to Remaining World Systems (Future)
After the core 6, add remaining systems as incremental expansions using the same WorldSimulation.registerSubsystem() pattern:

Health & safety regulations (inspection events, compliance costs)
Community events (local festivals boosting traffic, charity opportunities for reputation)
Advertising & marketing (campaign system with ROI tracking)
Technology advancements (online ordering, delivery service, POS systems)
Environmental factors (waste reduction bonuses, sustainability reputation)
Global events (economic downturns, pandemics — extending existing economic_downturn scenario)
Loan/debt system (ongoing interest payments, credit score)
Multi-location expansion (unlock second bakery after reaching milestones)
Each follows the pattern: config data in GAME_CONFIG → subsystem class → registered in WorldSimulation → cross-system hooks → journal entries → mentor hints. 

