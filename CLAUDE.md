# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Investment Tracker — a Vue 3 + TypeScript SPA that displays a dashboard of investment portfolio data from a local `investments.json` file (gitignored). Uses Brazilian Real (BRL) currency formatting throughout.

## Commands

```bash
yarn dev           # Start dev server
yarn build         # Type-check + production build
yarn test:unit     # Run unit tests (Vitest)
yarn lint          # Run both oxlint and eslint sequentially
yarn format        # Format with Prettier
yarn type-check    # Run vue-tsc type checking
yarn build && firebase deploy --only hosting  # Build and deploy to Firebase Hosting
```

## Architecture

- **State management**: Pinia store (`src/stores/investments.ts`) — loads data from `investments.json`, manages institution/period filters, exposes computed `filteredInstitutions`
- **Types**: `src/types/investment.ts` — `InvestmentRecord` (date, before/after amounts) and `InstitutionData` (institution name + records)
- **Routing**: Single route `/` → `DashboardView`
- **Components**: `DashboardHeader`, `PeriodFilter`, `InstitutionFilter`, `InvestmentChart` (Chart.js), `InvestmentTable`
- **Path alias**: `@` → `./src` (configured in both Vite and tsconfig)

## Code Style

- No semicolons, single quotes, 100-char line width, 2-space indent
- Linting runs oxlint first, then eslint (both with auto-fix)
- Prettier is integrated with eslint via skip-formatting config
- Vue 3 Composition API with `<script setup lang="ts">`

## Testing

- Vitest with jsdom environment
- Tests live in `src/**/__tests__/` directories
- Run a single test file: `yarn vitest run src/__tests__/App.spec.ts`
