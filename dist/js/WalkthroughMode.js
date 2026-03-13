/**
 * WalkthroughMode.js - Autonomous Demo Player System
 * An AI-guided playthrough that demonstrates optimal decisions with explanations
 */

class WalkthroughMode {
    constructor(gameController) {
        this.gc = gameController;
        this.isActive = false;
        this.isPaused = false;
        this.currentStep = 0;
        this.playbackSpeed = 1.0; // 1x, 2x, 0.5x speed
        this.decisionLog = [];

        // The autonomous player's "personality" and decision-making framework
        this.playerProfile = {
            name: "Alex",
            avatar: "👨‍🍳",
            style: "balanced", // conservative, aggressive, balanced
            experience: "expert",
            goals: ["profitability", "sustainability", "growth"]
        };

        // Walkthrough script with pre-planned decisions and explanations
        this.walkthrough = this.generateWalkthrough();
    }

    /**
     * Generate the full walkthrough script based on game scenarios
     */
    generateWalkthrough() {
        return {
            introduction: {
                title: "Meet Alex - Your Virtual Business Mentor",
                dialogue: [
                    "Hey! I'm Alex, and I've run bakeries for 10 years. Watch how I make decisions - I'll explain my thinking every step of the way.",
                    "Remember: In real business, there's rarely one 'right' answer. I'll show you WHY I choose what I choose, but your situation might call for different choices.",
                    "Let's build a bakery together! Feel free to pause anytime and ask 'why?'"
                ]
            },

            phases: {
                // ==================== SETUP PHASE ====================
                setup: {
                    location: {
                        decision: 'downtown_side',
                        reasoning: [
                            "I'm choosing Downtown Side Street over Prime location. Here's why:",
                            "💰 RENT: $280/month vs $450. That's $2,040 saved per year!",
                            "📊 TRAFFIC: 40% less foot traffic, but my costs are 38% lower. The math works.",
                            "🎯 STRATEGY: I can survive mistakes at lower rent. Prime location = higher pressure.",
                            "⚠️ RISK CHECK: If sales are slow for 2 months, can I survive? At $280 rent, yes. At $450? Much harder."
                        ],
                        alternativeNote: "Prime location could work if you have: ($15K+ savings, proven recipes, existing customers)"
                    },
                    equipment: {
                        decisions: {
                            oven: 'deck_oven',
                            mixer: 'kitchenaid',
                            display: 'glass_case'
                        },
                        reasoning: [
                            "EQUIPMENT PHILOSOPHY: Buy quality once, cry once. Buy cheap, cry forever.",
                            "🌋 OVEN: Deck oven ($4,200) not home oven ($800). Why?",
                            "   - Commercial ovens last 10-15 years vs 3-5 for residential",
                            "   - Better temperature = better products = more sales",
                            "   - Cost per year: $4,200÷12 years = $350/year vs $800÷4 = $200/year",
                            "   - But quality difference = 20% more sales. Worth it!",
                            "🔄 MIXER: Mid-range. Don't need industrial yet, but hand-mixing won't scale.",
                            "🪟 DISPLAY: Glass case to showcase products. Presentation sells!"
                        ],
                        alternativeNote: "Starting smaller is valid if: (Very tight budget, testing market, planning to upgrade soon)"
                    },
                    staff: {
                        decision: 'solo',
                        reasoning: [
                            "Starting SOLO - no employees yet. Here's the math:",
                            "💼 PART-TIME HELP: $1,200/month = $14,400/year",
                            "📈 At 30% profit margin, I need $48,000 extra sales to afford that hire",
                            "⏰ I'll work hard for 3-6 months, prove the concept, then hire",
                            "🚨 KEY METRIC: When I'm turning away customers or burning out, THEN hire",
                            "This is the 'sweat equity' phase - I'm trading my time for lower risk"
                        ],
                        alternativeNote: "Hire immediately if: (You have capital, you can't bake, location demands volume you can't do alone)"
                    }
                },

                // ==================== BUYING PHASE ====================
                buying: {
                    vendorSelection: {
                        decision: 'mixed_vendors',
                        reasoning: [
                            "I use MULTIPLE VENDORS - not just cheapest price. Here's why:",
                            "🏪 RESTAURANT DEPOT: Bulk staples (flour, sugar). Best prices on basics.",
                            "🌾 LOCAL MILL: Premium flour for specialty items. Customers taste the difference.",
                            "🥛 LOCAL DAIRY: Fresher, supports community, marketing angle.",
                            "📦 BACKUP VENDOR: Always have a Plan B. Single-source dependence is dangerous."
                        ],
                        termExplanation: {
                            term: "Supplier Diversification",
                            meaning: "Don't put all eggs in one basket. If one supplier fails, has price hikes, or quality drops, you need alternatives."
                        }
                    },
                    inventoryStrategy: {
                        decision: 'moderate_stock',
                        reasoning: [
                            "INVENTORY PHILOSOPHY: Not too much, not too little.",
                            "📊 THE MATH: I calculate 3-day supply for perishables, 2-week for dry goods",
                            "💸 CASH FLOW: Every dollar in inventory is a dollar NOT earning interest",
                            "📉 SPOILAGE: Food waste is burning money. Target < 5% waste.",
                            "📈 STOCK-OUTS: Running out loses sales and trust. Balance is key.",
                            "🔄 FIFO: First In, First Out. Use oldest stock first. Always."
                        ],
                        termExplanation: {
                            term: "Inventory Turnover",
                            meaning: "How fast you sell through stock. Higher = better. Bakeries should turn perishables daily, dry goods weekly."
                        }
                    }
                },

                // ==================== BAKING PHASE ====================
                baking: {
                    productMix: {
                        decision: 'strategic_variety',
                        reasoning: [
                            "MENU STRATEGY: The 'hits' + profitable + signature",
                            "⭐ HITS (60%): Croissants, muffins - reliable sellers, make these PERFECT",
                            "💰 PROFITABLE (25%): Coffee (huge margin), simple cookies",
                            "🎯 SIGNATURE (15%): One unique item no one else has. My 'famous' thing.",
                            "❌ AVOID: Too much variety = waste + complexity + quality drops"
                        ],
                        termExplanation: {
                            term: "Product Mix",
                            meaning: "The combination of products you sell. Balance between crowd-pleasers, money-makers, and brand-builders."
                        }
                    },
                    production: {
                        decision: 'demand_based',
                        reasoning: [
                            "I bake based on DATA, not hopes:",
                            "📊 Track every sale. Know EXACTLY what sells when.",
                            "☀️ Monday morning ≠ Saturday morning. Adjust production by day.",
                            "🌧️ Weather affects traffic. Rainy day? Bake less.",
                            "📈 Start conservative. Grow based on actual demand, not optimism.",
                            "🗑️ Waste is visible failure. If throwing away product daily, bake less."
                        ]
                    }
                },

                // ==================== SELLING PHASE ====================
                selling: {
                    pricing: {
                        decision: 'value_based',
                        reasoning: [
                            "PRICING: Not cost-plus, but VALUE-BASED",
                            "❌ WRONG: Cost $1.50 + 50% markup = $2.25 price",
                            "✅ RIGHT: Customer pays $4 at competitor. I can charge $3.75 for better quality.",
                            "💎 My price = what value do I provide, not what it costs me",
                            "📊 Calculate: ingredient cost should be 25-35% of selling price",
                            "🧠 Psychological: $3.95 feels cheaper than $4.00. Use it."
                        ],
                        termExplanation: {
                            term: "Value-Based Pricing",
                            meaning: "Price based on perceived value to customer, not your costs. A glass of water is $0 at home, $3 at a restaurant, $6 at a concert."
                        }
                    },
                    customerService: {
                        decision: 'memorable_experience',
                        reasoning: [
                            "SERVICE = your competitive moat. Chains can't replicate genuine connection.",
                            "😊 Remember names. 'Hi Sarah!' beats 'Next!'",
                            "🎁 Occasional free sample builds loyalty worth thousands",
                            "📱 Collect emails. Your list = your asset. Social platforms own theirs.",
                            "⭐ Ask for reviews. 90% of happy customers need prompting.",
                            "🛠️ Handle complaints = convert critics to advocates"
                        ]
                    }
                },

                // ==================== END OF DAY ====================
                endOfDay: {
                    review: {
                        decision: 'daily_numbers',
                        reasoning: [
                            "EVERY DAY I check these numbers:",
                            "💰 Revenue: What came in?",
                            "📉 Costs: What went out?",
                            "📊 Margin: Revenue - Costs = Did I make money?",
                            "🗑️ Waste: What got thrown away? WHY?",
                            "👥 Customer Count: How many transactions?",
                            "🧮 Average Ticket: Revenue ÷ Customers",
                            "The goal: KNOW YOUR NUMBERS. Ignorance kills businesses."
                        ],
                        termExplanation: {
                            term: "KPIs (Key Performance Indicators)",
                            meaning: "The vital few metrics that tell you if your business is healthy. Track these religiously."
                        }
                    }
                }
            },

            // ==================== SCENARIO RESPONSES ====================
            scenarioResponses: {
                supply_shock: {
                    choice: 'substitute',
                    reasoning: [
                        "Ingredient prices spiked 40%. My response: ADAPT, don't panic.",
                        "🔄 I'm temporarily adjusting the menu to use alternatives",
                        "📢 I'm transparent with customers: 'Due to market conditions...'",
                        "💰 I'm NOT absorbing the full hit - that's unsustainable",
                        "📊 Long-term: I'll lock in contracts with suppliers for price stability"
                    ]
                },
                new_competitor: {
                    choice: 'differentiate',
                    reasoning: [
                        "New bakery opened nearby. I'm NOT lowering prices. Here's why:",
                        "🎯 Price wars = everyone loses except customers",
                        "⭐ Instead: Double down on what makes me UNIQUE",
                        "💬 Increase personal service - something chains can't do",
                        "📱 Engage community - I'm local, they're not",
                        "Competing on lowest price is a race to bankruptcy."
                    ]
                },
                equipment_failure: {
                    choice: 'replace',
                    reasoning: [
                        "Oven broke. Expensive but I'm buying NEW, not repairing. Why?",
                        "🔧 This oven was already 8 years old - repairs won't last",
                        "💸 Repair: $800. New: $4,500. But new lasts 12 years.",
                        "📊 Cost per day: Repair $0.73 (3 year life) vs New $1.03 (12 year life)",
                        "⚡ New oven is more energy efficient - saves $50/month",
                        "📈 Better oven = better products = more revenue",
                        "This is called 'Capital Expenditure Thinking' - invest for the long term."
                    ]
                },
                viral_success: {
                    choice: 'limit_sales',
                    reasoning: [
                        "We went viral! Demand 3x capacity. My counterintuitive choice: LIMIT.",
                        "🔥 Tempting: scale up, hire temps, run overtime",
                        "⚠️ Reality: Quality drops when you rush. One bad experience = bad reviews.",
                        "✅ My choice: Sell out early, maintain quality, create scarcity",
                        "'Sorry, sold out' creates DESIRABILITY. It's a feature, not a bug.",
                        "📧 Key move: Capture everyone's email for when we CAN serve them"
                    ]
                }
            }
        };
    }

