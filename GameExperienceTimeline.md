# Financial Life Simulator – Detailed Gameplay Experience Timeline

This document mirrors the detailed design in `Plan.md`, but translates it into a **moment‑to‑moment player experience**. It focuses especially on:
- Early years of **skill development** (ages 6–15).
- **Aptitudes, interests, and opportunities** discovered over time.
- Transition into **career, jobs, and financial complexity** (18+).

Time here is “real-world minutes played”, not in‑game months/years.

---

## Minute 0–2: New Save, Genetics/Aptitudes, and First TUs

**Player actions**
- Launches the game and chooses **“New Life”**.
- Picks a **difficulty** (Casual/Standard/Expert) and confirms starting age **6**.
- Sees a short intro panel explaining that this is a **full life finance sim** with a focus on **Human Capital (skills)** and **Financial Capital (money)**.
- Clicks through 2–3 tutorial cards explaining **Time Units (10 TUs/month)** and the idea of **Skill Trees** and **Aptitudes**.
- Accepts default settings for tooltips, autosave, and seeded randomness.

**Game actions**
- Rolls hidden **Core Aptitudes (1–100)** for:
  - Analytical Aptitude.
  - Kinesthetic Aptitude.
  - Creative/Social Aptitude.
- Rolls a starting **Interest** in one skill tree (e.g., Tech/Data, Finance/Business, Trade/Labor, Medical/Care, Creative/Social).
- Initializes the age at **6 years**, with **10 TUs** and no money yet (all focus on learning).
- Highlights the **left panel** (TU allocation: Tech/Data, Finance/Business, Trade/Labor, Medical/Care, Creative/Social, Networking, Rest).
- Shows a glowing hint on the **Virtual Learning** action explaining that investing time now will unlock jobs later.

---

## Minute 2–5: First Learning Choices (Ages 6–7)

**Player actions**
- Drags TU sliders for the first time, for example:
  - 4 TUs into **Tech/Data**.
  - 2 TUs into **Creative/Social**.
  - 2 TUs into **Networking**.
  - 2 TUs into **Rest/Leisure**.
- Clicks into the **Learning Resource** picker for Tech/Data and chooses a **Tier 1: Library Book (Free)** as the first resource.
- Reads the short tooltip that explains:
  - Library books are **0$ cost** but modest quality.
  - Higher tiers (online courses, mentor/workshop) have higher **Resource Quality multipliers**.
- Confirms the monthly plan and clicks **“Resolve Month”**.

**Game actions**
- Uses the formula:
  - $\text{SP Gain} = \text{TUs Spent} \times \text{Resource Quality} \times \text{Aptitude Multiplier} \times \text{Interest Multiplier}$
  to compute skill points gained in **Tech/Data** and **Creative/Social**.
- Applies extra **Interest Multiplier** where the player’s initial interest is high (+10–30% SP gain).
- Tracks **Networking/Social** TUs as a reduced chance of future **Setback Events** and a slightly increased chance of **Opportunity Events** (e.g., “friend’s parent works in IT”).
- Uses Rest TUs to keep **Burnout/Happiness** stable and prevent **Skill Decay** in future years.
- Animates incremental bars in the **Skill Tree view**, showing small but noticeable progress in Tech/Data and Creative/Social.
- Shows a monthly mini-summary: “Age 6, Month 1 – You gained X Tech SP, Y Creative SP.”

---

## Minute 5–10: Experimenting With Skill Trees and Resources (Ages 7–9)

**Player actions**
- Starts to **experiment** with different allocations across months:
  - Tries putting more TUs into **Finance/Business** for a few turns.
  - Tests **Trade/Labor** or **Medical/Care** to see how fast skill points accumulate.
- Upgrades learning resources:
  - For a favored tree (e.g., Tech/Data), the player switches from **Library Book** to **Online Course (Tier 2)** when they first earn some pocket money (allowance, tiny minigame chores, or tutorial stipend).
- Observes that some trees feel “faster” to level (those aligned with their high aptitudes) and others are slower or more demanding.
- Occasionally invests TUs in **Networking/Social** to unlock early **Opportunity Events**.
- Ensures a couple of TUs go into **Rest** most months to keep burnout low.

**Game actions**
- Reveals **partial hints** about aptitudes over time as patterns of SP gain emerge:
  - After several months, a tooltip appears: “You seem to learn Tech/Data skills faster than average.”
- Dynamically **increases interest** in under‑loved trees if the player consistently invests TUs there (simulating “growing into” a field).
- Introduces minor **childhood events**, driven by Networking:
  - “You joined a school coding club.” → small Tech/Data SP bonus.
  - “You helped a neighbor fix their bike.” → small Trade/Labor SP bonus.
- Begins tracking **Skill Decay timers** internally (no decay yet, but shows hints: “If you ignore a tree for a year, it will slowly decay.”).
- Gradually unlocks simple **badges** like “First 50 Tech SP” or “Balanced Learner (3+ trees above 20 SP).”

