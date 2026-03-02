/**
 * WorldSimulation.js — Central orchestrator for the living bakery world.
 *
 * The world ticks once per game-day (called from showSummaryPhase),
 * updating weather, competitors, community events, reputation, equipment
 * wear, and staff morale.  Each subsystem implements a simple interface:
 *
 *     { tick(dayNumber, worldState, engineSnapshot), save(), load(data) }
 *
 * Cross-system influences flow through the shared `WorldState` object that
 * every subsystem can read from but only its owner may write to.
 */

class WorldSimulation {
    constructor() {
        /** Persistent world state shared across subsystems */
        this.state = this._defaultState();

        /** Registered subsystems in tick order (plain object for dot-access) */
        this.subsystems = {};
        this._subsystemOrder = [];

        /** Event log for recent world happenings (last 30 days) */
        this.eventLog = [];

        console.log('🌍 WorldSimulation initialised');
    }

    /* ------------------------------------------------------------------ */
    /*  Default state                                                      */
    /* ------------------------------------------------------------------ */
    _defaultState() {
        return {
            day: 1,

            // Weather (populated by WeatherSystem)
            weather: {
                today: { type: 'sunny', temperature: 72, severity: 0 },
                forecast: [],             // next 3 days (imperfect)
                streak: 0                 // consecutive same-type days
            },

            // Reputation & brand (0-100 scale)
            reputation: {
                score: 50,
                trend: 0,                  // daily delta
                reviews: [],               // last 10 customer reviews
                wordOfMouth: 1.0           // foot traffic multiplier
            },

            // Competition (populated by CompetitorSimulation)
            competitors: [],

            // Market share (0-1, player's share of total demand)
            marketShare: 0.5,

            // Community events & happenings
            communityEvents: [],

            // Demand modifiers produced by cross-system interactions
            demandModifiers: {
                weather: 1.0,
                competition: 1.0,
                reputation: 1.0,
                community: 1.0,
                seasonal: 1.0,
                advertising: 1.0,
                technology: 1.0,
                environmental: 1.0,
                global: 1.0
            },

            // Global event cost modifier
            globalCostMod: 1.0,

            // Quality modifier from equipment condition
            equipmentQualityMod: 1.0,

            // Staff aggregate morale (0-100)
            staffMoraleAvg: 75,

            // Active world effects (persistent, serialised)
            activeEffects: [],

            // Journal unlock tracking
            encounteredConcepts: [],

            // Vendor relationships
            vendors: [],

            // Seasonal ingredient availability
            seasonalAvailability: {}
        };
    }

    /* ------------------------------------------------------------------ */
    /*  Subsystem registration                                             */
    /* ------------------------------------------------------------------ */

    /**
     * Register a subsystem.  Earlier registrations tick first.
     * @param {string} id   Unique key (e.g. 'weather', 'competitors')
     * @param {object} sys  Object with tick(day, state, snapshot), save(), load()
     */
    registerSubsystem(id, sys) {
        this.subsystems[id] = sys;
        if (!this._subsystemOrder.includes(id)) {
            this._subsystemOrder.push(id);
        }
        console.log(`  🔗 Subsystem registered: ${id}`);
    }

    getSubsystem(id) {
        return this.subsystems[id] || null;
    }

    /* ------------------------------------------------------------------ */
    /*  Daily tick                                                         */
    /* ------------------------------------------------------------------ */

