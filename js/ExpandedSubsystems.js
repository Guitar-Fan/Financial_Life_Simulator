/**
 * ExpandedSubsystems.js — Step 11: Eight additional world subsystems.
 *
 * Each subsystem follows the standard interface:
 *   { tick(dayNumber, worldState, engineSnapshot), save(), load(data) }
 *
 * 1. HealthSafetySystem — inspections, compliance, violations
 * 2. CommunityEventSystem — festivals, charity, local happenings
 * 3. AdvertisingSystem — campaigns with ROI tracking
 * 4. TechnologySystem — online ordering, delivery, POS upgrades
 * 5. EnvironmentalSystem — waste, sustainability, green reputation
 * 6. GlobalEventSystem — downturns, pandemics, booms
 * 7. LoanDebtSystem — loans, interest, credit score
 * 8. ExpansionSystem — multi-location milestones
 */

/* ====================================================================== */
/*  1. HEALTH & SAFETY SYSTEM                                             */
/* ====================================================================== */

class HealthSafetySystem {
    constructor() {
        this.state = {
            complianceScore: 80,     // 0-100
            lastInspectionDay: 0,
            inspectionsPassed: 0,
            inspectionsFailed: 0,
            violations: [],          // { type, day, resolved, fine }
            upgrades: [],            // purchased: 'fire_extinguisher', 'hand_wash', etc.
            nextInspectionWindow: 30, // days until next possible inspection
        };
    }

    tick(dayNumber, worldState, snapshot) {
        const events = [];
        const cfg = window.GAME_CONFIG && GAME_CONFIG.WORLD && GAME_CONFIG.WORLD.HEALTH_SAFETY
            ? GAME_CONFIG.WORLD.HEALTH_SAFETY : {};

        // Compliance drifts based on staff morale and equipment condition
        const moraleMod = (worldState.staffMoraleAvg || 75) > 60 ? 0.1 : -0.2;
        const equipMod = (worldState.equipmentQualityMod || 1) > 0.85 ? 0.05 : -0.15;
        this.state.complianceScore = Math.max(0, Math.min(100,
            this.state.complianceScore + moraleMod + equipMod
        ));

        // Resolve old violations (auto-resolve after 7 days with cost)
        this.state.violations = this.state.violations.map(v => {
            if (!v.resolved && dayNumber - v.day >= 7) {
                v.resolved = true;
                events.push({ day: dayNumber, category: 'health_safety', description: `Violation "${v.type}" auto-resolved.`, sentiment: 'neutral' });
            }
            return v;
        });

        // Random inspection
        const daysSinceLast = dayNumber - this.state.lastInspectionDay;
        const baseChance = cfg.inspectionChance || 0.03;
        if (daysSinceLast >= (this.state.nextInspectionWindow || 20) && Math.random() < baseChance) {
            const result = this._runInspection(dayNumber, worldState);
            events.push(result.event);
        }

        return { events };
    }

    _runInspection(dayNumber, worldState) {
        this.state.lastInspectionDay = dayNumber;
        this.state.nextInspectionWindow = 25 + Math.floor(Math.random() * 20);

        const score = this.state.complianceScore;
        const upgradeBonus = this.state.upgrades.length * 3;
        const effectiveScore = Math.min(100, score + upgradeBonus);

        if (effectiveScore >= 70) {
            this.state.inspectionsPassed++;
            const bonus = effectiveScore >= 90 ? 5 : 2;
            worldState.reputation.score = Math.min(100, worldState.reputation.score + bonus);
            return {
                event: { day: dayNumber, category: 'health_safety', description: `Health inspection PASSED (score: ${effectiveScore.toFixed(0)})! Reputation +${bonus}.`, sentiment: 'positive' },
                passed: true, fine: 0
            };
        } else {
            this.state.inspectionsFailed++;
            const fine = 200 + Math.round((70 - effectiveScore) * 10);
            const violationType = effectiveScore < 40 ? 'critical_hygiene' : 'minor_violation';
            this.state.violations.push({ type: violationType, day: dayNumber, resolved: false, fine });
            worldState.reputation.score = Math.max(0, worldState.reputation.score - 5);
            return {
                event: { day: dayNumber, category: 'health_safety', description: `Health inspection FAILED! Fine: $${fine}. Violation: ${violationType}. Fix it quickly!`, sentiment: 'negative' },
                passed: false, fine
            };
        }
    }

