/**
 * CompetitorSimulation.js — Persistent AI bakeries that compete for customers.
 *
 * Registered as a WorldSimulation subsystem ('competitors').
 * Competitors adjust prices, run promotions, and can open/close over time.
 * Player learns about market positioning, competitive analysis, and pricing.
 */

class CompetitorSimulation {
    constructor() {
        this.competitors = [];
        this.nextId = 1;

        // Archetype templates
        this.archetypes = {
            budget_chain: {
                name: 'Sweet Deals Bakery',
                icon: '🏪',
                strategy: 'volume',
                priceMultiplier: 0.8,          // 20 % cheaper than player
                qualityMultiplier: 0.7,
                marketPower: 0.15,
                strength: 0.35,
                marketingBudget: 'high',
                description: 'Budget chain — low prices, acceptable quality.'
            },
            artisan_boutique: {
                name: 'La Petite Boulangerie',
                icon: '🥐',
                strategy: 'premium',
                priceMultiplier: 1.25,
                qualityMultiplier: 1.2,
                marketPower: 0.1,
                strength: 0.3,
                marketingBudget: 'medium',
                description: 'Artisan boutique — premium pricing, top quality.'
            },
            cafe_hybrid: {
                name: 'Rise & Grind Café',
                icon: '☕',
                strategy: 'hybrid',
                priceMultiplier: 1.05,
                qualityMultiplier: 0.95,
                marketPower: 0.12,
                strength: 0.25,
                marketingBudget: 'medium',
                description: 'Café + bakery hybrid — coffee focus with pastries.'
            },
            home_baker: {
                name: "Grandma's Kitchen",
                icon: '🏡',
                strategy: 'niche',
                priceMultiplier: 0.9,
                qualityMultiplier: 1.1,
                marketPower: 0.05,
                strength: 0.15,
                marketingBudget: 'low',
                description: 'Home baker selling at farmer\'s markets — niche but loyal fans.'
            }
        };

        // Pool of names per archetype for variety
        this.namePool = {
            budget_chain: ['Sweet Deals Bakery', 'Flour Power Outlet', 'Dollar Dough', 'BakeMore'],
            artisan_boutique: ['La Petite Boulangerie', 'The Flour Studio', 'Artisanal Crumbs', 'Craft & Crust'],
            cafe_hybrid: ['Rise & Grind Café', 'Brew & Bake', 'The Morning Blend', 'Coffee & Crumble'],
            home_baker: ["Grandma's Kitchen", 'Cottage Confections', 'Sunday Baker', 'Homemade Hearts']
        };

        console.log('🏪 CompetitorSimulation initialised');
    }

    /* ------------------------------------------------------------------ */
    /*  Subsystem interface                                                */
    /* ------------------------------------------------------------------ */

    tick(dayNumber, worldState, snapshot) {
        const events = [];

        // Possibly introduce a new competitor (low chance, min day 5)
        if (dayNumber >= 5 && this.competitors.length < 3 && Math.random() < 0.018) {
            const newComp = this._openCompetitor(dayNumber);
            events.push({
                day: dayNumber,
                category: 'competition',
                description: `${newComp.icon} ${newComp.name} just opened nearby! ${newComp.description}`,
                sentiment: 'negative'
            });
        }

        // Tick each competitor
        this.competitors.forEach(comp => {
            // Age the competitor
            comp.daysActive = dayNumber - comp.openedDay;

            // Maybe run a promotion (5% daily chance)
            if (!comp.promotion && Math.random() < 0.05) {
                comp.promotion = {
                    type: this._randomPromotion(),
                    daysRemaining: 2 + Math.floor(Math.random() * 4),
                    discount: 0.1 + Math.random() * 0.2
                };
                events.push({
                    day: dayNumber,
                    category: 'competition',
                    description: `${comp.icon} ${comp.name} is running a ${comp.promotion.type}!`,
                    sentiment: 'warning'
                });
            }

            // Tick promotion
            if (comp.promotion) {
                comp.promotion.daysRemaining--;
                if (comp.promotion.daysRemaining <= 0) {
                    comp.promotion = null;
                }
            }

            // Adjust pricing based on market (slow drift)
            if (Math.random() < 0.1) {
                const drift = (Math.random() - 0.5) * 0.04;
                comp.currentPriceMultiplier = Math.max(0.6, Math.min(1.5,
                    comp.currentPriceMultiplier + drift
                ));
            }

            // Small chance of closing (very low if healthy, higher if old)
            if (comp.daysActive > 60 && Math.random() < 0.005) {
                comp.isClosing = true;
                events.push({
                    day: dayNumber,
                    category: 'competition',
                    description: `${comp.icon} ${comp.name} is closing down! Opportunity for more customers.`,
                    sentiment: 'positive'
                });
            }
        });

        // Remove closed competitors
        this.competitors = this.competitors.filter(c => !c.isClosing);

        // Update world state
        worldState.competitors = this.competitors.map(c => ({
            id: c.id,
            name: c.name,
            icon: c.icon,
            archetype: c.archetype,
            priceLevel: c.currentPriceMultiplier,
            quality: c.qualityMultiplier,
            marketPower: c.promotion ? c.marketPower * 1.3 : c.marketPower,
            strength: c.strength,
            hasPromotion: !!c.promotion,
            promotionType: c.promotion?.type || null
        }));

        return { events };
    }

