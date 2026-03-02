/**
 * BusinessJournal.js — Discoverable encyclopedia + contextual mentor hints.
 *
 * Entries unlock when the player first encounters relevant situations.
 * Pierre the mentor provides non-intrusive tips; the journal persists
 * as a browsable reference.  Draws content from FINANCIAL_EDUCATION.
 *
 * Also manages the "mentor hint" notification flow.
 */

class BusinessJournal {
    constructor(gameController) {
        this.game = gameController;

        /** Unlocked journal entries: { id, title, category, content, unlockedDay } */
        this.entries = [];

        /** Set of concept IDs already unlocked */
        this.unlockedIds = new Set();

        /** Queue of pending mentor hints (shown one at a time, with delay) */
        this._hintQueue = [];
        this._hintTimer = null;

        // Map trigger situations → concept IDs
        this.triggers = this._buildTriggerMap();

        console.log('📓 BusinessJournal initialised');
    }

    /* ------------------------------------------------------------------ */
    /*  Trigger map: situation → concept unlock                            */
    /* ------------------------------------------------------------------ */

    _buildTriggerMap() {
        return {
            first_sale:             'cash_flow',
            first_loss:             'profit_margin',
            ingredient_spoiled:     'inventory_turnover',
            supply_shortage:        'supply_chain',
            competitor_opened:      'competitive_analysis',
            price_change:           'price_elasticity',
            staff_hired:            'labor_costs',
            staff_quit:             'employee_retention',
            equipment_breakdown:    'depreciation',
            loan_taken:             'debt_management',
            weather_storm:          'risk_management',
            high_demand:            'supply_and_demand',
            low_demand:             'marketing_basics',
            bulk_purchase:          'economies_of_scale',
            seasonal_change:        'seasonal_business',
            health_inspection:      'regulatory_compliance',
            community_event:        'community_engagement',
            reputation_drop:        'brand_management',
            reputation_rise:        'customer_loyalty',
            break_even_reached:     'break_even',
            first_expansion:        'growth_strategy',
            scenario_decision:      'decision_making',
            vendor_relationship:    'vendor_management',
            markup_adjustment:      'pricing_strategy',
            automation_used:        'operational_efficiency',
            minigame_played:        'negotiation',
            quality_complaint:      'quality_control',
            // Step 11 triggers
            marketing_campaign:     'advertising_roi',
            tech_upgrade:           'technology_adoption',
            global_event:           'economic_cycles',
            sustainability_action:  'sustainability',
            expansion_milestone:    'growth_strategy',
            credit_score_change:    'credit_management',
            inspection_passed:      'regulatory_compliance',
            inspection_failed:      'regulatory_compliance',
        };
    }

    /* ------------------------------------------------------------------ */
    /*  Journal content database (extends FINANCIAL_EDUCATION)             */
    /* ------------------------------------------------------------------ */