    getComplianceStatus() {
        const score = this.state.complianceScore;
        const label = score >= 90 ? 'Excellent' : score >= 70 ? 'Good' : score >= 50 ? 'Fair' : score >= 30 ? 'At Risk' : 'Critical';
        const color = score >= 70 ? '#22c55e' : score >= 50 ? '#eab308' : '#ef4444';
        return { score, label, color, violations: this.state.violations.filter(v => !v.resolved) };
    }

    save() { return JSON.parse(JSON.stringify(this.state)); }
    load(data) { if (data) this.state = { ...this.state, ...data }; }
}

/* ====================================================================== */
/*  2. COMMUNITY EVENT SYSTEM                                             */
/* ====================================================================== */

class CommunityEventSystem {
    constructor() {
        this.state = {
            activeEvents: [],        // currently running events
            pastEvents: [],          // historical record (last 20)
            communityGoodwill: 50,   // 0-100, affects event frequency
            donationTotal: 0,
            participationCount: 0,
        };
    }

    tick(dayNumber, worldState, snapshot) {
        const events = [];
        const pool = (window.GAME_CONFIG && GAME_CONFIG.WORLD && GAME_CONFIG.WORLD.COMMUNITY_EVENTS)
            ? GAME_CONFIG.WORLD.COMMUNITY_EVENTS : [];

        // Expire ended events
        this.state.activeEvents = this.state.activeEvents.filter(e => {
            if (dayNumber > e.endDay) {
                this.state.pastEvents.push(e);
                if (this.state.pastEvents.length > 20) this.state.pastEvents.shift();
                return false;
            }
            return true;
        });

        // Apply active event demand mods to worldState
        const communityMod = this.state.activeEvents.reduce((m, e) => m * (e.demandMod || 1), 1);
        worldState.demandModifiers.community = communityMod;

        // Maybe spawn new event
        const goodwillBonus = this.state.communityGoodwill / 200; // up to 0.5 extra chance
        for (const template of pool) {
            if (this.state.activeEvents.some(e => e.id === template.id)) continue;
            if (Math.random() < (template.probability || 0.02) + goodwillBonus * 0.01) {
                const newEvt = {
                    ...template,
                    startDay: dayNumber,
                    endDay: dayNumber + (template.duration || 1) - 1,
                    participated: false
                };
                this.state.activeEvents.push(newEvt);
                worldState.communityEvents.push(newEvt);
                events.push({ day: dayNumber, category: 'community', description: `${template.name} starts today!`, sentiment: template.demandMod >= 1 ? 'positive' : 'negative' });
                break; // max 1 new event per day
            }
        }

        // Goodwill decays slowly toward 50
        this.state.communityGoodwill += (50 - this.state.communityGoodwill) * 0.02;

        return { events };
    }

    /**
     * Player donates products/cash to a community event.
     * @param {number} amount Dollar value of donation
     */
    donate(amount) {
        this.state.donationTotal += amount;
        this.state.communityGoodwill = Math.min(100, this.state.communityGoodwill + amount * 0.05);
        this.state.participationCount++;
    }

    participate(eventId) {
        const evt = this.state.activeEvents.find(e => e.id === eventId);
        if (evt && !evt.participated) {
            evt.participated = true;
            this.state.communityGoodwill = Math.min(100, this.state.communityGoodwill + 5);
            this.state.participationCount++;
        }
    }

    save() { return JSON.parse(JSON.stringify(this.state)); }
    load(data) { if (data) this.state = { ...this.state, ...data }; }
}

/* ====================================================================== */
/*  3. ADVERTISING & MARKETING SYSTEM                                     */
/* ====================================================================== */

class AdvertisingSystem {
    constructor() {
        this.state = {
            campaigns: [],           // { id, type, cost, startDay, duration, dailyReach, roi }
            activeCampaigns: [],
            totalSpent: 0,
            totalRevenueFromAds: 0,
            brandAwareness: 20,      // 0-100
        };
    }

