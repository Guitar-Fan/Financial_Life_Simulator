/**
 * Finance Glossary - Plain English definitions for young/new investors
 *
 * Every term is written so a 14-year-old with zero finance background
 * can understand it on first read. Includes emoji icons for visual
 * anchoring and real-world analogies.
 */

const financeGlossary = {
  /* ── Market Basics ──────────────────────────────────── */
  stock: {
    term: 'Stock',
    emoji: '📊',
    short: 'A tiny piece of ownership in a company.',
    long: `When you buy a stock, you own a small slice of that company — like owning one piece of a huge pizza. If the company does well, your slice becomes more valuable. Companies sell stocks to raise money so they can grow.`,
    analogy: 'Imagine a lemonade stand splits itself into 100 equal tickets. Each ticket is one "share" of the business.',
  },
  share: {
    term: 'Share',
    emoji: '🎟️',
    short: 'One single unit of stock.',
    long: `A share is the smallest unit you can normally buy. If a company has 1 million shares and you own 100, you hold 0.01% of the company.`,
    analogy: 'Think of shares like individual slices of a pizza. Together they make up the whole pie (the company).',
  },
  ticker: {
    term: 'Ticker Symbol',
    emoji: '🏷️',
    short: 'A short nickname for a company on the stock market.',
    long: `Every publicly traded company gets a unique short code. For example, Apple is "AAPL" and Google is "GOOGL". It's like a username for the company on Wall Street.`,
    analogy: 'Just like your gamer tag is a short name that represents you online, a ticker symbol is a company\'s short name on the market.',
  },
  portfolio: {
    term: 'Portfolio',
    emoji: '💼',
    short: 'All the investments you own, collected together.',
    long: `Your portfolio is like your entire collection of stocks, bonds, and other investments. Keeping different types of investments in your portfolio is called "diversification" — it helps reduce risk.`,
    analogy: 'Think of it like your music playlist — it should have a good mix so you enjoy it no matter your mood.',
  },
  market: {
    term: 'Stock Market',
    emoji: '🏛️',
    short: 'A place where people buy and sell stocks.',
    long: `The stock market is like a giant online marketplace, except instead of buying clothes or games, people trade pieces of companies. Big stock markets include the NYSE (New York Stock Exchange) and NASDAQ.`,
    analogy: 'It\'s like an online marketplace, but instead of sneakers and phones, people trade ownership of companies.',
  },
  bull_market: {
    term: 'Bull Market',
    emoji: '🐂',
    short: 'When stock prices are going up overall.',
    long: `A bull market means most stocks are rising in value and investors feel optimistic. The "bull" charges upward — that's how to remember it.`,
    analogy: 'Think of a bull thrusting its horns UP — that means prices are going up!',
  },
  bear_market: {
    term: 'Bear Market',
    emoji: '🐻',
    short: 'When stock prices are falling overall.',
    long: `A bear market means most stocks are losing value and investors feel worried. The "bear" swipes its paws DOWN — that's how to remember it.`,
    analogy: 'A bear swipes DOWN with its paws — prices are going down.',
  },

  /* ── Trading Actions ─────────────────────────────────── */
  buy: {
    term: 'Buy',
    emoji: '🟢',
    short: 'Purchasing shares of a stock.',
    long: `When you buy shares, you spend cash to get ownership of part of a company. You hope the price goes up so you can sell later for a profit.`,
    analogy: 'Like buying a rare trading card — you hope it becomes more valuable over time.',
  },
  sell: {
    term: 'Sell',
    emoji: '🔴',
    short: 'Giving up your shares in exchange for cash.',
    long: `When you sell, you trade your stock shares back for money. If the price is higher than what you paid, you makes a profit. If it\'s lower, you take a loss.`,
    analogy: 'Like selling your trading card to someone else. You hope to sell for more than you paid!',
  },
  position: {
    term: 'Position',
    emoji: '📍',
    short: 'The stocks you currently own in a company.',
    long: `Your "position" in a stock describes how many shares you own and at what average price. An "open position" means you currently own shares; a "closed position" means you sold them.`,
    analogy: 'Your position is like your spot in a board game — it shows where you stand with that stock.',
  },

  /* ── Order Types ─────────────────────────────────────── */
  market_order: {
    term: 'Market Order',
    emoji: '⚡',
    short: 'Buy or sell RIGHT NOW at the current price.',
    long: `A market order says "I want this stock immediately, and I'll pay whatever the current price is." It's the fastest way to trade, but you might pay slightly more (or receive slightly less) than the price you see on screen.`,
    analogy: 'Like walking into a store and buying something at the sticker price, no negotiation.',
  },
  limit_order: {
    term: 'Limit Order',
    emoji: '🎯',
    short: 'Buy or sell only at the price YOU choose (or better).',
    long: `A limit order lets you set the maximum price you're willing to pay (when buying) or the minimum price you'll accept (when selling). The trade only happens if the market reaches your price. It might never happen if the price doesn't reach your target.`,
    analogy: 'Like telling a friend "I\'ll buy that game, but only if it drops to $20 or less."',
  },
  stop_order: {
    term: 'Stop Order (Stop-Loss)',
    emoji: '🛑',
    short: 'Automatically sell if the price drops to a certain point.',
    long: `A stop order is like a safety net. You set a price, and if the stock falls to that price, it automatically becomes a market order to sell. This helps limit how much money you could lose. However, in a fast-falling market, you might sell for slightly less than your stop price.`,
    analogy: 'Like setting an alarm. "If this stock drops to $45, wake me up and sell it!"',
  },
  stop_limit_order: {
    term: 'Stop-Limit Order',
    emoji: '🛑🎯',
    short: 'A safety net with a price floor.',
    long: `A stop-limit order combines two ideas: a stop price that triggers the order, and a limit price that prevents selling below a minimum. It gives you more control but the downside is the order might not execute if the price drops too fast past your limit.`,
    analogy: 'Like saying "Sell my sneakers if offers drop to $50, but never accept less than $45."',
  },

  /* ── Pricing Concepts ────────────────────────────────── */
  bid: {
    term: 'Bid Price',
    emoji: '🟢',
    short: 'The highest price someone is willing to PAY for a stock right now.',
    long: `The bid is the best price a buyer is currently offering. If you want to sell immediately, this is roughly what you'll receive. Think of it as "what buyers are willing to pay right now."`,
    analogy: 'At an auction, the bid is the highest amount someone has offered so far.',
  },
  ask: {
    term: 'Ask Price',
    emoji: '🔴',
    short: 'The lowest price someone is willing to SELL a stock for right now.',
    long: `The ask (also called the "offer") is the lowest price at which someone is willing to sell their shares. If you want to buy immediately, this is roughly what you'll pay.`,
    analogy: 'It\'s like a sticker price on a product — the lowest price the seller is willing to accept.',
  },
  spread: {
    term: 'Bid-Ask Spread',
    emoji: '↔️',
    short: 'The gap between the bid and ask price.',
    long: `The spread is the difference between the highest buying price and the lowest selling price. A small spread (like $0.01) means the stock is very popular and easy to trade. A wide spread means fewer people are trading it, and it costs more to buy/sell.`,
    analogy: 'Imagine a pawn shop offers $80 for a guitar but sells it for $100. That $20 gap is the "spread."',
  },
  slippage: {
    term: 'Slippage',
    emoji: '🧊',
    short: 'When you end up paying slightly more (or receiving less) than expected.',
    long: `Slippage happens because prices change in the milliseconds between clicking "buy" and the trade going through. It's usually tiny, but in fast-moving markets or with large orders, it can add up. Measured in "basis points" (bps) — 1 bps = 0.01%.`,
    analogy: 'Like trying to catch a ball on a slippery field — you reach for it at one spot but it slides a little farther.',
  },

  /* ── Order Book ──────────────────────────────────────── */
  order_book: {
    term: 'Order Book',
    emoji: '📖',
    short: 'A live list of all the buy and sell orders waiting to be filled.',
    long: `The order book shows you all the pending limit orders from buyers and sellers. Green rows are "bids" (people wanting to buy), red rows are "asks" (people wanting to sell). The depth of the book tells you how much demand exists at different price levels.`,
    analogy: 'Think of it like a scoreboard showing all the offers people have placed, organized by price.',
  },
  volume: {
    term: 'Volume',
    emoji: '📊',
    short: 'How many shares were traded in a given time period.',
    long: `Volume shows trading activity. High volume means lots of people are buying and selling — the stock is popular and it's easy to trade. Low volume means fewer trades, which can make it harder to buy or sell quickly.`,
    analogy: 'It\'s like view counts on a video — high volume means it\'s trending.',
  },
  liquidity: {
    term: 'Liquidity',
    emoji: '💧',
    short: 'How easy it is to buy or sell without affecting the price.',
    long: `A liquid stock has lots of buyers and sellers, so you can trade quickly at fair prices. An illiquid stock has fewer traders, meaning your order might move the price or take a while to fill.`,
    analogy: 'Water flows easily (liquid). Honey flows slowly (illiquid). You want your stocks to trade like water, not honey.',
  },

  /* ── Charts ──────────────────────────────────────────── */
  candlestick: {
    term: 'Candlestick',
    emoji: '🕯️',
    short: 'A chart bar showing the open, high, low, and closing price for a time period.',
    long: `Each candlestick represents one time period (like a day). The thick body shows the opening and closing prices. The thin lines (wicks) show the highest and lowest prices reached. GREEN means the price went UP, RED means it went DOWN.`,
    analogy: 'Each candle tells a mini-story: "The stock started here, went as high as here, as low as here, and ended here."',
  },
  ohlc: {
    term: 'O / H / L / C',
    emoji: '📈',
    short: 'Open, High, Low, Close — the four key prices for a time period.',
    long: `O = Opening price (where the stock started)\nH = High (the highest price reached)\nL = Low (the lowest price reached)\nC = Close (where the stock ended)\n\nThese four numbers tell you the complete price story for any time period.`,
    analogy: 'Like a sports game summary: the starting score, the biggest lead, the biggest deficit, and the final score.',
  },

  /* ── Financial Results ───────────────────────────────── */
  profit_loss: {
    term: 'Profit & Loss (P&L)',
    emoji: '💰',
    short: 'How much money you\'ve made or lost.',
    long: `P&L stands for Profit and Loss. It's the difference between what you paid for your stocks and what they're worth now (or what you sold them for). Green/positive = profit, Red/negative = loss.`,
    analogy: 'It\'s your scorecard — are you winning or losing money?',
  },
  unrealized_pl: {
    term: 'Unrealized P&L',
    emoji: '📋',
    short: 'Profit or loss on stocks you still own (haven\'t sold yet).',
    long: `"Unrealized" means you haven't locked in the result yet because you haven't sold. The stock might go up or down tomorrow. It only becomes "real" (realized) when you sell.`,
    analogy: 'If you own a baseball card worth $500 but haven\'t sold it, that $500 is only on paper — it\'s unrealized until you sell.',
  },
  realized_pl: {
    term: 'Realized P&L',
    emoji: '✅',
    short: 'Profit or loss that is locked in because you actually sold.',
    long: `Realized P&L is the actual money you've made or lost from completed trades. Buy at $50, sell at $60 = realized profit of $10 per share.`,
    analogy: 'You actually sold the baseball card for $500 — that money is real and in your pocket.',
  },
  cost_basis: {
    term: 'Cost Basis (Avg Cost)',
    emoji: '🏷️',
    short: 'The average price you paid for your shares.',
    long: `If you bought 10 shares at $100 and later 10 more at $120, your average cost basis is $110 per share. This matters for calculating profit and taxes.`,
    analogy: 'If you bought two of the same game at different prices, you\'d average them to understand what you "really" paid.',
  },
  market_value: {
    term: 'Market Value',
    emoji: '💎',
    short: 'What your stocks are worth right now at today\'s prices.',
    long: `Market value = number of shares × current price. This changes constantly as prices move throughout the trading day.`,
    analogy: 'It\'s like checking the current price of your collectible cards on an app — that\'s what they\'re worth today.',
  },

  /* ── Taxes ───────────────────────────────────────────── */
  revenue: {
    term: 'Revenue',
    emoji: '💵',
    short: 'The total money a company earns from selling its products or services.',
    long: `Revenue is the "top line" — the grand total of all sales before subtracting costs. A lemonade stand that sold 100 cups at $2 each has $200 in revenue, even if lemons and sugar cost$50.`,
    analogy: 'It\'s like the total amount of money in your cash register before paying for supplies.',
  },
  gross_margin: {
    term: 'Gross Margin',
    emoji: '📊',
    short: 'The percentage of revenue left after paying for the product itself.',
    long: `Gross margin shows how much of each dollar of sales a company keeps after paying to make the product. A 70% gross margin means for every dollar earned, 70 cents is left after direct costs. Higher is usually better!`,
    analogy: 'If you sell bracelets for $10 and the beads cost $3, your gross margin is 70% — you keep $7 per bracelet.',
  },
  capital_gains: {
    term: 'Capital Gains',
    emoji: '💸',
    short: 'The profit you make when you sell something for more than you paid.',
    long: `When you sell a stock for more than you bought it, the profit is called a "capital gain." The government taxes this profit. HOW MUCH you pay in tax depends on how long you held the stock.`,
    analogy: 'If you buy a used bike for $50 and sell it for $80, your capital gain is $30.',
  },
  short_term_gains: {
    term: 'Short-Term Capital Gains',
    emoji: '⏱️',
    short: 'Profit from stocks held 1 year or less — taxed heavily!',
    long: `If you sell a stock within a year of buying it, the profit is "short-term." The government treats this like regular income and can tax it up to 37%. This is why quick trading can eat into your profits significantly.`,
    analogy: 'Quick flips get taxed the most — like paying full price when you\'re impatient.',
  },
  long_term_gains: {
    term: 'Long-Term Capital Gains',
    emoji: '🕐',
    short: 'Profit from stocks held over 1 year — taxed at a lower rate!',
    long: `If you hold a stock for more than a year before selling, you get a much better tax rate — usually 15% instead of up to 37%. This is the government rewarding patient investors!`,
    analogy: 'Patience pays off — like getting a loyalty discount for being a long-time customer.',
  },
  tax_lot: {
    term: 'Tax Lot',
    emoji: '📦',
    short: 'A record of each time you bought shares, used for calculating taxes.',
    long: `Every time you buy shares, a "tax lot" is created recording the date and price. When you sell, the IRS needs to know WHICH shares you're selling to figure out your gain/loss. The order matters!`,
    analogy: 'Like receipts in a shoebox — each one shows when you bought something and how much you paid.',
  },
  wash_sale: {
    term: 'Wash Sale',
    emoji: '🚿',
    short: 'A rule that blocks you from claiming a tax loss if you buy back too quickly.',
    long: `If you sell a stock at a loss and buy the same stock back within 30 days, the IRS says "nice try" and won't let you count that loss on your taxes. The rule exists to prevent people from gaming the tax system.`,
    analogy: 'It\'s like returning a purchase for a refund, then immediately buying it again on sale — the store catches on!',
  },
  fifo: {
    term: 'FIFO (First In, First Out)',
    emoji: '1️⃣',
    short: 'When selling, the oldest shares you bought are sold first.',
    long: `FIFO means the first shares you bought are the first ones sold. This is the default method for tax purposes. If your earliest shares have the lowest cost basis, FIFO might mean paying more in taxes.`,
    analogy: 'Like a grocery store shelf — the oldest products at the front get sold first.',
  },

  /* ── IPO Concepts ────────────────────────────────────── */
  ipo: {
    term: 'IPO (Initial Public Offering)',
    emoji: '🎉',
    short: 'When a company sells its stock to the public for the very first time.',
    long: `An IPO is like a company's "grand opening" on the stock market. Before an IPO, only private investors (like the founders and venture capitalists) own the company. After the IPO, anyone can buy shares.`,
    analogy: 'Think of it like a small bakery that was private, now opening a franchise that anyone can invest in.',
  },
  s1_prospectus: {
    term: 'S-1 Prospectus',
    emoji: '📝',
    short: 'A detailed document a company files before going public.',
    long: `The S-1 is like a giant "about me" page that companies must file with the SEC (Securities and Exchange Commission). It includes everything: what the company does, how much money it makes (or loses), what the risks are, and how it plans to use the money raised. Always read the Risk Factors section!`,
    analogy: 'Like reading the full description and reviews before buying a product online — you want to know what you\'re getting into.',
  },
  ioi: {
    term: 'IOI (Indication of Interest)',
    emoji: '✋',
    short: 'A request to buy shares in an upcoming IPO (not guaranteed!).',
    long: `When you submit an IOI, you're raising your hand and saying "I'd like to buy shares!" But it's NOT a guaranteed order. If the IPO is popular (oversubscribed), you'll probably get way fewer shares than you asked for — or none at all.`,
    analogy: 'Like signing up for a raffle — just because you entered doesn\'t mean you\'ll win.',
  },
  oversubscribed: {
    term: 'Oversubscribed',
    emoji: '🔥',
    short: 'More people want to buy shares than are available.',
    long: `When an IPO is "oversubscribed," demand exceeds supply. If 10x oversubscribed, there are 10 buyers for every available share. This usually means you'll get a small fraction of what you requested, and the stock might "pop" (jump up) on its first trading day.`,
    analogy: 'Like a limited-edition sneaker drop where 10,000 people sign up for 1,000 pairs.',
  },
  allocation: {
    term: 'Allocation',
    emoji: '🎫',
    short: 'The number of IPO shares you actually receive.',
    long: `If an IPO is popular, you won't get all the shares you requested. Your "allocation" is what you actually receive. Big institutional investors usually get most of the shares; regular (retail) investors get a smaller portion.`,
    analogy: 'You ordered 100 concert tickets but only got 5 because so many people wanted them.',
  },
  underwriter: {
    term: 'Underwriter',
    emoji: '🏦',
    short: 'The bank that helps a company go public and sets the IPO price.',
    long: `Underwriters are big investment banks (like Goldman Sachs or Morgan Stanley) that manage the IPO process. They help decide the price, find buyers, and guarantee the company will raise the money. They take a percentage as their fee.`,
    analogy: 'Like a real estate agent who helps you sell your house — they find buyers and handle the paperwork.',
  },

  /* ── Account Concepts ────────────────────────────────── */
  cash: {
    term: 'Cash Balance',
    emoji: '💵',
    short: 'Money in your account that you can use to buy stocks.',
    long: `This is the money available for trading. When you buy stocks, cash goes down. When you sell stocks, cash goes up. Keep some cash in reserve so you can jump on opportunities!`,
    analogy: 'Like the money in your wallet — it\'s ready to be spent.',
  },
  total_value: {
    term: 'Total Value',
    emoji: '🏆',
    short: 'Your cash + the current market value of all your stocks.',
    long: `Total value = Cash + Portfolio value. This is the big picture number that shows your overall wealth in the simulator. Your goal is to grow this number!`,
    analogy: 'If you have $50 in your wallet and a phone worth $200, your total value is $250.',
  },
  diversification: {
    term: 'Diversification',
    emoji: '🌈',
    short: 'Spreading your money across different stocks to reduce risk.',
    long: `"Don't put all your eggs in one basket." If you invest in only one company and it crashes, you lose everything. But if you own 10 different stocks across different industries, one bad stock won't ruin you.`,
    analogy: 'If you only planted one type of crop, a single disease could wipe it all out. Plant many types and you\'re safer.',
  },

  /* ── Fees & Costs ────────────────────────────────────── */
  commission: {
    term: 'Commission',
    emoji: '🏪',
    short: 'A fee you pay to a broker for executing your trade.',
    long: `Most modern brokers (like Robinhood) charge $0 commission. But this "free" trading has costs — the broker makes money from things like payment for order flow. In this simulator, commissions are $0 to match modern reality.`,
    analogy: 'Like a delivery fee when ordering food — it\'s the cost of having someone handle your order.',
  },
  basis_points: {
    term: 'Basis Points (bps)',
    emoji: '🔬',
    short: 'A tiny unit of measurement: 1 basis point = 0.01%.',
    long: `Finance people use basis points because percentage changes can be really small. "The spread widened by 5 bps" means it increased by 0.05%. It may sound tiny, but on millions of dollars, it adds up fast! 100 basis points = 1%.`,
    analogy: 'If percentages are like dollars, basis points are like pennies — small but they add up.',
  },

  /* ── Game Concepts ───────────────────────────────────── */
  playback_speed: {
    term: 'Playback Speed',
    emoji: '⏩',
    short: 'How fast time moves in the simulation.',
    long: `The simulation replays real market data. At 1x speed, time passes normally. At 10x, ten seconds of real time compress into one. Speed it up to skip boring periods, or slow down when things get exciting!`,
    analogy: 'Like the fast-forward button on a video — speeds up the boring parts.',
  },
  simulation: {
    term: 'Simulation',
    emoji: '🎮',
    short: 'A safe practice environment that mimics the real stock market.',
    long: `Everything here uses virtual money and real historical data. You can't lose real money! The goal is to learn how the stock market works so you're prepared when you invest for real someday.`,
    analogy: 'Like a flight simulator for pilots — it feels real, but you\'re safe to make mistakes and learn.',
  },

  /* ── Chart Patterns / Reading ─────────────────────────── */
  trend: {
    term: 'Trend',
    emoji: '📈',
    short: 'The general direction a stock price is moving over time.',
    long: `Uptrend = prices generally going up (higher highs, higher lows).\nDowntrend = prices generally going down (lower highs, lower lows).\nSideways = prices bouncing in a range without a clear direction.\n\n"The trend is your friend" is a popular saying — it's usually easier to go with the trend than against it.`,
    analogy: 'Like the slope of a hill — is the path going uphill, downhill, or flat?',
  },
};

export default financeGlossary;

/**
 * Lookup helper: find glossary entries by keyword match
 */
export function searchGlossary(query) {
  const q = query.toLowerCase();
  return Object.entries(financeGlossary)
    .filter(([key, entry]) =>
      key.includes(q) ||
      entry.term.toLowerCase().includes(q) ||
      entry.short.toLowerCase().includes(q)
    )
    .map(([key, entry]) => ({ key, ...entry }));
}

/**
 * Get a single glossary entry by key
 */
export function getGlossaryEntry(key) {
  return financeGlossary[key] || null;
}