---

## Minute 10–15: Strategic TU Allocation and Early Specialization (Ages 10–12)

**Player actions**
- Starts to **specialize** based on feedback:
  - If Tech/Data aptitude seems high, channels 5–6 TUs/month into Tech/Data.
  - Keeps 1–2 TUs in a secondary tree (e.g., Finance/Business or Creative/Social) to avoid being too one‑dimensional.
- Tries a **Tier 3 Mentor/Workshop** at least once for a favorite tree, paying a clear monetary cost (still in a guided/tutorial way).
- Uses **Networking/Social** time to chase specific opportunities (e.g., a middle-school robotics club or junior internship hint).
- Balances **Rest/Leisure** to keep the **Burnout meter** healthy after pushing a tree hard for several months.

**Game actions**
- Applies high **Resource Quality** multipliers for Mentor/Workshop (2.0x) and visually dramatizes the big jump in SP for that month.
- Reflects the monetary cost of higher-tier resources, even in early life, reinforcing the idea that **investing money in human capital accelerates growth**.
- Starts surfacing **future job previews** based on emerging skills (not yet available, but teased):
  - “At 18, with Tech Skill 40+, you could qualify for Junior Developer.”
  - “With strong Creative/Social, Medical or Counseling paths may open later.”
- Tracks that some trees have gone **12 months without TUs** and begins to apply **5% yearly Skill Decay** where applicable.
- Updates the **Discovery UI**: aptitudes are now partially revealed numerically (e.g., “Analytical Aptitude: High”) and interest meters for each tree become visible.

---

## Minute 15–20: High School Years, Internships, and Early Money (Ages 13–15)

**Player actions**
- Continues refining strategy:
  - Focuses on 1–2 primary skill trees reaching significant **Skill Thresholds** (e.g., Tech 30+, Finance 20+).
- Responds to new **Opportunity Events** like:
  - “Friend’s parent offers a low-level internship or summer job.”
  - “You can volunteer at a clinic / makerspace / theater group.”
- Starts earning **small income** via internships or part-time work, and makes simple money choices:
  - Decides whether to **spend** on higher-tier learning resources.
  - Or **save** in a basic cash account (no investments yet, just a taste of budgeting).
- Continues to manage **Networking/Social** to unlock better internships and reduce the chance of early setbacks.

**Game actions**
- Checks **Skill Thresholds** and **Networking levels** to determine which early jobs/internships are unlocked.
- Introduces small **Income + Expense** flows:
  - Internship pay is credited monthly.
  - Simple teen expenses (phone, transport, minor lifestyle) are debited.
- Uses the same monthly loop engine: **Set TUs → Resolve Month → Animate Charts**.
- Begins tracking a very simple **Net Worth panel** (mostly cash, maybe a symbolic small “human capital index”).
- Shows **life events** that tie skill choices to job opportunities: “Because of your strong Tech skills and networking, you get a better-paying internship.”

---

## Minute 20–25: Transition Planning to Adulthood (Ages 16–17)

**Player actions**
- Opens a **Future Career Preview** screen that lists potential jobs at age 18, with minimum Skill Thresholds and approximate salaries.
- Experiments with scenarios:
  - “If I push Tech to 40 and Finance to 25, what jobs unlock?”
  - “What if I pursue Trade/Labor instead, leveraging Kinesthetic aptitude?”
- Allocates TUs more aggressively to ensure hitting at least one appealing job’s thresholds.
- Makes **pre-college decisions** like whether to start accumulating **student loan exposure** (previewed, not yet active) or aim for paths with lower formal education requirements.

**Game actions**
- Renders preview panels for jobs with requirements drawn from the design in `Plan.md` (Tech/Data, Finance/Business, Trade/Labor, Medical/Care, Creative/Social careers).
- Calculates probability distributions for **starting income ranges** based on skill levels and aptitudes.
- Surfaces **aptitude details** more clearly by now, explaining why some paths are easier/harder for this character.
- Highlights **Interest Evolution**: shows which trees the player grew to like via consistent TUs, even if initial interest was low.
- Saves a **major snapshot** at age 17, allowing future rewinds or alternate career experiments.

---

## Minute 25–35: Age 18 Shift – Career Selection and Adult Finances Begin

**Player actions**
- Reaches age **18**; sees a major transition screen explaining that the game now emphasizes **career and money** alongside continuing skill development.
- Reviews a curated list of **available full‑time jobs**, filtered by achieved Skill Thresholds and aptitudes.
- Chooses a starting career (e.g., Junior Developer, Apprentice Electrician, Medical Assistant, Retail/Service, etc.).
- Decides whether to **take on student loans** for advanced education (e.g., university, trade school) versus starting full-time work immediately.
- Sets initial **budget sliders**:
  - Housing tier (roommate / studio / nicer apartment).
  - Lifestyle Multiplier (Frugal / Average / High-Roller).
  - Savings % and debt payment priority.

