# Financial Life Simulator

## finworldsimgames.pages.dev

Financial Life Simulator is a small universe of games built to make money decisions feel practical, not abstract.

Instead of reading long theory first, you can jump into different scenarios and learn by doing: run a business, react to markets, and think long-term about strategy.

## The 3 Games

### 1) Bakery Game
- Entry: [main.html](main.html)
- Focus: operations, pricing, staffing, inventory, and customer behavior
- What it teaches: cash flow pressure, margins, and day-to-day business tradeoffs

### 2) Stock Simulator (React)
- Entry: [stock-simulator/index.html](stock-simulator/index.html) in deployed output, or [stock-simulator/dist/index.html](stock-simulator/dist/index.html) when running locally
- Source app: [stock-simulator](stock-simulator)
- Focus: market decisions, volatility, and portfolio discipline
- What it teaches: risk management, timing, and emotional control when prices move

### 3) Investnopoly
- Entry: [INVESTORPOLY.html](INVESTORPOLY.html)
- Focus: long-horizon strategy and capital allocation
- What it teaches: compounding and opportunity cost over repeated choices

## Best Place To Start

Open the project hub at [index.html](index.html).

The hub gives you:
- A clear mission/intention summary
- Direct launch buttons for all 3 games
- Local analytics on page views and game launches (stored in browser localStorage)

## Quick Run Guide

### Static pages
Open these directly in your browser:
- [index.html](index.html)
- [main.html](main.html)
- [INVESTORPOLY.html](INVESTORPOLY.html)

### Stock Simulator dev mode
If you want to run the React app in development:

```bash
cd stock-simulator
npm install
npm run dev
```

### Stock Simulator production build

```bash
cd stock-simulator
npm install
npm run build
```

Then open [stock-simulator/dist/index.html](stock-simulator/dist/index.html).

## Deploy All Projects From Repo Root

This repo now supports a single root build that packages the static pages and the Stock Simulator build into one deploy folder.

```bash
npm install
npm run build
```

Deploy output directory:
- [dist](dist)

Recommended Cloudflare Pages settings:
- Root directory: `/`
- Build command: `npm run build`
- Build output directory: `dist`

## Project Layout (High Level)

- [index.html](index.html): main hub / launcher page
- [main.html](main.html): bakery game entry
- [INVESTORPOLY.html](INVESTORPOLY.html): Investnopoly entry
- [stock-simulator](stock-simulator): React stock simulator app
- [scripts/build-all.mjs](scripts/build-all.mjs): root deployment bundler for all static projects
- [js](js): core JavaScript systems for game logic and scenes
- [assets](assets): shared images and art resources

## Why This Project Exists

This repo is meant to make financial literacy more hands-on.

You can experience how different financial ideas connect:
- Cash flow and operating costs
- Risk and reward under uncertainty
- Compounding from repeated decisions
- Capital allocation when resources are limited

If you are new, start with the hub, play each game for a few minutes, and compare how each one trains a different money skill.