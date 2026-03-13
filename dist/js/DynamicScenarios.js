/**
 * DynamicScenarios.js - Realistic Business Challenges
 * Creates dynamic events that force players to adapt and make tough decisions
 */

const DYNAMIC_SCENARIOS = {
    // ==================== SCENARIO DEFINITIONS ====================
    scenarios: {
        supply_shock: {
            id: 'supply_shock',
            name: 'Ingredient Price Spike',
            icon: '📈',
            triggerConditions: {
                minDay: 5,
                random: 0.03 // 3% chance per day
            },
            variations: [
                {
                    item: 'flour',
                    increase: 0.40, // 40% increase
                    duration: 7, // days
                    reason: "Drought in wheat-producing regions has caused flour prices to spike 40%!"
                },
                {
                    item: 'butter',
                    increase: 0.50,
                    duration: 10,
                    reason: "Dairy supply shortage! Butter prices up 50% for the next week and a half."
                },
                {
                    item: 'eggs',
                    increase: 0.60,
                    duration: 5,
                    reason: "Bird flu outbreak causes egg prices to surge 60%!"
                }
            ],
            playerOptions: [
                {
                    id: 'absorb_cost',
                    text: 'Absorb the cost (keep prices same)',
                    effect: 'profitPenalty',
                    lesson: "Absorbing costs protects customer relationships but hurts your margins. Works short-term but not sustainable."
                },
                {
                    id: 'raise_prices',
                    text: 'Raise prices to match',
                    effect: 'customerLoss',
                    lesson: "Passing costs to customers is honest but risks losing price-sensitive buyers. Best to communicate why."
                },
                {
                    id: 'substitute',
                    text: 'Find substitutes or change menu',
                    effect: 'qualityRisk',
                    lesson: "Menu adaptation shows agility. Successful businesses pivot when needed. Just don't sacrifice quality."
                },
                {
                    id: 'stock_up',
                    text: 'Buy extra before price hike (if you saw it coming)',
                    effect: 'cashFlowPressure',
                    lesson: "Smart operators watch commodity markets. Having reserves helps, but ties up cash."
                }
            ],
            educationalContent: {
                term: 'Commodity Risk',
                explanation: "Ingredient prices fluctuate based on weather, disease, fuel costs, and global demand. Smart businesses track these trends and have contingency plans.",
                strategyTip: "Build relationships with multiple suppliers. Never depend on just one source."
            }
        },

        new_competitor: {
            id: 'new_competitor',
            name: 'New Competitor Opens',
            icon: '🏪',
            triggerConditions: {
                minDay: 14,
                random: 0.02
            },
            variations: [
                {
                    type: 'budget',
                    name: "QuickBake Express",
                    description: "A budget chain bakery opens nearby with prices 30% below yours!",
                    effect: { customerLoss: 0.25, duration: 14 }
                },
                {
                    type: 'premium',
                    name: "Artisan & Co.",
                    description: "A trendy artisan bakery opens with Instagram-worthy aesthetics!",
                    effect: { customerLoss: 0.15, loyaltyDrop: 0.20, duration: 21 }
                },
                {
                    type: 'coffee',
                    name: "Java Bites Café",
                    description: "A coffee shop with pastries opens next door!",
                    effect: { morningCustomerLoss: 0.30, duration: 'permanent' }
                }
            ],
            playerOptions: [
                {
                    id: 'differentiate',
                    text: 'Double down on what makes you unique',
                    effect: 'brandStrength',
                    lesson: "Don't compete on their terms. Find your niche and own it completely."
                },
                {
                    id: 'match_prices',
                    text: 'Match their prices',
                    effect: 'marginCrunch',
                    lesson: "Price wars are race to the bottom. Only works if you have lower costs or deeper pockets."
                },
                {
                    id: 'improve_service',
                    text: 'Invest in customer experience',
                    effect: 'loyaltyBoost',
                    lesson: "Service and atmosphere keep customers coming back. Hard for chains to replicate genuine hospitality."
                },
                {
                    id: 'nothing',
                    text: 'Stay the course, focus on your customers',
                    effect: 'neutral',
                    lesson: "Sometimes the best response is no response. Panic moves often backfire. Focus on your strengths."
                }
            ],
            educationalContent: {
                term: 'Competitive Moat',
                explanation: "What makes customers choose you over alternatives? Could be quality, price, location, service, or brand. The stronger your 'moat', the harder for competitors to steal customers.",
                strategyTip: "If a bigger player can easily copy what you do, you don't have a real moat. Find something they CAN'T copy."
            }
        },

        seasonal_slump: {
            id: 'seasonal_slump',
            name: 'Seasonal Slowdown',
            icon: '☀️',
            triggerConditions: {
                seasonal: true,
                months: [6, 7, 8] // Summer months
            },
            description: "Summer vacation hits. Foot traffic drops 40% as families leave town and routines change.",
            duration: 60, // days
            effect: {
                trafficModifier: 0.60
            },
            playerOptions: [
                {
                    id: 'summer_menu',
                    text: 'Launch summer-specific items (cold drinks, light pastries)',
                    effect: 'partialRecovery',
                    lesson: "Adapting to seasons shows awareness. Ice coffee and fruit tarts in summer, warm cocoa in winter."
                },
                {
                    id: 'cut_hours',
                    text: 'Reduce operating hours',
                    effect: 'costSavings',
                    lesson: "Operating costs don't stop when customers do. Cutting hours in slow periods preserves cash."
                },
                {
                    id: 'marketing_push',
                    text: 'Increase marketing to tourists/summer crowd',
                    effect: 'newCustomers',
                    lesson: "When regular customers leave, find new ones. Tourists and visitors have different needs."
                },
                {
                    id: 'prep_for_fall',
                    text: 'Use slow time to prepare and improve',
                    effect: 'readiness',
                    lesson: "Slow periods are for fixing equipment, training staff, testing new recipes, and resting. Prepare for the rush."
                }
            ],
            educationalContent: {
                term: 'Seasonality',
                explanation: "Most businesses have busy and slow periods. Smart owners plan for both: save during peaks, reduce costs during valleys.",
                strategyTip: "Keep 3-6 months operating costs in reserve. Summer slumps should never be a surprise."
            }
        },

        staff_crisis: {
            id: 'staff_crisis',
            name: 'Key Employee Leaves',
            icon: '👋',
            triggerConditions: {
                minDay: 21,
                hasStaff: true,
                random: 0.02
            },
            variations: [
                {
                    reason: 'better_offer',
                    description: "Your best baker got a higher-paying offer across town!",
                    notice: 14 // days notice
                },
                {
                    reason: 'sudden',
                    description: "Your key employee quit suddenly over a disagreement!",
                    notice: 0
                },
                {
                    reason: 'personal',
                    description: "Your reliable staff member has a family emergency and needs to leave.",
                    notice: 3
                }
            ],
            playerOptions: [
                {
                    id: 'counter_offer',
                    text: 'Make a counter-offer to keep them',
                    effect: 'laborCostIncrease',
                    lesson: "Counter-offers work short-term but often the employee leaves anyway within a year. Also sets precedent."
                },
                {
                    id: 'let_go',
                    text: 'Wish them well and start recruiting',
                    effect: 'shortTermChaos',
                    lesson: "Healthy response. Your business shouldn't depend on any single person. Use this to build redundancy."
                },
                {
                    id: 'owner_fills_in',
                    text: 'You personally cover their shifts while hiring',
                    effect: 'ownerBurnout',
                    lesson: "Short-term fix only. Owner burnout kills businesses. Hire faster, even if imperfect."
                },
                {
                    id: 'temp_worker',
                    text: 'Hire a temporary worker immediately',
                    effect: 'qualityRisk',
                    lesson: "Maintains operations but untrained workers can hurt quality and service. Close supervision needed."
                }
            ],
            educationalContent: {
                term: 'Key Person Risk',
                explanation: "If one person leaving cripples your business, that's a critical vulnerability. Document processes, cross-train staff, and never let one person hold all the knowledge.",
                strategyTip: "Always be casually recruiting, even when fully staffed. Meeting good people keeps your pipeline full."
            }
        },

        viral_success: {
            id: 'viral_success',
            name: 'Unexpected Viral Moment',
            icon: '🌟',
            triggerConditions: {
                minDay: 10,
                random: 0.01 // Rare but impactful
            },
            variations: [
                {
                    source: 'influencer',
                    description: "A local food blogger with 50K followers just raved about your croissants! Expect crowds!",
                    effect: { demandMultiplier: 3.0, duration: 7 }
                },
                {
                    source: 'news',
                    description: "Local news featured your bakery! 'Hidden Gem in our neighborhood'",
                    effect: { demandMultiplier: 2.0, duration: 14 }
                },
                {
                    source: 'tiktok',
                    description: "Someone's video of your pastries went viral! 2 million views!",
                    effect: { demandMultiplier: 5.0, duration: 5 }
                }
            ],
            playerOptions: [
                {
                    id: 'scale_up',
                    text: 'Hire temps and bake overtime to meet demand',
                    effect: 'capitalDrain',
                    lesson: "Scaling fast costs money upfront. Make sure the demand lasts before over-investing."
                },
                {
                    id: 'limit_sales',
                    text: 'Sell out early, maintain quality',
                    effect: 'brandProtection',
                    lesson: "'Sold Out' can actually build brand desirability. Better than disappointing with poor quality."
                },
                {
                    id: 'raise_prices',
                    text: 'Raise prices temporarily (demand pricing)',
                    effect: 'profitBoost',
                    lesson: "Economics says high demand = higher prices. But can feel like 'gouging' and hurt reputation."
                },
                {
                    id: 'collect_contacts',
                    text: 'Focus on capturing customer info for future',
                    effect: 'listBuilding',
                    lesson: "The viral moment is temporary. Email lists and social followers are permanent. Convert buzz to relationships."
                }
            ],
            educationalContent: {
                term: 'Scalability',
                explanation: "Can your business handle sudden success? Most small businesses can't scale overnight. Growth can actually kill companies that can't fulfill orders or maintain quality.",
                strategyTip: "Plan for success, not just survival. Have a written plan for 'what if demand doubles tomorrow?'"
            }
        },

        equipment_failure: {
            id: 'equipment_failure',
            name: 'Equipment Breakdown',
            icon: '🔧',
            triggerConditions: {
                minDay: 7,
                random: 0.025 // Based on equipment condition
            },
            variations: [
                {
                    equipment: 'oven',
                    description: "Your main oven just died! Repair cost: $800. New replacement: $3,500. Repair time: 3 days.",
                    productionLoss: 0.70
                },
                {
                    equipment: 'mixer',
                    description: "The stand mixer's motor burned out! Repair: $300. Replacement: $1,200.",
                    productionLoss: 0.30
                },
                {
                    equipment: 'refrigerator',
                    description: "The walk-in cooler stopped working overnight. $500 in spoiled ingredients + $600 repair.",
                    inventoryLoss: 500,
                    productionLoss: 0.50
                }
            ],
            playerOptions: [
                {
                    id: 'repair',
                    text: 'Repair it (cheaper but fix might not last)',
                    effect: 'cheapFix',
                    lesson: "Repairs are bandaids. Track how often you're repairing - sometimes replacement is actually cheaper long-term."
                },
                {
                    id: 'replace',
                    text: 'Buy new equipment (expensive but reliable)',
                    effect: 'capitalExpense',
                    lesson: "New equipment is an investment. Calculate: if repair costs 50% of replacement, often smarter to replace."
                },
                {
                    id: 'used',
                    text: 'Buy used equipment fast',
                    effect: 'quickFix',
                    lesson: "Used equipment gets you running faster and cheaper. But inspect carefully - you might inherit problems."
                },
                {
                    id: 'hustle',
                    text: 'Find workarounds, use a friend\'s kitchen',
                    effect: 'survival',
                    lesson: "Resourcefulness matters in crisis. But unsustainable long-term. Use this time to arrange permanent solution."
                }
            ],
            educationalContent: {
                term: 'Capital Expenditure (CapEx)',
                explanation: "Big purchases like equipment that provide value over years. Unlike regular expenses, these are investments. Budget for replacements before they break.",
                strategyTip: "Set aside 2-5% of revenue monthly for equipment replacement. When something breaks, you have funds ready."
            }
        },

        regulation_change: {
            id: 'regulation_change',
            name: 'New Regulations',
            icon: '📋',
            triggerConditions: {
                minDay: 30,
                random: 0.015
            },
            variations: [
                {
                    type: 'health',
                    description: "New health codes require additional food safety equipment. Cost: $2,000. Deadline: 30 days.",
                    cost: 2000,
                    deadline: 30
                },
                {
                    type: 'labor',
                    description: "Minimum wage is increasing 15% next month!",
                    laborCostIncrease: 0.15
                },
                {
                    type: 'environmental',
                    description: "New packaging regulations ban your current containers. Must switch to compostables (+$0.15 per item).",
                    packagingCostIncrease: 0.15
                }
            ],
            playerOptions: [
                {
                    id: 'comply_early',
                    text: 'Comply immediately, get ahead of deadline',
                    effect: 'compliance',
                    lesson: "Early compliance avoids stress. Sometimes early adopters get recognition or avoid rush pricing."
                },
                {
                    id: 'delay',
                    text: 'Wait until last minute',
                    effect: 'riskDelay',
                    lesson: "Saves cash short-term but creates crunch later. Fines for non-compliance can exceed compliance costs."
                },
                {
                    id: 'adjust_business',
                    text: 'Change business model to minimize impact',
                    effect: 'adaptation',
                    lesson: "The best entrepreneurs see regulations as forcing functions for improvement. How can this make you better?"
                }
            ],
            educationalContent: {
                term: 'Regulatory Risk',
                explanation: "Laws and regulations change. Businesses must adapt or face fines, shutdowns, or lawsuits. Stay informed about upcoming changes in your industry.",
                strategyTip: "Join your local business association. They track regulatory changes and often provide compliance help."
            }
        },

        economic_downturn: {
            id: 'economic_downturn',
            name: 'Economic Recession',
            icon: '📉',
            triggerConditions: {
                minDay: 45,
                random: 0.01 // Rare, major event
            },
            description: "The economy is entering a recession. Consumer spending is dropping across the board.",
            duration: 90, // days
            effect: {
                demandModifier: 0.70,
                pricesSensitivity: 1.4
            },
            playerOptions: [
                {
                    id: 'value_menu',
                    text: 'Create a budget-friendly value menu',
                    effect: 'volumeFocus',
                    lesson: "When customers have less money, give them options. Some revenue beats no revenue."
                },
                {
                    id: 'cut_costs',
                    text: 'Cut costs aggressively (staff, hours, overhead)',
                    effect: 'survival',
                    lesson: "Surviving recessions means ruthless cost control. But cut carefully - don't destroy what makes you special."
                },
                {
                    id: 'hold_premium',
                    text: 'Maintain premium positioning',
                    effect: 'brandProtection',
                    lesson: "Wealthy customers still spend in recessions. The premium segment actually concentrates. But risky if you're not truly premium."
                },
                {
                    id: 'diversify',
                    text: 'Add catering, wholesale, or new channels',
                    effect: 'revenueStreams',
                    lesson: "Multiple revenue streams reduce dependence on any single customer type. Recessions reveal over-concentration."
                }
            ],
            educationalContent: {
                term: 'Economic Cycle',
                explanation: "Economies go through expansion and contraction. Recessions happen every 5-10 years on average. Businesses that survive have cash reserves, cost flexibility, and multiple revenue streams.",
                strategyTip: "Build your business like a recession is coming next year. Those who prepare survive. Those who don't..."
            }
        }
    },

    // ==================== SCENARIO SYSTEM METHODS ====================

    /**
     * Check for random scenario triggers
     * @param {Object} gameState - Current game state
     * @returns {Object|null} - Triggered scenario or null
     */
    checkScenarioTriggers(gameState) {
        const { day, staff, season, month } = gameState;
        const eligibleScenarios = [];

        for (const [key, scenario] of Object.entries(this.scenarios)) {
            const conditions = scenario.triggerConditions;

            // Check minimum day
            if (conditions.minDay && day < conditions.minDay) continue;

            // Check staff requirement
            if (conditions.hasStaff && (!staff || staff.length === 0)) continue;

            // Check seasonal
            if (conditions.seasonal && conditions.months) {
                if (!conditions.months.includes(month)) continue;
            }

            // Random chance
            if (conditions.random && Math.random() < conditions.random) {
                eligibleScenarios.push(scenario);
            }
        }

        // Return one random triggered scenario
        if (eligibleScenarios.length > 0) {
            const selected = eligibleScenarios[Math.floor(Math.random() * eligibleScenarios.length)];
            // Pick a random variation if exists
            if (selected.variations && selected.variations.length > 0) {
                selected.activeVariation = selected.variations[Math.floor(Math.random() * selected.variations.length)];
            }
            return selected;
        }
        return null;
    },

    /**
     * Get scenario by ID
     */
    getScenario(scenarioId) {
        return this.scenarios[scenarioId] || null;
    },

    /**
     * Format scenario for display
     */
    formatScenarioAlert(scenario) {
        const variation = scenario.activeVariation || scenario;
        return {
            title: scenario.name,
            icon: scenario.icon,
            message: variation.description || variation.reason || scenario.description,
            options: scenario.playerOptions,
            education: scenario.educationalContent
        };
    }
};

// Make globally available
if (typeof window !== 'undefined') {
    window.DYNAMIC_SCENARIOS = DYNAMIC_SCENARIOS;
}