    /**
     * Start the walkthrough mode
     */
    start() {
        this.isActive = true;
        this.isPaused = false;
        this.currentStep = 0;
        this.decisionLog = [];

        // Show the introduction
        this.showWalkthroughUI();
        this.playIntroduction();
    }

    /**
     * Show walkthrough control panel
     */
    showWalkthroughUI() {
        // Remove existing if any
        const existing = document.getElementById('walkthrough-panel');
        if (existing) existing.remove();

        const panel = document.createElement('div');
        panel.id = 'walkthrough-panel';
        panel.innerHTML = `
            <div class="wt-header">
                <span class="wt-avatar">${this.playerProfile.avatar}</span>
                <span class="wt-name">${this.playerProfile.name}</span>
                <span class="wt-badge">Expert Player</span>
            </div>
            <div class="wt-controls">
                <button id="wt-pause" title="Pause">⏸️</button>
                <button id="wt-play" title="Play">▶️</button>
                <button id="wt-speed" title="Speed">1x</button>
                <button id="wt-skip" title="Skip to end">⏭️</button>
                <button id="wt-exit" title="Exit & Take Control">🎮</button>
            </div>
            <div class="wt-dialogue" id="wt-dialogue"></div>
            <div class="wt-decision" id="wt-decision"></div>
        `;
        document.body.appendChild(panel);

        // Add event listeners
        document.getElementById('wt-pause').onclick = () => this.pause();
        document.getElementById('wt-play').onclick = () => this.resume();
        document.getElementById('wt-speed').onclick = () => this.cycleSpeed();
        document.getElementById('wt-skip').onclick = () => this.skip();
        document.getElementById('wt-exit').onclick = () => this.exitAndTakeControl();
    }

