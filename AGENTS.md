# Agent Instructions (UniConnect)

This repository contains two main frontends for the **UniConnect** project (Universidad de Caldas):
1. **`Mobile/`**: An Expo / React Native mobile application.
2. **`Dashboard/`**: A React 19 / Vite web application.

## 🏗️ Repository Structure & Setup

This is **not** a traditional monorepo using npm workspaces. Each application manages its own dependencies independently. **You must `cd` into the respective directory to run commands.**

- **To work on Mobile:** `cd Mobile && npm install`
- **To work on Dashboard:** `cd Dashboard && npm install`
- **Important Note:** The root README mentions running `npm run fix` if prompted after install. This likely refers to `npm audit fix` (do NOT run with `--force`).

## 📱 Mobile App (`Mobile/`)

The mobile app is thoroughly documented in its own directory. **When working on the mobile app, you must consult these files first:**
- [`Mobile/AGENTS.md`](Mobile/AGENTS.md) - Contains strict architectural guidelines, commands, documentation URLs, and code standards.
- [`Mobile/CLAUDE.md`](Mobile/CLAUDE.md) - Contains project overview, stack details, API endpoints configuration, and directory layout.

*Key takeaways:* Expo Router (file-based routing), Zustand, strictly typed, `expo-image`, reanimated.

## 💻 Dashboard App (`Dashboard/`)

The Dashboard is a modern React Web App.

### Stack & Config
- **Framework:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS + `clsx`. The config (`tailwind.config.js`) includes a specific design system with custom color tokens: `brand`, `gold`, `ink`, and `error`. Use these instead of arbitrary colors.
- **Path Aliases:** Vite and TypeScript are configured with `@/`, `@features/`, and `@shared/` mapped to `src/`.
- **State Management:** Zustand 5
- **Routing:** React Router DOM v6
- **Backend/Auth Integration:** Auth0, Supabase JS 2.x, Axios, Socket.io-client

### Architecture & Directories
Follows a feature-sliced design:
```text
Dashboard/src/
├── features/     # Feature-specific modules (auth, chat, groups, onboarding, profile)
├── shared/       # Shared UI components and utilities
├── routes/       # React Router configurations
├── assets/       # Static assets
└── __tests__/    # Vitest testing files
```

### Commands (`Dashboard/`)
*(Run these from inside the `Dashboard/` directory)*
- **Start Dev Server:** `npm run dev`
- **Build:** `npm run build` (Runs `tsc -b && vite build`)
- **Linting:** `npm run lint` (ESLint)
- **Unit Tests:** `npm run test` (Runs Vitest once) or `npm run test:watch` (Watch mode)
- **E2E Tests:** `npm run test:e2e` (Playwright)

### Testing & Verification Quirks
- **Vitest:** Configured for unit testing (`jsdom` environment) with `src/test-setup.ts`.
- **Playwright:** E2E flows are located in `Dashboard/e2e/`. **Note:** By default, `playwright.config.ts` targets the production URL (`https://uniconnect-web.fly.dev`).
- **Audit Script:** The script `Dashboard/run-audit-frontend.sh` is used for automated grading/auditing of the project. If modifying core configuration or structural elements, ensure you don't break the rules enforced by this script (like TypeScript compilation and file structure).

## 🤖 General Rules for Agents
- **Context Boundaries:** Maintain the clear boundary between the two apps. Mobile uses `expo-router` while Dashboard uses `react-router-dom`.
- **Executable configuration > Prose:** Always rely on `package.json`, `vite.config.ts`, `playwright.config.ts` and `vitest.config.ts` to understand how the project is built and tested.
- **TypeScript First:** Ensure strict type checking across both projects. Do not introduce `any` types unnecessarily.
- **Styling:** Dashboard relies heavily on Tailwind CSS. Avoid introducing external CSS files or styled-components unless already established in a specific component.
