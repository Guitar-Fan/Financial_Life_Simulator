Game Design Document: The Financial Blueprint: Full Life Simulation (Ages 6+)
1. Game Overview
Concept: A turn-based life simulation focused on the mathematics of personal finance. The game emphasizes the power of Human Capital (skills, education) and Financial Capital (investments), demonstrating how early decisions and inherent aptitudes dictate long-term net worth.
Core Mechanism: The player manages a monthly budget, makes early-stage investments, and crucially, allocates Time Units (TUs) to build skills that unlock higher-paying future jobs and opportunities.
2. Character Aptitude System (Genetics/RNG)
At the start of the game, the player's character receives randomized "genetic" aptitude scores that are hidden or revealed through early gameplay. These scores affect the Skill Point Gain Rate in specific trees.
2.1 Core Aptitudes (RNG 1-100)
The player's character has an inherent score in three primary areas:
Analytical Aptitude: Affects speed of skill gain in Tech/Data and Finance/Business trees.
Kinesthetic Aptitude: Affects speed of skill gain in Trade/Labor and helps mitigate "burnout" setbacks in physically demanding Labor jobs.
Creative/Social Aptitude: Affects speed of skill gain in Medical/Care and Creative trees, and increases the Interview Modifier in the Salary Minigame.
2.2 Interest Modifiers (Dynamic)
Initial Interest: At age 6, the player is given a random starting "Interest" in one Skill Tree (e.g., high initial interest in Tech).
Effect: When the player spends TUs in a field they are interested in, they receive an additional +10% to +30% Skill Point Gain Rate.
Dynamic Learning: If a player consistently allocates TUs to a skill tree where their initial interest was low (e.g., they spend 50 TUs on Finance), their interest in that field will slowly increase over time, eventually matching the interest bonus. This simulates developing a passion through practice.
3. Skill Acquisition Mechanism (Ages 6-15)
The player gains skills by allocating Time Units (TUs) to Virtual Learning Resources in the Decision Phase of each turn.
3.1 Time Unit (TU) Allocation & Learning
Each month, the player receives 10 Time Units (TUs).


Action
Cost (TUs)
Outcome
Skill Gain Formula
Virtual Learning
1 to 5 TUs
Player selects a Learning Resource (Book, Course, Mentor) tied to a Skill Tree.
$\text{SP Gain} = \text{TUs Spent} \times \text{Resource Quality} \times \text{Aptitude Multiplier} \times \text{Interest Multiplier}$
Networking/Social
1 to 3 TUs
Lowers the chance of a Setback Event. Unlocks random Opportunity Events (e.g., "Friend's parent offers a low-level internship").
Risk Mitigation/Opportunity Generation
Leisure/Rest
1 to 2 TUs
Reduces burnout/stress levels. Necessary to prevent loss of gained skills (Skill Decay).
Prevents Skill Decay (see 3.2)

3.2 Learning Resources and Investment
Instead of simply choosing a skill tree, players choose a tiered learning resource:
Tier 1: Library Book (Free): Low resource quality multiplier (1.0x).
Tier 2: Online Course (Small $ Cost): Medium quality (1.5x) and requires a monetary investment.
Tier 3: Mentor/Workshop (High $ Cost): High quality (2.0x) and requires a significant financial investment, demonstrating that investing money in self speeds up human capital growth.
3.3 Skill Decay (The Need for Maintenance)
To simulate reality, skills atrophy if not used:
If a skill tree receives zero TUs for 12 consecutive months, that skill's points decay by 5% annually.
This forces the player to manage their time and continuously invest in maintaining relevance, even after they start a career.
4. The Career Period: Ages 18+
At age 18, the game shifts from foundational learning to full career and adult financial management. The complexity of financial inputs and outputs increases dramatically.
4.1 Career Progression and Income Control
Full-Time Job Selection: The player chooses a full-time job based on their highest Skill Threshold.
Promotion: Promotions are no longer minigames but are achieved when the player hits a new Skill Threshold (e.g., from Skill Level 20 to 30) AND wins a random annual RNG check (representing management approval/market need).
Salary Negotiation (Control): Annually, the player can choose to Negotiate Salary (risk action).
Success: $2\% - 5\%$ pay bump.
Failure (RNG): No raise, or a small chance of a "Disgruntled" penalty, slightly reducing the next year's bonus. This models the risk of asking for too much.
4.2 Financial Complexity: Control vs. Randomization
Factor
Control (Player Decision)
Randomization (RNG)
Income
Job Pillar Selection, Promotion Effort, Negotiation Frequency.
Annual Market Rate Adjustment (Job's industry average salary changes). Annual Bonus Amount (Varies based on company performance).
Taxes
401k/IRA Contribution % (Tax-Deferred Saving). FSA/HSA utilization.
Federal Tax Bracket changes (Annual). State/Local Property Tax Rate. FICA Cap (Annually).
Expenses
Housing Tier (Rent/Mortgage) Selection, Lifestyle Tier (Variable Expenses).
Major Setbacks (e.g., Medical Bills, Home Repairs, Car Failure). Inflation Rate (affects real expense cost). Interest Rate on Debt.
Investment
Asset Allocation (Stocks, Bonds, Real Estate), Debt Paydown Strategy.
Market Volatility (Monthly/Quarterly Index Return). Real Estate Appreciation/Depreciation.

4.3 Advanced Expense Management (Ages 18+)
The Lifestyle Multiplier: The player must actively choose a lifestyle (Frugal, Average, High-Roller). This choice sets the base Variable Expenses multiplier.
Frugal: 0.7x base expenses, but high chance of 'Social Strain' (a happiness debuff).
High-Roller: 1.5x base expenses, draining cash quickly, but high social benefits.
Debt Mechanics: Introduction of complex debt:
Student Loans: Taken at age 18, with a fixed interest rate.
Mortgage/Rent: Major fixed expense, illustrating the cost of shelter.
Revolving Credit: Available for emergencies, but carries high, compounding interest, showing the mathematical trap of consumer debt.
5. End Game Metric: Net Worth
The ultimate goal remains achieving the highest Net Worth (Assets - Liabilities).
The game's final screen should display the detailed breakdown of the player's wealth:$$ \text{Net Worth} = \left( \sum \text{Investments} + \sum \text{Cash} + \text{Real Estate Value} \right) - \left( \sum \text{Loans} + \sum \text{Credit Card Debt} \right)$$
This final summary will clearly demonstrate how the early investment in Skills (ROHC) and Financial Capital (Compounding) directly led to their final wealth position.