    /**
     * Run a full world tick for the given day.
     * @param {number}  dayNumber       Current game day
     * @param {object}  engineSnapshot  Lightweight read-only snapshot from
     *                                  FinancialEngine (cash, staff, products…)
     * @returns {object}  worldReport — summary of what changed
     */
    simulateDay(dayNumber, engineSnapshot = {}) {
        this.state.day = dayNumber;
        const report = { day: dayNumber, events: [] };

        // Tick each subsystem in registration order
        for (const id of this._subsystemOrder) {
            const sys = this.subsystems[id];
            if (sys && typeof sys.tick === 'function') {
                try {
                    const subReport = sys.tick(dayNumber, this.state, engineSnapshot);
                    if (subReport && subReport.events) {
                        report.events.push(...subReport.events);
                    }
                } catch (err) {
                    console.error(`WorldSimulation: subsystem '${id}' tick error`, err);
                }
            }
        }

        // Cross-system integration pass
        this._runCrossSystemEffects(engineSnapshot);

        // Trim event log to last 30 days
        this.eventLog.push(...report.events);
        this.eventLog = this.eventLog.filter(e => dayNumber - e.day <= 30);

        // Purge expired active effects
        this.state.activeEffects = this.state.activeEffects.filter(
            eff => dayNumber <= eff.expiresOnDay
        );

        return report;
    }

    /* ------------------------------------------------------------------ */
    /*  Cross-system interaction rules                                     */
    /* ------------------------------------------------------------------ */

    _runCrossSystemEffects(snapshot) {
        const s = this.state;

        // 1. Weather → demand
        const w = s.weather.today;
        const weatherDemandMap = {
            sunny: 1.1, cloudy: 1.0, rainy: 0.75, stormy: 0.55,
            snowy: 0.6, heatwave: 0.85, coldsnap: 0.9
        };
        s.demandModifiers.weather = weatherDemandMap[w.type] || 1.0;

        // Weekend bonus on nice weather
        const dow = (s.day - 1) % 7;
        if ((dow === 5 || dow === 6) && w.type === 'sunny') {
            s.demandModifiers.weather *= 1.12;
        }

        // 2. Reputation → demand (reputation 50 = neutral, 100 = +30%, 0 = −50%)
        s.demandModifiers.reputation = 0.5 + (s.reputation.score / 100) * 0.8;

        // Word of mouth evolves slowly toward reputation
        const targetWoM = s.demandModifiers.reputation;
        s.reputation.wordOfMouth += (targetWoM - s.reputation.wordOfMouth) * 0.15;

        // 3. Competition → demand
        if (s.competitors.length > 0) {
            const competitorPressure = s.competitors.reduce((sum, c) => sum + (c.marketPower || 0.1), 0);
            s.demandModifiers.competition = Math.max(0.5, 1.0 - competitorPressure * 0.15);
        } else {
            s.demandModifiers.competition = 1.0;
        }

        // 4. Community events → demand
        const activeComm = s.communityEvents.filter(e => s.day >= e.startDay && s.day <= e.endDay);
        s.demandModifiers.community = activeComm.reduce(
            (m, e) => m * (e.demandMod || 1.0), 1.0
        );

        // 5. Staff morale → quality chain
        //    Low morale = slight quality drop on finished products
        if (snapshot.staff && snapshot.staff.length > 0) {
            const avgHappiness = snapshot.staff.reduce((s, st) => s + (st.happiness || 75), 0) / snapshot.staff.length;
            s.staffMoraleAvg = avgHappiness;
        }

        // 6. Equipment condition → quality mod
        if (snapshot.equipment) {
            const conditions = [];
            for (const category of Object.values(snapshot.equipment)) {
                if (Array.isArray(category)) {
                    category.forEach(eq => conditions.push(eq.condition ?? 100));
                }
            }
            if (conditions.length > 0) {
                const avg = conditions.reduce((a, b) => a + b, 0) / conditions.length;
                s.equipmentQualityMod = 0.7 + (avg / 100) * 0.3; // 70-100% quality
            }
        }

        // 7. Market share calculation
        const playerStrength = (s.reputation.score / 100) + 0.5;
        const totalStrength = playerStrength + s.competitors.reduce(
            (sum, c) => sum + (c.strength || 0.3), 0
        );
        s.marketShare = playerStrength / Math.max(1, totalStrength);
    }

    /* ------------------------------------------------------------------ */
    /*  Reputation helpers                                                 */
    /* ------------------------------------------------------------------ */