    tick(dayNumber, worldState, snapshot) {
        const events = [];

        // Expire and calculate ROI for finished campaigns
        this.state.activeCampaigns = this.state.activeCampaigns.filter(c => {
            if (dayNumber > c.endDay) {
                c.roi = c.estimatedRevenue > 0 ? ((c.estimatedRevenue - c.cost) / c.cost * 100).toFixed(0) + '%' : '0%';
                this.state.campaigns.push(c);
                if (this.state.campaigns.length > 20) this.state.campaigns.shift();
                events.push({ day: dayNumber, category: 'marketing', description: `Campaign "${c.name}" ended. ROI: ${c.roi}`, sentiment: 'neutral' });
                return false;
            }
            return true;
        });

        // Active campaigns boost demand and build awareness
        let adDemandBoost = 0;
        for (const camp of this.state.activeCampaigns) {
            const dailyEffect = (camp.dailyReach || 50) / 1000; // each 1000 reach ≈ 0.05 demand boost
            adDemandBoost += dailyEffect;
            camp.estimatedRevenue = (camp.estimatedRevenue || 0) + (snapshot.revenue || 0) * dailyEffect;
            this.state.brandAwareness = Math.min(100, this.state.brandAwareness + dailyEffect * 2);
        }

        // Brand awareness decays slowly (ads have lingering effect)
        this.state.brandAwareness = Math.max(10, this.state.brandAwareness - 0.3);

        // Awareness baseline demand boost (even without active campaigns)
        const awarenessBoost = (this.state.brandAwareness - 20) / 400; // max +0.2
        worldState.demandModifiers.advertising = 1 + adDemandBoost + Math.max(0, awarenessBoost);

        return { events };
    }

    /**
     * Launch a new advertising campaign.
     * Returns the campaign object or null if can't afford.
     */
    launchCampaign(type, dayNumber) {
        const templates = {
            flyer:     { name: '📄 Flyer Drop',        cost: 50,   duration: 3,  dailyReach: 100 },
            social:    { name: '📱 Social Media Ad',    cost: 150,  duration: 5,  dailyReach: 300 },
            newspaper: { name: '📰 Newspaper Ad',       cost: 300,  duration: 7,  dailyReach: 500 },
            radio:     { name: '📻 Local Radio Spot',   cost: 500,  duration: 5,  dailyReach: 800 },
            billboard: { name: '🪧 Billboard Rental',    cost: 1000, duration: 14, dailyReach: 1200 },
            influencer:{ name: '🌟 Influencer Collab',  cost: 750,  duration: 3,  dailyReach: 2000 },
        };
        const t = templates[type];
        if (!t) return null;

        const campaign = {
            id: `${type}_${dayNumber}`,
            ...t, type,
            startDay: dayNumber,
            endDay: dayNumber + t.duration - 1,
            estimatedRevenue: 0
        };
        this.state.activeCampaigns.push(campaign);
        this.state.totalSpent += t.cost;
        return campaign;
    }

    getCampaignTypes() {
        return [
            { type: 'flyer', name: '📄 Flyer Drop', cost: 50, duration: 3, reach: '100/day', desc: 'Cheap local visibility. Low reach but no commitment.' },
            { type: 'social', name: '📱 Social Media', cost: 150, duration: 5, reach: '300/day', desc: 'Good reach, targets younger demographics.' },
            { type: 'newspaper', name: '📰 Newspaper', cost: 300, duration: 7, reach: '500/day', desc: 'Broad local reach, builds brand credibility.' },
            { type: 'radio', name: '📻 Radio', cost: 500, duration: 5, reach: '800/day', desc: 'Wide reach for commuters. Great for awareness.' },
            { type: 'billboard', name: '🪧 Billboard', cost: 1000, duration: 14, reach: '1200/day', desc: 'High visibility, long-lasting impression.' },
            { type: 'influencer', name: '🌟 Influencer', cost: 750, duration: 3, reach: '2000/day', desc: 'Massive short-term burst. Risky but high reward.' },
        ];
    }