    /**
     * Play the introduction sequence
     */
    playIntroduction() {
        const intro = this.walkthrough.introduction;
        const dialogueBox = document.getElementById('wt-dialogue');

        let index = 0;
        const showNext = () => {
            if (index < intro.dialogue.length && this.isActive) {
                dialogueBox.innerHTML = `<p>"${intro.dialogue[index]}"</p>`;
                index++;
                setTimeout(showNext, 4000 / this.playbackSpeed);
            } else if (this.isActive) {
                this.proceedToGameplay();
            }
        };
        showNext();
    }

    /**
     * Show a decision with explanation
     */
    showDecision(phase, decisionKey) {
        const phaseData = this.walkthrough.phases[phase];
        if (!phaseData || !phaseData[decisionKey]) return;

        const decision = phaseData[decisionKey];
        const decisionBox = document.getElementById('wt-decision');
        const dialogueBox = document.getElementById('wt-dialogue');

        // Show decision
        decisionBox.innerHTML = `
            <div class="wt-decision-header">
                <strong>Alex's Decision:</strong> ${decision.decision}
            </div>
        `;

        // Type out reasoning
        let reasoningIndex = 0;
        const showReasoning = () => {
            if (reasoningIndex < decision.reasoning.length && this.isActive && !this.isPaused) {
                dialogueBox.innerHTML = `<p>${decision.reasoning[reasoningIndex]}</p>`;
                reasoningIndex++;
                setTimeout(showReasoning, 3000 / this.playbackSpeed);
            } else if (decision.termExplanation) {
                this.showTermExplanation(decision.termExplanation);
            }
        };
        showReasoning();
    }