    adjustReputation(delta, reason) {
        const s = this.state.reputation;
        s.score = Math.max(0, Math.min(100, s.score + delta));
        s.trend = delta;
        if (reason) {
            this.logEvent('reputation', reason, delta > 0 ? 'positive' : 'negative');
        }
    }

    addReview(score, text) {
        this.state.reputation.reviews.unshift({ score, text, day: this.state.day });
        if (this.state.reputation.reviews.length > 10) {
            this.state.reputation.reviews.pop();
        }
        // Reviews nudge reputation
        const nudge = (score - 3) * 0.5; // 5-star = +1, 1-star = −1
        this.adjustReputation(nudge, text);
    }

    /* ------------------------------------------------------------------ */
    /*  Active effects (replaces volatile activeScenarioEffects)           */
    /* ------------------------------------------------------------------ */

    addEffect(effect) {
        const e = {
            key: effect.key,
            multiplier: effect.multiplier ?? 1,
            value: effect.value ?? 0,
            label: effect.label || 'World effect',
            operation: effect.operation || 'multiply',
            expiresOnDay: this.state.day + (effect.duration || 3) - 1,
            source: effect.source || 'world'
        };
        this.state.activeEffects.push(e);
        return e;
    }

    getEffectModifier(key, operation = 'multiply') {
        const effects = this.state.activeEffects.filter(e => e.key === key);
        if (operation === 'add') {
            return effects.reduce((sum, e) => sum + (e.value || 0), 0);
        }
        return effects.reduce((acc, e) => acc * (e.multiplier ?? 1), 1);
    }

    /* ------------------------------------------------------------------ */
    /*  Event log                                                          */
    /* ------------------------------------------------------------------ */

    logEvent(category, description, sentiment = 'neutral') {
        this.eventLog.push({
            day: this.state.day,
            category,
            description,
            sentiment,
            timestamp: Date.now()
        });
    }

    getRecentEvents(count = 5) {
        return this.eventLog.slice(-count);
    }

    /* ------------------------------------------------------------------ */
    /*  Concept tracking (for journal)                                     */
    /* ------------------------------------------------------------------ */

    encounterConcept(conceptId) {
        if (!this.state.encounteredConcepts.includes(conceptId)) {
            this.state.encounteredConcepts.push(conceptId);
            return true; // first time
        }
        return false;
    }

    /* ------------------------------------------------------------------ */
    /*  Combined demand multiplier (all cross-system factors)              */
    /* ------------------------------------------------------------------ */

    getDemandMultiplier() {
        const d = this.state.demandModifiers;
        return d.weather * d.competition * d.reputation * d.community * d.seasonal *
               (d.advertising || 1) * (d.technology || 1) * (d.environmental || 1) * (d.global || 1);
    }

    /* ------------------------------------------------------------------ */
    /*  Save / Load                                                        */
    /* ------------------------------------------------------------------ */

    save() {
        const subsystemState = {};
        for (const id of this._subsystemOrder) {
            const sys = this.subsystems[id];
            if (sys && typeof sys.save === 'function') {
                subsystemState[id] = sys.save();
            }
        }
        return {
            worldState: JSON.parse(JSON.stringify(this.state)),
            subsystems: subsystemState,
            eventLog: this.eventLog.slice(-30)
        };
    }

    load(data) {
        if (!data) return;
        if (data.worldState) {
            // Merge into existing default to pick up any new fields
            this.state = { ...this._defaultState(), ...data.worldState };
        }
        if (data.subsystems) {
            for (const id of this._subsystemOrder) {
                const sys = this.subsystems[id];
                if (sys && data.subsystems[id] && typeof sys.load === 'function') {
                    sys.load(data.subsystems[id]);
                }
            }
        }
        if (data.eventLog) {
            this.eventLog = data.eventLog;
        }
    }
}

window.WorldSimulation = WorldSimulation;