    save() { return JSON.parse(JSON.stringify(this.state)); }
    load(data) { if (data) this.state = { ...this.state, ...data }; }
}

/* ====================================================================== */
/*  4. TECHNOLOGY ADVANCEMENT SYSTEM                                       */
/* ====================================================================== */

class TechnologySystem {
    constructor() {
        this.state = {
            purchased: [],           // list of tech IDs owned
            activeFeatures: {},      // { techId: { level, activatedDay } }
            monthlySubscriptions: 0, // recurring monthly tech costs
            techLevel: 0,            // aggregate tech score
        };
    }

    tick(dayNumber, worldState, snapshot) {
        const events = [];

        // Monthly subscription charges (every 30 days)
        if (dayNumber % 30 === 0 && this.state.monthlySubscriptions > 0) {
            events.push({
                day: dayNumber, category: 'technology',
                description: `Monthly tech subscriptions: $${this.state.monthlySubscriptions}`,
                sentiment: 'neutral'
            });
        }

        // Tech level affects efficiency
        const techBoost = this.state.techLevel * 0.02; // each tech point = 2% efficiency
        worldState.demandModifiers.technology = 1 + Math.min(techBoost, 0.3); // cap 30%

        // Online ordering reaches new customers
        if (this.state.activeFeatures.online_ordering) {
            worldState.demandModifiers.technology += 0.05; // extra steady demand
        }

        // Delivery service reaches people who can't visit
        if (this.state.activeFeatures.delivery_service) {
            // Partially offsets bad weather traffic loss
            if (worldState.demandModifiers.weather < 0.9) {
                worldState.demandModifiers.technology += 0.1;
            }
        }

        return { events };
    }

    /**
     * Purchase a technology upgrade.
     * Returns the tech object or null if already owned.
     */
    purchaseTech(techId) {
        if (this.state.purchased.includes(techId)) return null;
        const catalog = this.getTechCatalog();
        const tech = catalog.find(t => t.id === techId);
        if (!tech) return null;

        this.state.purchased.push(techId);
        this.state.activeFeatures[techId] = { level: 1, activatedDay: 0 };
        this.state.monthlySubscriptions += tech.monthly || 0;
        this.state.techLevel += tech.techPoints || 1;
        return tech;
    }

    getTechCatalog() {
        return [
            { id: 'pos_system',       name: '💻 POS System',         cost: 1500, monthly: 30,  techPoints: 2, desc: 'Track sales, inventory, and customer data automatically.' },
            { id: 'online_ordering',   name: '🌐 Online Ordering',    cost: 2000, monthly: 50,  techPoints: 3, desc: 'Accept orders through a website. Reach new customers!' },
            { id: 'delivery_service',  name: '🚗 Delivery Service',   cost: 3000, monthly: 100, techPoints: 3, desc: 'Deliver to customers\' doors. Offsets bad weather.' },
            { id: 'social_integration',name: '📱 Social Integration', cost: 800,  monthly: 20,  techPoints: 1, desc: 'Auto-post specials. Boosts advertising effectiveness.' },
            { id: 'inventory_mgmt',    name: '📦 Inventory Software', cost: 1200, monthly: 25,  techPoints: 2, desc: 'Reduce waste with smart inventory predictions.' },
            { id: 'loyalty_app',       name: '🎯 Loyalty App',        cost: 2500, monthly: 40,  techPoints: 2, desc: 'Digital loyalty cards. +15% repeat customer rate.' },
            { id: 'smart_oven',        name: '🤖 Smart Oven',         cost: 5000, monthly: 0,   techPoints: 3, desc: 'IoT-connected oven. Less burning, better consistency.' },
            { id: 'energy_monitor',    name: '⚡ Energy Monitor',     cost: 600,  monthly: 10,  techPoints: 1, desc: 'Track and reduce energy costs. Slight sustainability boost.' },
        ];
    }

    save() { return JSON.parse(JSON.stringify(this.state)); }
    load(data) { if (data) this.state = { ...this.state, ...data }; }
}

/* ====================================================================== */
/*  5. ENVIRONMENTAL / SUSTAINABILITY SYSTEM                               */
/* ====================================================================== */