**Game actions**
- Converts the game loop to full **Career Mode** as detailed in `Plan.md`:
  - Calculates **Income** from the chosen job, with base salary influenced by skill and aptitudes.
  - Applies **Taxes** (federal/state), showing marginal vs. effective rates.
  - Initializes **Expenses** based on housing and lifestyle choices (using the Lifestyle Multiplier: 0.7x / 1.0x / 1.5x).
- Introduces **Debt Mechanics** if applicable:
  - Starts tracking **Student Loans** if chosen.
  - Sets up potential **Revolving Credit** as an emergency tool.
- Preserves **Skill Trees** and allows continued TU allocation for upskilling while working full-time (less free TU than childhood).
- Updates UI: adds full **Net Worth panel**, **Income/Expense charts**, and **Debt breakdown**.

---

## Minute 35–45: Monthly Career Loop, Promotions, and Negotiations (Ages 18–25 Slice)

**Player actions**
- Plays several months/years of the **adult monthly loop**:
  - Allocates TUs each month to balancing work-related skill growth, side gigs, networking, and rest.
  - Adjusts budget sliders for savings %, debt payments, and lifestyle when income or costs change.
- Attempts **salary negotiation** during annual review:
  - Chooses whether to risk negotiation this year.
  - If attempting, decides how aggressive to be.
- Applies for internal promotions or lateral moves when **Skill Thresholds** are met.
- Experiments with **basic investments** (index funds vs. bonds vs. leaving cash idle).

**Game actions**
- For each month, runs the **Turn Resolution engine**:
  - Applies salary, taxes, expenses, debt interest, and investment returns (RNG-driven markets with bounded volatility).
  - Updates skill levels from TUs using the same SP Gain formula, now at adult scales.
- Annually:
  - Runs a **promotion check** when skill thresholds are crossed + an RNG approval roll.
  - Resolves the **Salary Negotiation** minigame → success yields 2–5% raise, failure may trigger a small future penalty (“Disgruntled” flag).
- Continues to spawn **life events**:
  - Medical bills, car repairs, relocation options, job market shifts.
- Tracks and animates:
  - **Net Worth trajectory**.
  - **Debt amortization**.
  - **Happiness/Burnout** and its effect on TU efficiency.

---

## Minute 45–60+: Mid‑Game Planning, Risk, and Long‑Term Optimization (Ages 25–40 Slice)

**Player actions**
- Zooms out to **longer horizons** (5–10 years) using fast-forward simulations.
- Tunes higher-level strategic levers:
  - Asset allocation between **stocks, bonds, real estate**.
  - Aggressiveness of **debt payoff vs. investing**.
  - Lifestyle upgrades/downgrades (moving, car changes, social spending).
- Evaluates **riskier options**:
  - Starting a business or side gig, with time and capital commitments.
  - Relocating to different tax/cost-of-living regions.
- Monitors **Happiness and Burnout** meters to avoid TU efficiency collapse.

**Game actions**
- Runs the deterministic, seed‑driven simulation core for multi‑year projections.
- Applies stochastic **market volatility**, **inflation**, and **event probabilities** scaled by difficulty.
- Continues to enforce rules from `Plan.md`:
  - Skill Decay if neglected.
  - Debt compounding and delinquency events.
  - Insurance reducing event variance.
- Updates a set of **summary metrics**: Human Capital Index, Risk‑Adjusted Returns, Debt Discipline, long‑term Happiness.
- Logs **achievements** such as “First 100k Net Worth”, “Debt-Free”, “First Home”, “Balanced Life”, etc.

---

## Endgame Arc (Retirement and Final Evaluation)

Although play can stretch well beyond an hour in real time, the **endgame** follows the design in `Plan.md`:

**Player actions**
- Chooses a **retirement age** (or reaches a forced retirement cutoff like 65).
- Decides whether to **wind down risk** in investments as retirement nears.
- Makes final lifestyle choices (downsizing housing, legacy goals, charitable giving).

**Game actions**
- Computes the final **Net Worth** using:
  - $\text{Net Worth} = (\sum \text{Investments} + \sum \text{Cash} + \text{Real Estate Value}) - (\sum \text{Loans} + \sum \text{Credit Card Debt})$
- Presents a **detailed breakdown screen**:
  - Assets by type (cash, investments, real estate).
  - Liabilities (student loans, mortgage, revolving credit).
  - How early **Human Capital investments** (skills, aptitudes, interest evolution) contributed to lifetime earnings.
  - How **Financial Capital** decisions (saving, debt management, risk taking) compounded.
- Shows secondary scores: **Human Capital Index**, **Risk-Adjusted Return**, **Debt Discipline**, **Average Happiness**.
- Displays achieved badges and milestones, and optionally compares to seeded leaderboards for this difficulty/seed.

This experience timeline is intended to be a **playable narrative mirror of `Plan.md`**, preserving the same systems (aptitudes, interest evolution, skill decay, jobs, negotiations, debt, investments) while showing exactly what the player and game are doing across the early years and into full career life.