    _getContent(conceptId) {
        // Try to pull from FINANCIAL_EDUCATION first
        if (window.FINANCIAL_EDUCATION && window.FINANCIAL_EDUCATION.terms) {
            const fe = window.FINANCIAL_EDUCATION.terms;
            // Concepts in FINANCIAL_EDUCATION use underscores
            if (fe[conceptId]) {
                const t = fe[conceptId];
                return {
                    title: t.term,
                    category: 'financial',
                    summary: t.simple,
                    detail: t.detailed,
                    example: t.realExample,
                    worksWhen: t.worksWhen,
                    failsWhen: t.failsWhen
                };
            }
        }

        // Fallback extended content for world-sim concepts
        const extended = {
            supply_chain: {
                title: 'Supply Chain Management',
                category: 'operations',
                summary: 'How ingredients get from farms & factories to your bakery.',
                detail: 'A supply chain is the network of suppliers, transportation, and storage that delivers your raw materials. Disruptions (storms, shortages, pandemics) can delay or increase costs. Diversifying suppliers reduces risk.',
                example: 'During a wheat shortage, bakeries with multiple flour suppliers kept baking while single-source bakeries had to close.',
                worksWhen: 'You maintain relationships with 2-3 vendors',
                failsWhen: 'You rely on one supplier and they fail'
            },
            competitive_analysis: {
                title: 'Competitive Analysis',
                category: 'strategy',
                summary: 'Understanding what other bakeries are doing and why.',
                detail: 'Know your competitors\' prices, quality, target customers, and marketing. You don\'t need to be the cheapest — find your unique advantage (best quality, best location, best service, niche menu).',
                example: 'Starbucks doesn\'t compete on price — they compete on experience and convenience.',
                worksWhen: 'You differentiate from competitors rather than copying them',
                failsWhen: 'You ignore competitors or try to be everything to everyone'
            },
            risk_management: {
                title: 'Risk Management',
                category: 'financial',
                summary: 'Planning for things that could go wrong.',
                detail: 'Every business faces risks: equipment failure, supply disruptions, competitor moves, economic downturns. Insurance, emergency funds, diversified suppliers, and flexible menus all reduce risk.',
                example: 'A bakery with a $5,000 emergency fund survived a broken oven; one without had to close for a week.',
                worksWhen: 'You prepare before problems hit',
                failsWhen: 'You assume everything will always go well'
            },
            seasonal_business: {
                title: 'Seasonal Business Cycles',
                category: 'operations',
                summary: 'Sales naturally rise and fall with seasons and holidays.',
                detail: 'Most bakeries see peaks during holidays (Thanksgiving, Christmas, Valentine\'s) and dips in summer. Smart bakeries adjust their menu, staffing, and inventory for each season.',
                example: 'Pumpkin spice products generate 40% of some bakeries\' fall revenue.',
                worksWhen: 'You plan inventory and staff for seasonal swings',
                failsWhen: 'You overstock for a season that disappoints'
            },
            community_engagement: {
                title: 'Community Engagement',
                category: 'marketing',
                summary: 'Building relationships with your neighborhood.',
                detail: 'Sponsoring local events, donating to schools, and participating in farmers markets builds loyalty that advertising can\'t buy. People support businesses that support their community.',
                example: 'A bakery that donated leftover bread to a shelter got a front-page newspaper story — free marketing!',
                worksWhen: 'Your community involvement is genuine',
                failsWhen: 'It feels like marketing rather than caring'
            },
            brand_management: {
                title: 'Brand Management',
                category: 'marketing',
                summary: 'What people think and say about your bakery when you\'re not around.',
                detail: 'Your brand is your reputation: quality consistency, customer service, visual identity, and community presence. Bad reviews spread 2x faster than good ones.',
                example: 'One viral food poisoning incident can destroy a restaurant\'s brand overnight.',
                worksWhen: 'Every customer interaction reinforces your values',
                failsWhen: 'Quality is inconsistent or service is rude'
            },
            customer_loyalty: {
                title: 'Customer Loyalty',
                category: 'marketing',
                summary: 'Keeping existing customers costs 5x less than finding new ones.',
                detail: 'Loyal customers spend more, visit more often, forgive occasional mistakes, and refer friends. Loyalty programs, consistent quality, and personal recognition all build loyalty.',
                example: 'Starbucks Rewards has 31 million active members who spend 3x more than non-members.',
                worksWhen: 'You recognise and reward repeat customers',
                failsWhen: 'You take loyal customers for granted'
            },
            vendor_management: {
                title: 'Vendor Relationships',
                category: 'operations',
                summary: 'Your suppliers are business partners, not just order-takers.',
                detail: 'Building strong relationships with vendors can give you better prices, priority during shortages, and access to premium seasonal ingredients. Pay on time, communicate clearly, and occasionally visit their operations.',
                example: 'A bakery\'s flour supplier gave them priority shipments during a wheat shortage because they were a loyal customer.',
                worksWhen: 'You treat it as a long-term partnership',
                failsWhen: 'You constantly switch vendors for the cheapest price'
            },
            employee_retention: {
                title: 'Employee Retention',
                category: 'operations',
                summary: 'Keeping good employees saves money & preserves quality.',
                detail: 'Replacing an employee costs 50-200% of their annual salary when you factor in hiring, training, and lost productivity. Fair pay, good culture, growth opportunities, and recognition keep good people.',
                example: 'In-N-Out pays above market rate and has the lowest turnover in fast food.',
                worksWhen: 'You invest in your team before they want to leave',
                failsWhen: 'You only react after someone gives notice'
            },
            quality_control: {
                title: 'Quality Control',
                category: 'operations',
                summary: 'Consistent quality keeps customers coming back.',
                detail: 'Customers expect the same croissant every time. Standardised recipes, fresh ingredients, maintained equipment, and trained staff all contribute to consistency. One bad experience can cost a customer for life.',
                example: 'McDonald\'s built a global empire on one thing: the same Big Mac everywhere.',
                worksWhen: 'You have systems for consistency, not just good intentions',
                failsWhen: 'Quality varies based on who\'s working that day'
            },
            negotiation: {
                title: 'Negotiation Skills',
                category: 'strategy',
                summary: 'Getting better deals by understanding what both sides need.',
                detail: 'Good negotiation isn\'t about winning — it\'s about finding outcomes where both parties benefit. Volume commitments, long-term contracts, and prompt payment can all be negotiating chips.',
                example: 'A bakery negotiated 15% off flour by committing to weekly orders for 6 months.',
                worksWhen: 'You understand what the other party values',
                failsWhen: 'You only focus on getting the lowest price'
            },
            pricing_strategy: {
                title: 'Pricing Strategy',
                category: 'financial',
                summary: 'Setting prices that balance profit and customer volume.',
                detail: 'Price too high and customers leave. Price too low and you can\'t cover costs. The ideal price depends on your costs, competitors, customer willingness to pay, and your brand positioning.',
                example: 'A premium bakery charges $5 for a cookie and sells 50/day. A value bakery charges $2 and needs to sell 150 just to match.',
                worksWhen: 'Your price matches your brand and covers all costs',
                failsWhen: 'You set prices based on gut feeling instead of data'
            },
            operational_efficiency: {
                title: 'Operational Efficiency',
                category: 'operations',
                summary: 'Doing more with less — reducing waste and maximising output.',
                detail: 'Track waste, optimise baking schedules, cross-train staff, and maintain equipment. Small efficiency improvements compound over time.',
                example: 'A bakery reduced waste from 15% to 5% by tracking what sold each day and adjusting production.',
                worksWhen: 'You measure, then improve, then measure again',
                failsWhen: 'You cut corners that affect quality'
            },
            marketing_basics: {
                title: 'Marketing Fundamentals',
                category: 'marketing',
                summary: 'Getting the right message to the right people at the right time.',
                detail: 'Marketing isn\'t just advertising. It\'s understanding who your customers are, what they want, and how to reach them. Word of mouth, social media, local events, and signage all play roles.',
                example: 'A bakery posted one photo of their chocolate croissant on Instagram and got 200 new customers that week.',
                worksWhen: 'Your marketing matches your actual product and target customer',
                failsWhen: 'You try to reach everyone instead of your ideal customer'
            },
            decision_making: {
                title: 'Business Decision Making',
                category: 'strategy',
                summary: 'Making choices with incomplete information — and learning from the results.',
                detail: 'No business decision has perfect information. Use data when available, consider trade-offs, make a choice, then measure the outcome. The best entrepreneurs learn fast from mistakes.',
                example: 'A bakery tested two new products for a week each, then kept the one that sold better.',
                worksWhen: 'You decide quickly with available data and review outcomes',
                failsWhen: 'You overthink, or never review whether your choice worked'
            },
            regulatory_compliance: {
                title: 'Regulatory Compliance',
                category: 'operations',
                summary: 'Following health, safety, and business rules to stay open.',
                detail: 'Health codes, food safety permits, business licences, insurance requirements — ignoring any of these can shut you down instantly. Build compliance into your daily routine.',
                example: 'A bakery failed a surprise health inspection and was closed for 3 days — losing $4,000 in revenue.',
                worksWhen: 'Compliance is a daily habit, not an event',
                failsWhen: 'You only clean up when you know an inspector is coming'
            },
            growth_strategy: {
                title: 'Growth Strategy',
                category: 'strategy',
                summary: 'Expanding your business at the right pace.',
                detail: 'Growth options: more products, more customers, higher prices, second location, wholesale, catering. Each has different risk/reward. Grow too fast and you run out of cash. Too slow and competitors overtake you.',
                example: 'Crumbl Cookies grew from 1 to 800+ locations in 5 years by perfecting one store model first.',
                worksWhen: 'Each growth step is funded and operationally ready',
                failsWhen: 'You expand before your current operation is profitable'
            },
            // Step 11 extended concepts
            advertising_roi: {
                title: 'Advertising ROI',
                category: 'marketing',
                summary: 'Measuring whether your marketing spend actually brings in more revenue.',
                detail: 'ROI (Return on Investment) for advertising = (Revenue from ads - Cost of ads) / Cost of ads × 100%. A $100 flyer campaign that brings $300 in sales has 200% ROI. Track every campaign to learn what works for YOUR bakery.',
                example: 'A bakery found that $150 social media ads brought 3x more customers than $300 newspaper ads.',
                worksWhen: 'You test small, measure results, then scale what works',
                failsWhen: 'You spend big on one channel without testing first'
            },
            technology_adoption: {
                title: 'Technology in Business',
                category: 'operations',
                summary: 'Using technology to work smarter, not harder.',
                detail: 'POS systems track what sells. Online ordering reaches new customers. Inventory software reduces waste. Each technology has a cost, but the right ones pay for themselves quickly. Don\'t adopt tech for the sake of it — adopt it to solve real problems.',
                example: 'A bakery\'s POS system revealed that 40% of revenue came from 3 products — they doubled production of those items.',
                worksWhen: 'Technology solves a specific operational problem',
                failsWhen: 'You adopt trendy tech without a clear business case'
            },
            economic_cycles: {
                title: 'Economic Cycles',
                category: 'financial',
                summary: 'The economy goes up and down — your bakery needs to weather both.',
                detail: 'Economic booms bring more spending. Downturns reduce it. Supply chain crises raise costs. Smart businesses build cash reserves during good times and cut non-essential expenses during bad times, rather than the other way around.',
                example: 'Bakeries that had 3+ months of cash reserves survived COVID; many without reserves closed permanently.',
                worksWhen: 'You save during booms and adapt during busts',
                failsWhen: 'You overexpand during good times and have no cushion'
            },
            sustainability: {
                title: 'Business Sustainability',
                category: 'operations',
                summary: 'Reducing waste and environmental impact while building customer goodwill.',
                detail: 'Modern consumers increasingly prefer businesses that care about the environment. Composting, eco packaging, energy efficiency, and food donation reduce costs AND build a positive brand image.',
                example: 'A bakery that donated unsold bread got featured in the local news — free advertising worth thousands.',
                worksWhen: 'Your sustainability efforts are genuine and visible to customers',
                failsWhen: 'It\'s perceived as greenwashing rather than real commitment'
            },
            credit_management: {
                title: 'Credit & Debt Management',
                category: 'financial',
                summary: 'Borrowing wisely and building a strong credit history.',
                detail: 'Loans are tools, not traps — when used wisely. A good credit score gets you better interest rates. Always borrow for growth (equipment, expansion), never for daily expenses. Missing payments damages your score and increases future borrowing costs.',
                example: 'A bakery used a low-interest equipment loan to buy a better oven. The oven paid for itself in 6 months through increased capacity.',
                worksWhen: 'Borrowed money generates more income than the interest costs',
                failsWhen: 'You borrow to cover operating losses instead of fixing the root cause'
            }
        };

        return extended[conceptId] || {
            title: conceptId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            category: 'general',
            summary: 'A business concept you\'ve encountered in running your bakery.',
            detail: 'Check back later for more details as your experience grows!',
            example: '',
            worksWhen: '',
            failsWhen: ''
        };
    }