class EnvironmentalSystem {
    constructor() {
        this.state = {
            sustainabilityScore: 30, // 0-100
            wastePct: 15,            // % of products wasted daily
            energyEfficiency: 50,    // 0-100
            initiatives: [],         // purchased green initiatives
            greenRepBonus: 0,        // reputation bonus per day
        };
    }

    tick(dayNumber, worldState, snapshot) {
        const events = [];

        // Calculate waste from unsold products
        const totalProduced = snapshot.products ? Object.values(snapshot.products).reduce((s, p) => s + (p.quantity || 0), 0) : 0;
        const sold = snapshot.customersServed || 0;
        if (totalProduced > 0) {
            this.state.wastePct = Math.max(0, Math.min(80, ((totalProduced - sold) / totalProduced) * 100));
        }

        // Sustainability score updates
        const wasteScore = Math.max(0, 100 - this.state.wastePct * 2);
        const initiativeBonus = this.state.initiatives.length * 8;
        this.state.sustainabilityScore = Math.min(100, (wasteScore * 0.5 + this.state.energyEfficiency * 0.3 + initiativeBonus * 0.2));

        // Green reputation bonus (small daily nudge)
        this.state.greenRepBonus = this.state.sustainabilityScore > 60 ? (this.state.sustainabilityScore - 60) * 0.02 : 0;
        worldState.reputation.score = Math.min(100, worldState.reputation.score + this.state.greenRepBonus);

        // High sustainability reduces operating costs (modeled as effect)
        worldState.demandModifiers.environmental = 1 + (this.state.sustainabilityScore - 30) / 500; // max +0.14

        // Milestone events
        if (this.state.sustainabilityScore >= 80 && !this._milestone80) {
            this._milestone80 = true;
            events.push({ day: dayNumber, category: 'environmental', description: '🌿 Your bakery earned a "Green Business" certification! Reputation boosted.', sentiment: 'positive' });
            worldState.reputation.score = Math.min(100, worldState.reputation.score + 5);
        }

        return { events };
    }

    purchaseInitiative(initiativeId) {
        if (this.state.initiatives.includes(initiativeId)) return null;
        const catalog = this.getInitiativeCatalog();
        const init = catalog.find(i => i.id === initiativeId);
        if (!init) return null;
        this.state.initiatives.push(initiativeId);
        this.state.energyEfficiency = Math.min(100, this.state.energyEfficiency + (init.energyBonus || 0));
        return init;
    }

    getInitiativeCatalog() {
        return [
            { id: 'composting',       name: '♻️ Composting Program', cost: 300,  energyBonus: 5,  desc: 'Compost food waste. Reduces waste % and improves sustainability.' },
            { id: 'led_lighting',     name: '💡 LED Lighting',       cost: 500,  energyBonus: 10, desc: 'Cut energy costs with efficient lighting.' },
            { id: 'solar_panels',     name: '☀️ Solar Panels',       cost: 5000, energyBonus: 25, desc: 'Significantly reduce energy costs. Big green reputation boost.' },
            { id: 'local_sourcing',   name: '🌾 Local Sourcing',     cost: 200,  energyBonus: 5,  desc: 'Source locally. Higher cost but great for sustainability image.' },
            { id: 'packaging',        name: '📦 Eco Packaging',      cost: 400,  energyBonus: 8,  desc: 'Biodegradable containers. Customers appreciate it.' },
            { id: 'food_donation',    name: '❤️ Food Donation Partner', cost: 0, energyBonus: 3,  desc: 'Donate unsold goods. Reduces waste, boosts community goodwill.' },
        ];
    }

    save() { return JSON.parse(JSON.stringify(this.state)); }
    load(data) { if (data) this.state = { ...this.state, ...data }; this._milestone80 = this.state.sustainabilityScore >= 80; }
}

/* ====================================================================== */
/*  6. GLOBAL EVENT SYSTEM                                                 */
/* ====================================================================== */

class GlobalEventSystem {
    constructor() {
        this.state = {
            currentEvent: null,      // { id, name, type, severity, startDay, duration, effects }
            eventHistory: [],        // last 10
            economicIndex: 100,      // 80-120, general economic health
            inflationRate: 0.02,     // annual
        };
    }

