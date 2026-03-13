/**
 * FinancialEducation.js - Comprehensive Financial Education Data Module
 * Contains business terms, strategy explanations, and educational content for teens
 */

const FINANCIAL_EDUCATION = {
    // ==================== BUSINESS TERMS ====================
    terms: {
        // Legal & Setup
        sole_proprietorship: {
            term: "Sole Proprietorship",
            simple: "You ARE the business. No separation between you and your bakery.",
            detailed: "The simplest business structure. You own everything, keep all profits, but you're personally responsible for all debts and lawsuits. If someone sues your bakery, they can take your personal car and savings.",
            realExample: "Most food trucks and small bakeries start this way because it's free to set up.",
            worksWhen: "You're just starting, low risk, testing an idea",
            failsWhen: "Business grows, you have employees, or you're worried about lawsuits"
        },
        llc: {
            term: "LLC (Limited Liability Company)",
            simple: "Your business is a separate 'person' from you. Your personal stuff is protected.",
            detailed: "Costs $50-500 to set up depending on state. Creates a legal wall between your business and personal assets. If the bakery gets sued, they can only take business assets, not your personal savings or home.",
            realExample: "Most small restaurants form an LLC once they're serious about the business.",
            worksWhen: "You have assets to protect, employees, significant revenue",
            failsWhen: "You mix personal and business money (this 'pierces the corporate veil')"
        },
        dba: {
            term: "DBA (Doing Business As)",
            simple: "A nickname for your business. Your legal name might be 'John Smith LLC' but you operate as 'Sweet Dreams Bakery'.",
            detailed: "Lets you use a business name different from your legal name. Costs $10-100 to register. Required if you want to open a bank account or accept payments under your business name.",
            realExample: "Starbucks Corporation does business as 'Starbucks Coffee'",
            worksWhen: "You want a catchy name different from your legal business name",
            failsWhen: "Someone else already registered that name in your area"
        },
        business_license: {
            term: "Business License",
            simple: "Permission slip from your city to run a business.",
            detailed: "Required by most cities. Costs $50-400/year. Without it, you're operating illegally and can be shut down. Also required to open a business bank account.",
            realExample: "Every restaurant you've eaten at has one posted on their wall.",
            worksWhen: "Always required - not optional",
            failsWhen: "N/A - you always need this"
        },
        food_handlers_permit: {
            term: "Food Handler's Permit",
            simple: "Proves you know how to handle food safely.",
            detailed: "Required for anyone handling food. Usually involves taking a short course and passing a test. Costs $10-30. Health inspectors will ask to see these.",
            realExample: "Every employee at McDonald's has to get one before touching any food.",
            worksWhen: "Always required for food businesses",
            failsWhen: "N/A - mandatory"
        },
        health_inspection: {
            term: "Health Inspection",
            simple: "Government checks if your kitchen is clean and safe.",
            detailed: "Health department visits 1-4 times per year, unannounced. They check food storage temperatures, cleanliness, pest control, and employee hygiene. Scores are often posted publicly. Failing can close your business.",
            realExample: "You can look up any restaurant's health score online in most cities.",
            worksWhen: "You maintain consistent cleanliness standards",
            failsWhen: "You cut corners on sanitation or food storage"
        },
        zoning: {
            term: "Zoning Laws",
            simple: "Rules about what type of business can operate in each area of town.",
            detailed: "Cities divide areas into residential, commercial, and industrial zones. A bakery usually needs commercial zoning. Operating in the wrong zone can get you shut down. Some home bakeries are legal under 'cottage food laws'.",
            realExample: "This is why you don't see factories in the middle of neighborhoods.",
            worksWhen: "You verify zoning before signing a lease",
            failsWhen: "You assume any location works for any business"
        },
        liability_insurance: {
            term: "Liability Insurance",
            simple: "Protection that pays if someone gets hurt or sick from your business.",
            detailed: "Costs $500-2000/year for a small bakery. If a customer slips and falls, or gets food poisoning, insurance pays their medical bills and legal fees instead of you. Most landlords require this.",
            realExample: "When someone sued McDonald's for hot coffee burns, insurance paid the millions in damages.",
            worksWhen: "You have customers in your space or could potentially harm someone",
            failsWhen: "You don't actually maintain safe practices (insurance can deny claims)"
        },

        // Financial Terms
        cash_flow: {
            term: "Cash Flow",
            simple: "Money coming in minus money going out. Can you pay today's bills?",
            detailed: "Even profitable businesses can fail from poor cash flow. You might make $10,000/month profit but if rent is due before customers pay, you can't make rent. It's about TIMING of money, not just amount.",
            realExample: "A bakery sells $5,000 in catering but doesn't get paid for 30 days. Rent is due in 5 days. They're profitable but have negative cash flow.",
            worksWhen: "You collect money before bills are due",
            failsWhen: "Large expenses hit before revenue comes in"
        },
        profit_margin: {
            term: "Profit Margin",
            simple: "What percentage of each sale is actual profit after all costs.",
            detailed: "A $5 croissant might cost $2 in ingredients, $1 in labor, $0.50 in overhead. Profit is $1.50, so profit margin is 30%. Restaurants typically run 3-9% net profit margin. Bakeries can hit 10-15% if efficient.",
            realExample: "Grocery stores run on 1-2% margins. One theft can wipe out a day's profit.",
            worksWhen: "You track all costs accurately and price accordingly",
            failsWhen: "You forget hidden costs like waste, utilities, or your own time"
        },
        gross_vs_net: {
            term: "Gross vs Net Profit",
            simple: "Gross = revenue minus product costs. Net = what's left after ALL expenses.",
            detailed: "Gross profit: $100 sales - $30 ingredients = $70 gross. Net profit: $70 - $20 rent - $15 utilities - $10 wages = $25 net. Gross profit looks great but net profit is reality.",
            realExample: "A food truck grosses $200,000/year but nets only $40,000 after all costs.",
            worksWhen: "You focus on net profit, not gross",
            failsWhen: "You celebrate gross numbers while ignoring expenses"
        },
        cogs: {
            term: "COGS (Cost of Goods Sold)",
            simple: "What you spend to make the products you sell.",
            detailed: "Includes ingredients, packaging, and direct labor. Does NOT include rent, marketing, or utilities. For bakeries, COGS should be 25-35% of selling price. If your COGS is 50%, you're underpricing.",
            realExample: "A $4 loaf of bread should cost about $1-1.40 in ingredients and direct labor.",
            worksWhen: "You price products at 3-4x your COGS",
            failsWhen: "Ingredient prices rise but you don't adjust menu prices"
        },
        break_even: {
            term: "Break-Even Point",
            simple: "How many sales you need to cover all your costs. Zero profit, zero loss.",
            detailed: "If monthly costs are $6,000 and each sale profits $3, you need 2,000 sales to break even. Below that you lose money, above that you profit. Critical for knowing if a business can survive.",
            realExample: "A bakery with $8,000/month expenses and $4 profit per item needs 2,000 items sold monthly.",
            worksWhen: "You calculate this BEFORE opening a business",
            failsWhen: "Your realistic sales volume is below break-even"
        },
        working_capital: {
            term: "Working Capital",
            simple: "Cash cushion to cover daily operations and surprises.",
            detailed: "Rule of thumb: have 3-6 months of expenses saved. Covers slow months, equipment breakdowns, and late-paying customers. Businesses fail during growth because they run out of working capital.",
            realExample: "A bakery needs $3,000/month to operate, so they keep $12,000 in reserve.",
            worksWhen: "You save during good months for bad months",
            failsWhen: "You spend all profit immediately"
        },
        roi: {
            term: "ROI (Return on Investment)",
            simple: "How much you earn compared to what you spent. Is it worth it?",
            detailed: "(Profit / Cost) × 100 = ROI%. A $1,000 oven that generates $300/month extra profit = 30% monthly ROI. Pays for itself in 3.3 months. Compare this to other uses of that $1,000.",
            realExample: "Buying a better display case for $2,000 increases sales by $500/month = 25% monthly ROI.",
            worksWhen: "You calculate ROI before major purchases",
            failsWhen: "You make emotional purchases without analyzing returns"
        },
        depreciation: {
            term: "Depreciation",
            simple: "Equipment loses value over time. A $10,000 oven isn't worth $10,000 after 5 years.",
            detailed: "Spread the cost of equipment over its useful life. $10,000 oven ÷ 10 years = $1,000/year depreciation expense. This affects taxes and true profit. Also important when selling business or equipment.",
            realExample: "A 3-year-old commercial mixer originally worth $5,000 might only sell for $2,000.",
            worksWhen: "You account for this when calculating true costs",
            failsWhen: "You ignore it and get surprised when equipment needs replacement"
        },
        accounts_payable: {
            term: "Accounts Payable",
            simple: "Money you owe to suppliers. Bills you haven't paid yet.",
            detailed: "When a flour supplier lets you pay in 30 days, that's accounts payable. Good for cash flow but dangerous if you can't pay on time. Late payments hurt your credit and supplier relationships.",
            realExample: "Your ingredient supplier sends $500 of flour with 'Net 30' terms. You owe $500 within 30 days.",
            worksWhen: "You use the payment window strategically and always pay on time",
            failsWhen: "You lose track and pay late, damaging relationships and credit"
        },
        accounts_receivable: {
            term: "Accounts Receivable",
            simple: "Money customers owe you. Sales you made but haven't been paid for yet.",
            detailed: "Common with catering, corporate orders, or wholesale. The sale is 'made' but cash isn't in hand. Can cause cash flow problems if customers pay late.",
            realExample: "An office orders $800 in pastries for a meeting, billed 'Net 15'. You won't see that money for 15 days.",
            worksWhen: "Customers pay on time and you have cash reserves",
            failsWhen: "Large receivables and small cash reserves create cash crunches"
        },

        // Pricing Terms
        markup: {
            term: "Markup",
            simple: "How much you add to your cost to set the selling price.",
            detailed: "Cost × (1 + markup%) = Price. A 100% markup on a $2 item = $4 selling price. Different from margin! 100% markup = 50% margin. Most retail uses 50-100% markup, restaurants use 300-400%.",
            realExample: "Coffee shops buy beans for $0.25 per cup and sell for $4 = 1500% markup.",
            worksWhen: "You need to quickly calculate prices from costs",
            failsWhen: "You confuse markup with margin (common mistake)"
        },
        margin: {
            term: "Margin",
            simple: "What percentage of the selling price is profit.",
            detailed: "(Price - Cost) / Price × 100 = Margin%. A $4 item costing $2 = 50% margin. Same item has 100% markup. Margin is always lower than markup on the same product.",
            realExample: "A $5 croissant with $1.50 in costs has 70% margin.",
            worksWhen: "You want to know what percent of each sale is profit",
            failsWhen: "You target high margin but ignore volume (selling 1 item at 90% margin vs 100 items at 30% margin)"
        },
        loss_leader: {
            term: "Loss Leader",
            simple: "Selling something at a loss to attract customers who buy other stuff.",
            detailed: "Example: Sell coffee at cost ($1) to bring people in who also buy a $4 pastry. The coffee loses money but the overall transaction profits. Groceries do this with milk and eggs.",
            realExample: "Costco's $1.50 hot dog combo hasn't changed price since 1985. It's a loss leader.",
            worksWhen: "Customers actually buy profitable items along with the loss leader",
            failsWhen: "Customers only buy the cheap item and leave"
        },
        psychological_pricing: {
            term: "Psychological Pricing",
            simple: "Pricing tricks that make items seem cheaper or more valuable.",
            detailed: "$4.99 feels significantly cheaper than $5.00 (left-digit effect). Round numbers ($5, $10) feel premium. Ending in .95 suggests discount, .00 suggests quality.",
            realExample: "Gas stations price at $3.299 instead of $3.30 for this reason.",
            worksWhen: "Your target customers are price-sensitive",
            failsWhen: "You're positioning as premium (luxury brands use round numbers)"
        },

        // Operations
        inventory_turnover: {
            term: "Inventory Turnover",
            simple: "How many times you sell and replace your stock in a period.",
            detailed: "COGS ÷ Average Inventory = Turnover. Higher is better - means you're not sitting on unsold product. Bakeries should turn inventory daily for fresh goods, weekly for dry goods.",
            realExample: "A bakery with $3,000/month COGS and $500 average inventory turns 6x/month.",
            worksWhen: "Fresh products and efficient ordering",
            failsWhen: "You overbuy and throw away expired product"
        },
        shrinkage: {
            term: "Shrinkage",
            simple: "Inventory loss from theft, damage, spoilage, or errors.",
            detailed: "Retail averages 1.5% shrinkage. Bakeries can hit 5-10% from spoilage alone. Tracked as: (Expected Inventory - Actual Inventory) / Expected. Every bit of shrinkage is lost profit.",
            realExample: "If you should have 100 muffins but only count 95, that's 5% shrinkage.",
            worksWhen: "You track inventory closely and minimize waste",
            failsWhen: "You ignore it - shrinkage can exceed profit margin"
        },
        fifo: {
            term: "FIFO (First In, First Out)",
            simple: "Use oldest inventory first. Stock new items behind old ones.",
            detailed: "Critical for food businesses. New flour goes behind old flour. Reduces spoilage and ensures freshness. Also an accounting method that affects reported costs and profits.",
            realExample: "Grocery stores rotate stock so oldest milk is in front.",
            worksWhen: "You maintain discipline in stocking and using ingredients",
            failsWhen: "Employees grab whatever's easiest to reach"
        },
        overhead: {
            term: "Overhead",
            simple: "Costs that exist whether you sell anything or not.",
            detailed: "Rent, insurance, utilities, loan payments, base wages. You pay these if you sell 0 items or 1000 items. High overhead means you need high volume to break even.",
            realExample: "A downtown bakery pays $4,000/month rent whether it's busy or empty.",
            worksWhen: "Your overhead is proportional to your realistic sales volume",
            failsWhen: "You commit to high overhead assuming sales that may not come"
        },
        labor_cost_ratio: {
            term: "Labor Cost Ratio",
            simple: "What percentage of revenue goes to paying employees.",
            detailed: "Labor Costs ÷ Revenue × 100. Restaurants typically aim for 25-35%. Too low means overworked staff and poor service. Too high means unprofitable unless prices rise.",
            realExample: "A bakery making $20,000/month paying $5,000 in labor = 25% labor cost.",
            worksWhen: "Balanced between service quality and profitability",
            failsWhen: "Above 35% is usually unsustainable for food businesses"
        }
    },

    // ==================== STRATEGY CONTEXT ====================
    strategies: {
        premium_pricing: {
            name: "Premium Pricing",
            description: "Charge higher prices, position as high quality",
            worksWhen: [
                "Location has wealthy customers",
                "Your quality is genuinely superior",
                "You can create a luxury experience",
                "Limited competition in the premium space"
            ],
            failsWhen: [
                "Customers are price-sensitive (students, budget areas)",
                "Your quality doesn't justify the price",
                "Cheaper competitors offer 'good enough' quality",
                "Economic downturn makes people cut spending"
            ],
            keyMetric: "Monitor customer return rate. Premium only works with loyalty.",
            realExample: "Levain Bakery in NYC sells $5 cookies. Works because of location, quality, and brand."
        },
        value_pricing: {
            name: "Value/Budget Pricing",
            description: "Lower prices, higher volume",
            worksWhen: [
                "High-traffic location",
                "Price-sensitive customer base",
                "You can operate efficiently at scale",
                "You can negotiate bulk ingredient discounts"
            ],
            failsWhen: [
                "Low foot traffic (can't make up margin with volume)",
                "Overhead is too high for low margins",
                "You can't maintain quality at volume",
                "Competition undercuts you further"
            ],
            keyMetric: "Volume is everything. Track daily transaction count.",
            realExample: "Costco Bakery: Low prices, massive volume, efficient operations."
        },
        diversification: {
            name: "Product Diversification",
            description: "Offer variety to attract different customer segments",
            worksWhen: [
                "Different customers want different things",
                "You can manage complexity",
                "Equipment supports variety",
                "Staff can handle multiple product types"
            ],
            failsWhen: [
                "Too complex = more waste and slower service",
                "You spread attention thin, quality drops",
                "Some products cannibalize others",
                "Inventory becomes unmanageable"
            ],
            keyMetric: "Track profit by product. Cut losers ruthlessly.",
            realExample: "Panera offers breads, pastries, sandwiches, soups, salads. Complex but captures more customers."
        },
        specialization: {
            name: "Deep Specialization",
            description: "Do one thing exceptionally well",
            worksWhen: [
                "That one thing has strong demand",
                "You become locally famous for it",
                "Operations are simple and efficient",
                "Quality can be consistently excellent"
            ],
            failsWhen: [
                "Demand for your specialty declines",
                "A competitor copies you",
                "Your market is too small",
                "You get bored and quality slips"
            ],
            keyMetric: "Brand recognition and word-of-mouth referrals.",
            realExample: "Sprinkles = cupcakes only. Dominique Ansel = the Cronut made him famous."
        },
        location_expansion: {
            name: "Multiple Locations",
            description: "Grow by opening additional stores",
            worksWhen: [
                "First location is consistently profitable",
                "You have documented systems and processes",
                "You can replicate staff quality",
                "Cash reserves cover 6+ months of new location costs"
            ],
            failsWhen: [
                "First location isn't solid yet",
                "You can't find/train good managers",
                "You underestimate capital needed",
                "Markets are different than expected"
            ],
            keyMetric: "Can you step away from Location 1 without it struggling?",
            realExample: "Crumbl Cookies expanded fast with clear systems. Many bakeries fail by expanding too soon."
        },
        catering_wholesale: {
            name: "B2B: Catering & Wholesale",
            description: "Sell to businesses, not just walk-in customers",
            worksWhen: [
                "You have capacity beyond walk-in demand",
                "Large orders smooth production planning",
                "B2B customers pay on time",
                "You can handle delivery logistics"
            ],
            failsWhen: [
                "B2B customers demand discounts that kill margins",
                "One big client leaving tanks your business",
                "Accounts receivable grows but cash shrinks",
                "Delivery costs eat into profits"
            ],
            keyMetric: "B2B should never exceed 40% of revenue (concentration risk).",
            realExample: "A bakery supplying local coffee shops with pastries - stable but lower margin."
        }
    },

    // ==================== RANDOM TIPS ====================
    tips: [
        "80% of restaurants fail in the first 5 years. But those that focus on cash flow survive longer.",
        "Your labor cost should be 25-35% of revenue. Below means overworked staff, above means trouble.",
        "The most profitable menu items are often not the best sellers. Track profit per item, not just sales.",
        "A 10% increase in customer retention can increase profits by 25-95%.",
        "Never spend more than 6% of revenue on marketing when starting out.",
        "Successful bakeries say the real business isn't baking - it's inventory management.",
        "Your first customers should be friends and family, but your reviews shouldn't be.",
        "Most bakery owners underestimate utilities by 30%. Ovens use a LOT of electricity.",
        "A small bakery wastes 5-15% of ingredients. The best ones keep it under 5%.",
        "Holiday seasons can generate 30-40% of annual revenue for bakeries. Plan months ahead.",
        "If you can't take a week off without the business struggling, you don't have a business - you have a job.",
        "The smell of baking is free marketing. Vent your oven exhaust toward foot traffic.",
        "Coffee has the highest markup in most bakeries. Consider adding espresso drinks.",
        "Tuesday and Wednesday are typically the slowest days. Use them for prep and experiments.",
        "Your rent should be under 10% of revenue. Above 15% is dangerous.",
        "Successful owners check their numbers daily, not monthly.",
        "Many bakeries fail not from bad baking, but from poor pricing. Know your costs exactly.",
        "An extra 30 minutes of operating hours can mean 10% more revenue if traffic is there.",
        "Repeat customers are 5x cheaper to keep than acquiring new ones.",
        "Always have 3 months of operating costs in reserve. Non-negotiable."
    ]
};

// Make it globally available
if (typeof window !== 'undefined') {
    window.FINANCIAL_EDUCATION = FINANCIAL_EDUCATION;
}
