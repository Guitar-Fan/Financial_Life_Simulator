# Cloudflare Pages Deployment (All Projects)

This repository can be deployed from the root as a single Pages site.

## Build Settings

- Framework preset: `None`
- Root directory: `/`
- Build command: `npm run build`
- Build output directory: `dist`
- Build system version: `3 (latest)`

## What `npm run build` does

The root build script [scripts/build-all.mjs](scripts/build-all.mjs):

1. Creates a fresh [dist](dist) folder.
2. Copies all top-level static simulation pages into `dist/`.
3. Copies shared runtime folders (`assets/`, `js/`) into `dist/`.
4. Builds [stock-simulator](stock-simulator) with Vite.
5. Copies `stock-simulator/dist` into `dist/stock-simulator`.

## Entrypoints After Deployment

- Hub page: [index.html](index.html)
- Bakery game: [main.html](main.html)
- Investnopoly: [INVESTORPOLY.html](INVESTORPOLY.html)
- Stock Simulator: [stock-simulator/index.html](stock-simulator/index.html)
- Map scene: [Map.html](Map.html)
- Tax policy simulator: [tax_policy_simulator.html](tax_policy_simulator.html)
- Tax life journey: [tax_life_journey.html](tax_life_journey.html)
- 2D bakery environment: [2dbakeryenvironment.html](2dbakeryenvironment.html)

## Notes

- [misty-wildflower-0076](misty-wildflower-0076) is a separate Cloudflare Workers/Agents app and should be deployed independently with Wrangler.
- If your Pages project previously failed on missing root `package.json`, this setup fixes that by adding a root build manifest.