    tick(dayNumber, worldState, snapshot) {
        const events = [];

        // Check if current event has ended
        if (this.state.currentEvent) {
            const evt = this.state.currentEvent;
            if (dayNumber > evt.startDay + evt.duration) {
                events.push({ day: dayNumber, category: 'economy', description: `${evt.name} has ended. Markets stabilising.`, sentiment: 'positive' });
                this.state.eventHistory.push(evt);
                if (this.state.eventHistory.length > 10) this.state.eventHistory.shift();
                this.state.currentEvent = null;
            }
        }

        // Apply ongoing global event effects
        if (this.state.currentEvent) {
            const eff = this.state.currentEvent.effects;
            if (eff.demandMod) worldState.demandModifiers.global = eff.demandMod;
            if (eff.costMod) worldState.globalCostMod = eff.costMod;
        } else {
            worldState.demandModifiers.global = 1.0;
            worldState.globalCostMod = 1.0;
        }

        // Economic index drifts
        const drift = (Math.random() - 0.48) * 0.5; // slight upward bias
        this.state.economicIndex = Math.max(70, Math.min(130, this.state.economicIndex + drift));

        // Random global event spawn (only if none active)
        if (!this.state.currentEvent && Math.random() < 0.008) {
            const newEvt = this._randomGlobalEvent(dayNumber);
            this.state.currentEvent = newEvt;
            events.push({ day: dayNumber, category: 'economy', description: `🌍 ${newEvt.name}! ${newEvt.description}`, sentiment: newEvt.effects.demandMod < 1 ? 'negative' : 'positive' });
        }

        // Inflation ticks (minor daily cost increase over time)
        if (dayNumber % 90 === 0) {
            this.state.inflationRate = Math.max(0.005, Math.min(0.08, this.state.inflationRate + (Math.random() - 0.45) * 0.005));
        }

        return { events };
    }

    _randomGlobalEvent(dayNumber) {
        const pool = [
            { id: 'economic_downturn', name: '📉 Economic Downturn', description: 'Consumer spending drops across the board.', duration: 15, effects: { demandMod: 0.75, costMod: 1.0 } },
            { id: 'economic_boom',     name: '📈 Economic Boom', description: 'People are spending freely. Enjoy the good times!', duration: 12, effects: { demandMod: 1.25, costMod: 1.05 } },
            { id: 'supply_crisis',     name: '🚢 Supply Chain Crisis', description: 'Global shipping delays. Ingredient costs soar.', duration: 10, effects: { demandMod: 0.95, costMod: 1.35 } },
            { id: 'health_scare',      name: '🦠 Health Scare', description: 'A scare reduces foot traffic. People staying home.', duration: 8, effects: { demandMod: 0.6, costMod: 1.0 } },
            { id: 'tourism_surge',     name: '✈️ Tourism Surge', description: 'Tourists flood the area! Great for business.', duration: 10, effects: { demandMod: 1.4, costMod: 1.0 } },
            { id: 'inflation_spike',   name: '💸 Inflation Spike', description: 'Everything costs more. Customers still hungry though.', duration: 20, effects: { demandMod: 0.9, costMod: 1.25 } },
            { id: 'food_trend',        name: '🍰 Baking Goes Viral', description: 'A social media trend makes artisan baking cool!', duration: 7, effects: { demandMod: 1.5, costMod: 1.0 } },
            { id: 'energy_crisis',     name: '⚡ Energy Crisis', description: 'Energy prices spike. Equipment costs more to run.', duration: 12, effects: { demandMod: 0.95, costMod: 1.2 } },
        ];
        return { ...pool[Math.floor(Math.random() * pool.length)], startDay: dayNumber };
    }

    save() { return JSON.parse(JSON.stringify(this.state)); }
    load(data) { if (data) this.state = { ...this.state, ...data }; }
}

/* ====================================================================== */
/*  7. LOAN & DEBT SYSTEM                                                  */
/* ====================================================================== */