    save() {
        return {
            competitors: JSON.parse(JSON.stringify(this.competitors)),
            nextId: this.nextId
        };
    }

    load(data) {
        if (!data) return;
        if (data.competitors) this.competitors = data.competitors;
        if (data.nextId) this.nextId = data.nextId;
    }

    /* ------------------------------------------------------------------ */
    /*  Internal helpers                                                    */
    /* ------------------------------------------------------------------ */

    _openCompetitor(dayNumber) {
        const archetypeKeys = Object.keys(this.archetypes);
        // Avoid duplicates of existing archetypes if possible
        const existing = new Set(this.competitors.map(c => c.archetype));
        let key = archetypeKeys.find(k => !existing.has(k));
        if (!key) key = archetypeKeys[Math.floor(Math.random() * archetypeKeys.length)];

        const template = this.archetypes[key];
        const names = this.namePool[key] || [template.name];
        const name = names[Math.floor(Math.random() * names.length)];

        const comp = {
            id: `comp_${this.nextId++}`,
            archetype: key,
            name,
            icon: template.icon,
            strategy: template.strategy,
            priceMultiplier: template.priceMultiplier,
            currentPriceMultiplier: template.priceMultiplier,
            qualityMultiplier: template.qualityMultiplier,
            marketPower: template.marketPower,
            strength: template.strength,
            description: template.description,
            openedDay: dayNumber,
            daysActive: 0,
            promotion: null,
            isClosing: false
        };

        this.competitors.push(comp);
        return comp;
    }

    _randomPromotion() {
        const types = [
            '🎉 Grand Sale — 20% off everything',
            '🧁 Buy 2 Get 1 Free deal',
            '☕ Free coffee with any pastry',
            '📱 Social media flash sale',
            '🎂 Birthday month special',
            '🌅 Early bird discount'
        ];
        return types[Math.floor(Math.random() * types.length)];
    }

    /* ------------------------------------------------------------------ */
    /*  Public query helpers                                                */
    /* ------------------------------------------------------------------ */

    getCompetitorCount() {
        return this.competitors.length;
    }

    getAveragePriceLevel() {
        if (this.competitors.length === 0) return 1.0;
        return this.competitors.reduce((s, c) => s + c.currentPriceMultiplier, 0) / this.competitors.length;
    }

    getMarketIntel() {
        return this.competitors.map(c => ({
            name: `${c.icon} ${c.name}`,
            priceLevel: c.currentPriceMultiplier < 0.9 ? 'Budget' :
                        c.currentPriceMultiplier > 1.1 ? 'Premium' : 'Market rate',
            promotion: c.promotion ? c.promotion.type : 'None',
            threat: c.marketPower > 0.12 ? '⚠️ High' : c.marketPower > 0.08 ? '⚡ Medium' : '✅ Low'
        }));
    }
}

window.CompetitorSimulation = CompetitorSimulation;