    /* ------------------------------------------------------------------ */
    /*  Unlock & hint flow                                                  */
    /* ------------------------------------------------------------------ */

    /**
     * Call when a triggering situation occurs.
     * @param {string} situation  Key from the trigger map (e.g. 'first_sale')
     * @returns {boolean} true if a NEW entry was unlocked
     */
    onSituation(situation) {
        const conceptId = this.triggers[situation];
        if (!conceptId || this.unlockedIds.has(conceptId)) return false;

        // Unlock
        this.unlockedIds.add(conceptId);
        const content = this._getContent(conceptId);
        const entry = {
            id: conceptId,
            ...content,
            unlockedDay: this.game?.engine?.day || 1
        };
        this.entries.push(entry);

        // Tell WorldSimulation (if present)
        if (this.game?.world) {
            this.game.world.encounterConcept(conceptId);
        }

        // Queue a mentor hint
        this._queueHint(entry);
        return true;
    }

    /**
     * Queue a non-intrusive Pierre mentor hint.
     */
    _queueHint(entry) {
        this._hintQueue.push(entry);
        if (!this._hintTimer) {
            this._showNextHint();
        }
    }

    _showNextHint() {
        if (this._hintQueue.length === 0) {
            this._hintTimer = null;
            return;
        }
        const entry = this._hintQueue.shift();

        // Use notification system if available
        if (this.game?.notificationSystem) {
            this.game.notificationSystem.notify(
                `<strong>📓 New Journal Entry:</strong> ${entry.title}<br><em>${entry.summary}</em>`,
                {
                    type: 'info',
                    icon: '🧑‍🍳',
                    title: 'Pierre says…',
                    duration: 8000,
                    onClick: () => this.showJournal(entry.id)
                }
            );
        }

        // Space out hints
        this._hintTimer = setTimeout(() => this._showNextHint(), 12000);
    }