class LoanDebtSystem {
    constructor() {
        this.state = {
            loans: [],               // { id, principal, remaining, rate, monthlyPayment, startDay, termDays }
            creditScore: 650,        // 300-850
            totalBorrowed: 0,
            totalRepaid: 0,
            missedPayments: 0,
        };
    }

    tick(dayNumber, worldState, snapshot) {
        const events = [];

        // Process monthly payments (every 30 days)
        for (const loan of this.state.loans) {
            if (loan.remaining <= 0) continue;
            const daysSinceStart = dayNumber - loan.startDay;
            if (daysSinceStart > 0 && daysSinceStart % 30 === 0) {
                const payment = loan.monthlyPayment;
                if ((snapshot.cash || 0) >= payment) {
                    loan.remaining = Math.max(0, loan.remaining - (payment - loan.remaining * loan.rate / 12));
                    this.state.totalRepaid += payment;
                    this.state.creditScore = Math.min(850, this.state.creditScore + 2);
                    events.push({ day: dayNumber, category: 'finance', description: `Loan payment: $${payment}. Remaining: $${Math.round(loan.remaining)}.`, sentiment: 'neutral' });
                    // Flag for GameController to deduct cash
                    loan._pendingPayment = payment;
                } else {
                    this.state.missedPayments++;
                    this.state.creditScore = Math.max(300, this.state.creditScore - 15);
                    events.push({ day: dayNumber, category: 'finance', description: `⚠️ Missed loan payment of $${payment}! Credit score -15.`, sentiment: 'negative' });
                    loan._pendingPayment = 0;
                }

                // Loan fully repaid?
                if (loan.remaining <= 0) {
                    this.state.creditScore = Math.min(850, this.state.creditScore + 10);
                    events.push({ day: dayNumber, category: 'finance', description: `🎉 Loan "${loan.name}" fully repaid! Credit score +10.`, sentiment: 'positive' });
                }
            }
        }

        // Credit score drifts slightly toward 650 over time
        this.state.creditScore += (650 - this.state.creditScore) * 0.001;

        return { events };
    }

    /**
     * Take out a new loan.
     * @returns loan object or null
     */
    takeLoan(type, dayNumber) {
        const catalog = this.getLoanCatalog();
        const template = catalog.find(l => l.type === type);
        if (!template) return null;

        // Credit check — worse score = worse rate
        const rateMultiplier = this.state.creditScore >= 750 ? 0.8 : this.state.creditScore >= 650 ? 1.0 : 1.3;
        const rate = template.baseRate * rateMultiplier;
        const monthlyPayment = Math.round(template.amount * (rate / 12 + 1 / template.termMonths));

        const loan = {
            id: `${type}_${dayNumber}`,
            name: template.name,
            type,
            principal: template.amount,
            remaining: template.amount,
            rate,
            monthlyPayment,
            startDay: dayNumber,
            termDays: template.termMonths * 30,
            _pendingPayment: 0
        };

        this.state.loans.push(loan);
        this.state.totalBorrowed += template.amount;
        return loan;
    }

    getLoanCatalog() {
        const scoreLabel = this.state.creditScore >= 750 ? '(Excellent rate)' : this.state.creditScore >= 650 ? '(Standard rate)' : '(High rate - poor credit)';
        return [
            { type: 'micro',      name: '💵 Micro Loan',       amount: 2000,  baseRate: 0.08, termMonths: 6,  desc: `Small quick loan. ${scoreLabel}` },
            { type: 'small_biz',  name: '🏦 Small Business',    amount: 10000, baseRate: 0.06, termMonths: 12, desc: `Standard business loan. ${scoreLabel}` },
            { type: 'equipment',  name: '⚙️ Equipment Finance', amount: 25000, baseRate: 0.05, termMonths: 24, desc: `For big equipment purchases. ${scoreLabel}` },
            { type: 'expansion',  name: '🏗️ Expansion Loan',    amount: 50000, baseRate: 0.045,termMonths: 36, desc: `For opening a second location. ${scoreLabel}` },
        ];
    }

    getTotalDebt() {
        return this.state.loans.reduce((sum, l) => sum + Math.max(0, l.remaining), 0);
    }

    save() { return JSON.parse(JSON.stringify(this.state)); }
    load(data) { if (data) this.state = { ...this.state, ...data }; }
}