    /**
     * Show a term explanation popup
     */
    showTermExplanation(term) {
        const popup = document.createElement('div');
        popup.className = 'wt-term-popup';
        popup.innerHTML = `
            <div class="wt-term-header">📚 Financial Term</div>
            <div class="wt-term-name">${term.term}</div>
            <div class="wt-term-meaning">${term.meaning}</div>
            <button onclick="this.parentElement.remove()">Got it!</button>
        `;
        document.body.appendChild(popup);

        // Auto-remove after delay
        setTimeout(() => {
            if (popup.parentElement) popup.remove();
        }, 8000 / this.playbackSpeed);
    }

    /**
     * Respond to a scenario event
     */
    respondToScenario(scenarioId) {
        const response = this.walkthrough.scenarioResponses[scenarioId];
        if (!response) return null;

        // Log the decision
        this.decisionLog.push({
            type: 'scenario',
            scenario: scenarioId,
            choice: response.choice,
            reasoning: response.reasoning
        });

        // Show the explanation
        const dialogueBox = document.getElementById('wt-dialogue');
        let index = 0;
        const showNext = () => {
            if (index < response.reasoning.length && this.isActive) {
                dialogueBox.innerHTML = `<p>${response.reasoning[index]}</p>`;
                index++;
                setTimeout(showNext, 3000 / this.playbackSpeed);
            }
        };
        showNext();

        return response.choice;
    }

    /**
     * Control methods
     */
    pause() {
        this.isPaused = true;
        document.getElementById('wt-pause').style.opacity = '0.5';
        document.getElementById('wt-play').style.opacity = '1';
    }

    resume() {
        this.isPaused = false;
        document.getElementById('wt-pause').style.opacity = '1';
        document.getElementById('wt-play').style.opacity = '0.5';
    }

    cycleSpeed() {
        const speeds = [0.5, 1, 2];
        const current = speeds.indexOf(this.playbackSpeed);
        this.playbackSpeed = speeds[(current + 1) % speeds.length];
        document.getElementById('wt-speed').textContent = `${this.playbackSpeed}x`;
    }

    skip() {
        // Skip to end of current phase
        this.currentStep = 999;
        if (this.gc && typeof this.gc.advancePhase === 'function') {
            this.gc.advancePhase();
        }
    }