    /* ------------------------------------------------------------------ */
    /*  Contextual mentor tips (called from GameController)                */
    /* ------------------------------------------------------------------ */

    /**
     * Check if the player deserves a proactive tip based on current state.
     * Returns a tip string or null.
     */
    getMentorTip(snapshot) {
        const tips = [];

        // Buying at peak prices
        if (snapshot.season === 'WINTER' && snapshot.phase === 'buying') {
            tips.push('🧑‍🍳 Pierre: "Produce is expensive in winter. Consider stocking up on dry goods instead — they last longer and cost less right now."');
        }

        // Low on cash
        if (snapshot.cash < 500 && snapshot.day > 3) {
            tips.push('🧑‍🍳 Pierre: "Cash is tight! Focus on your best-selling items and avoid over-ordering. Cash flow is king."');
        }

        // Equipment neglected
        if (snapshot.equipmentCondition < 50) {
            tips.push('🧑‍🍳 Pierre: "Your equipment is wearing out! A breakdown during peak hours would be devastating. Consider scheduling maintenance."');
        }

        // High spoilage
        if (snapshot.spoilageRate > 0.15) {
            tips.push('🧑‍🍳 Pierre: "You\'re wasting over 15% of ingredients! Try buying smaller quantities more frequently."');
        }

        // Competitor opened
        if (snapshot.newCompetitor) {
            tips.push('🧑‍🍳 Pierre: "A new competitor opened! Don\'t panic-cut prices. Think about what makes YOUR bakery special."');
        }

        // Staff morale low
        if (snapshot.staffMorale < 40) {
            tips.push('🧑‍🍳 Pierre: "Your team seems unhappy. Morale affects quality, speed, and whether they stick around. A small raise or day off can work wonders."');
        }

        if (tips.length === 0) return null;
        return tips[Math.floor(Math.random() * tips.length)];
    }