/* ====================================================================== */
/*  8. MULTI-LOCATION EXPANSION SYSTEM                                     */
/* ====================================================================== */

class ExpansionSystem {
    constructor() {
        this.state = {
            locations: [{ id: 'main', name: 'Your Bakery', status: 'open', openedDay: 1 }],
            milestones: {},          // { milestone_id: true }
            expansionPoints: 0,      // earned through achievements
            totalRevenue: 0,         // lifetime tracked for milestones
        };
    }

    tick(dayNumber, worldState, snapshot) {
        const events = [];

        // Track lifetime revenue
        this.state.totalRevenue += snapshot.revenue || 0;

        // Check milestones
        const milestoneChecks = [
            { id: 'first_1k',     check: () => this.state.totalRevenue >= 1000,   pts: 1, msg: '💰 Milestone: $1,000 lifetime revenue!' },
            { id: 'first_10k',    check: () => this.state.totalRevenue >= 10000,  pts: 2, msg: '💰 Milestone: $10,000 lifetime revenue!' },
            { id: 'first_50k',    check: () => this.state.totalRevenue >= 50000,  pts: 3, msg: '💰 Milestone: $50,000 lifetime revenue!' },
            { id: 'first_100k',   check: () => this.state.totalRevenue >= 100000, pts: 5, msg: '🏆 Milestone: $100,000 lifetime revenue! Expansion unlocked!' },
            { id: 'rep_80',       check: () => (worldState.reputation.score || 0) >= 80, pts: 2, msg: '⭐ Milestone: Excellent reputation reached!' },
            { id: 'day_30',       check: () => dayNumber >= 30,  pts: 1, msg: '📅 Milestone: Survived 30 days!' },
            { id: 'day_100',      check: () => dayNumber >= 100, pts: 3, msg: '📅 Milestone: 100 days in business! Veteran baker.' },
            { id: 'day_365',      check: () => dayNumber >= 365, pts: 5, msg: '🎂 Milestone: One full year! You\'re a fixture in the community.' },
            { id: 'staff_5',      check: () => (snapshot.staff || []).length >= 5, pts: 2, msg: '👥 Milestone: Team of 5!' },
            { id: 'zero_waste',   check: () => worldState._envWastePct !== undefined && worldState._envWastePct < 5, pts: 3, msg: '🌿 Milestone: Near-zero waste!' },
        ];

        for (const m of milestoneChecks) {
            if (!this.state.milestones[m.id] && m.check()) {
                this.state.milestones[m.id] = true;
                this.state.expansionPoints += m.pts;
                events.push({ day: dayNumber, category: 'expansion', description: m.msg, sentiment: 'positive' });
            }
        }

        return { events };
    }

    /**
     * Open a new location (requires expansion points and cash).
     */
    openLocation(name, dayNumber) {
        const cost = this.state.locations.length * 25000; // each new location costs more
        const requiredPoints = this.state.locations.length * 5;
        if (this.state.expansionPoints < requiredPoints) return null;

        const location = {
            id: `loc_${this.state.locations.length}`,
            name: name || `Location #${this.state.locations.length + 1}`,
            status: 'open',
            openedDay: dayNumber,
            cost
        };
        this.state.locations.push(location);
        return location;
    }

    canExpand() {
        const requiredPoints = this.state.locations.length * 5;
        return this.state.expansionPoints >= requiredPoints;
    }

    save() { return JSON.parse(JSON.stringify(this.state)); }
    load(data) { if (data) this.state = { ...this.state, ...data }; }
}

/* ====================================================================== */
/*  Export all subsystem classes                                            */
/* ====================================================================== */

window.HealthSafetySystem   = HealthSafetySystem;
window.CommunityEventSystem = CommunityEventSystem;
window.AdvertisingSystem     = AdvertisingSystem;
window.TechnologySystem      = TechnologySystem;
window.EnvironmentalSystem   = EnvironmentalSystem;
window.GlobalEventSystem     = GlobalEventSystem;
window.LoanDebtSystem        = LoanDebtSystem;
window.ExpansionSystem       = ExpansionSystem;