    exitAndTakeControl() {
        this.stop();
        const panel = document.getElementById('walkthrough-panel');
        if (panel) panel.remove();

        // Show message
        if (typeof this.gc.showNotification === 'function') {
            this.gc.showNotification("You're now in control! Alex is watching...", 'info');
        }
    }

    proceedToGameplay() {
        // Hook into game controller to start actual gameplay
        if (this.gc && typeof this.gc.startNewGame === 'function') {
            this.gc.startNewGame();
        }
    }

    stop() {
        this.isActive = false;
        this.isPaused = false;
    }

    /**
     * Get current decision for AI to make in the game
     */
    getAutonomousDecision(phase, decisionType, options) {
        const phaseData = this.walkthrough.phases[phase];
        if (!phaseData) return options[0]; // Default to first option

        const decision = phaseData[decisionType];
        if (!decision) return options[0];

        // Return the predetermined optimal decision
        return decision.decision || decision.decisions;
    }
}

// CSS for walkthrough panel (will be injected)
const walkthroughStyles = `
<style id="walkthrough-styles">
    #walkthrough-panel {
        position: fixed;
        top: 80px;
        left: 20px;
        width: 350px;
        background: linear-gradient(145deg, rgba(17, 24, 39, 0.98), rgba(31, 41, 55, 0.95));
        border: 2px solid #fbbf24;
        border-radius: 16px;
        padding: 16px;
        z-index: 9999;
        font-family: 'Inter', sans-serif;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(10px);
    }

    .wt-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid rgba(255,255,255,0.1);
    }

    .wt-avatar {
        font-size: 32px;
    }

    .wt-name {
        font-weight: 700;
        font-size: 18px;
        color: white;
    }

    .wt-badge {
        background: linear-gradient(135deg, #fbbf24, #f59e0b);
        color: #1f2937;
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 11px;
        font-weight: 600;
        margin-left: auto;
    }

    .wt-controls {
        display: flex;
        gap: 8px;
        margin-bottom: 16px;
    }

    .wt-controls button {
        flex: 1;
        background: rgba(255,255,255,0.1);
        border: 1px solid rgba(255,255,255,0.2);
        color: white;
        padding: 8px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 16px;
        transition: all 0.2s;
    }

    .wt-controls button:hover {
        background: rgba(255,255,255,0.2);
        transform: translateY(-2px);
    }

    .wt-dialogue {
        background: rgba(255,255,255,0.05);
        padding: 14px;
        border-radius: 12px;
        margin-bottom: 12px;
        min-height: 60px;
    }

    .wt-dialogue p {
        color: rgba(255,255,255,0.9);
        font-size: 14px;
        line-height: 1.6;
        margin: 0;
    }

    .wt-decision {
        background: rgba(251, 191, 36, 0.1);
        border-left: 3px solid #fbbf24;
        padding: 12px;
        border-radius: 0 10px 10px 0;
    }

    .wt-decision-header {
        color: #fbbf24;
        font-size: 14px;
    }

    .wt-term-popup {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(145deg, #1e3a5f, #0f2744);
        border: 2px solid #60a5fa;
        border-radius: 20px;
        padding: 24px;
        z-index: 10001;
        max-width: 400px;
        text-align: center;
        box-shadow: 0 25px 60px rgba(0,0,0,0.6);
    }

    .wt-term-header {
        font-size: 14px;
        color: #60a5fa;
        margin-bottom: 8px;
    }

    .wt-term-name {
        font-size: 22px;
        font-weight: 700;
        color: white;
        margin-bottom: 12px;
    }

    .wt-term-meaning {
        color: rgba(255,255,255,0.8);
        font-size: 15px;
        line-height: 1.6;
        margin-bottom: 16px;
    }

    .wt-term-popup button {
        background: linear-gradient(135deg, #60a5fa, #3b82f6);
        border: none;
        color: white;
        padding: 10px 24px;
        border-radius: 10px;
        font-weight: 600;
        cursor: pointer;
        transition: transform 0.2s;
    }

    .wt-term-popup button:hover {
        transform: scale(1.05);
    }
</style>
`;

// Make globally available
if (typeof window !== 'undefined') {
    window.WalkthroughMode = WalkthroughMode;
    // Inject styles
    document.head.insertAdjacentHTML('beforeend', walkthroughStyles);
}