    /* ------------------------------------------------------------------ */
    /*  Journal UI                                                          */
    /* ------------------------------------------------------------------ */

    showJournal(highlightId = null) {
        const container = document.getElementById('game-container');
        if (!container) return;

        const categories = {};
        this.entries.forEach(entry => {
            if (!categories[entry.category]) categories[entry.category] = [];
            categories[entry.category].push(entry);
        });

        const categoryIcons = {
            financial: '💰', operations: '⚙️', strategy: '📋',
            marketing: '📢', general: '📌'
        };

        let html = `
            <div class="journal-overlay" style="
                position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 9999;
                display: flex; justify-content: center; align-items: center; padding: 20px;
            ">
            <div style="
                background: linear-gradient(135deg, #1a1a2e, #16213e); border-radius: 16px;
                max-width: 800px; width: 100%; max-height: 85vh; overflow-y: auto;
                padding: 30px; color: #f0e6d3; box-shadow: 0 0 40px rgba(0,0,0,0.6);
                border: 1px solid rgba(255,215,0,0.2);
            ">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                    <h2 style="margin:0;">📓 Business Journal</h2>
                    <button onclick="document.querySelector('.journal-overlay').remove()"
                        style="background:none; border:none; color:#f0e6d3; font-size:24px; cursor:pointer;">✕</button>
                </div>
                <p style="opacity:0.7; margin-bottom:20px;">
                    ${this.entries.length} concepts discovered out of ${Object.keys(this.triggers).length} situations.
                    Concepts unlock as you experience new business situations!
                </p>
        `;

        if (this.entries.length === 0) {
            html += `<p style="text-align:center; padding:40px; opacity:0.5;">
                Your journal is empty. Play the game and encounter new situations to unlock entries!
            </p>`;
        }

        for (const [cat, entryList] of Object.entries(categories)) {
            html += `<h3 style="margin-top:20px; color:#ffd700;">${categoryIcons[cat] || '📌'} ${cat.charAt(0).toUpperCase() + cat.slice(1)}</h3>`;
            entryList.forEach(entry => {
                const isHighlighted = entry.id === highlightId;
                html += `
                    <div style="
                        background: ${isHighlighted ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.05)'};
                        border-radius: 10px; padding: 16px; margin-bottom: 12px;
                        border-left: 3px solid ${isHighlighted ? '#ffd700' : 'rgba(255,255,255,0.1)'};
                        transition: all 0.3s;
                    " id="journal-${entry.id}">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <strong style="font-size:16px;">${entry.title}</strong>
                            <span style="opacity:0.5; font-size:12px;">Day ${entry.unlockedDay}</span>
                        </div>
                        <p style="margin:8px 0 0; opacity:0.8;">${entry.summary}</p>
                        <details style="margin-top:8px;">
                            <summary style="cursor:pointer; opacity:0.7; font-size:13px;">Learn more…</summary>
                            <div style="padding:10px 0; font-size:14px; line-height:1.6;">
                                <p>${entry.detail}</p>
                                ${entry.example ? `<p style="color:#4fc3f7;"><strong>Real-world:</strong> ${entry.example}</p>` : ''}
                                ${entry.worksWhen ? `<p style="color:#81c784;">✅ <strong>Works when:</strong> ${entry.worksWhen}</p>` : ''}
                                ${entry.failsWhen ? `<p style="color:#e57373;">❌ <strong>Fails when:</strong> ${entry.failsWhen}</p>` : ''}
                            </div>
                        </details>
                    </div>
                `;
            });
        }

        html += `</div></div>`;
        container.insertAdjacentHTML('beforeend', html);

        // Scroll to highlighted entry
        if (highlightId) {
            setTimeout(() => {
                const el = document.getElementById(`journal-${highlightId}`);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 200);
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Save / Load                                                        */
    /* ------------------------------------------------------------------ */

    save() {
        return {
            entries: this.entries,
            unlockedIds: [...this.unlockedIds]
        };
    }

    load(data) {
        if (!data) return;
        if (data.entries) this.entries = data.entries;
        if (data.unlockedIds) this.unlockedIds = new Set(data.unlockedIds);
    }
}

window.BusinessJournal = BusinessJournal;
