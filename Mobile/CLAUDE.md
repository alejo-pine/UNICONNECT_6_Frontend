# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

UniConnect is a React Native / Expo mobile app for Universidad de Caldas students. It enables peer discovery, study group management, messaging, and event browsing.

## Commands

```bash
npx expo start               # Start dev server
npx expo start --clear       # Start with cleared cache (use when modules misbehave)
npx expo lint                # ESLint
npx expo doctor              # Check project health and dependency compatibility
npx expo install <pkg>       # Install with correct peer-compatible version
npx expo install --fix       # Auto-fix invalid package versions

# Platform-specific dev
npx expo start --android
npx expo start --ios

# EAS builds
npx eas-cli@latest build --profile development --platform android
npx eas-cli@latest build --profile preview --platform android
npx eas-cli@latest build --platform android -s   # production + submit
```

There are no automated tests. Manual testing is done via Expo Go or development builds scanned via QR code.

## Architecture

**Stack:** React Native 0.81 + Expo SDK 54, TypeScript strict, Expo Router 6 (file-based), Zustand 5, Axios, Socket.io-client, Supabase JS 2.x.

### Directory layout

```
app/                  # Expo Router routes (screens as files)
src/
  features/           # Feature modules (auth, profile, chat, groups, events, search, onboarding)
  services/           # HTTP + socket API clients
  store/              # Zustand global stores
  hooks/              # Shared custom hooks
  components/         # Shared UI components
  theme/              # colors.ts + ThemeContext
assets/               # Images, fonts
```

Each feature under `src/features/<name>/` follows: `screens/` → `components/` → `hooks/` → `types/`.

### Navigation

Expo Router with a **Drawer** as the primary navigation shell (not tabs). Main routes:

- `/(tabs)/` — Home, Explore, Profile, Events (drawer items)
- `/chat/inbox`, `/chat/[id]` — Messaging
- `/study-groups/` — Study groups
- `/(onboarding)/welcome` — First-launch profile completion
- `/public-profile/[id]`, `/profile/edit` — User profiles

Use `router`, `Link`, and `useLocalSearchParams` from `expo-router`. Typed routes are enabled.

### State management

Two Zustand stores in `src/store/`:

- **authStore.ts** — `userId`, `token`, `needsOnboarding`, `onboardingResolved`. Persists to `expo-secure-store`. `hydrateSession()` is called on app launch; `AppState` listener re-validates on foreground.
- **chatStore.ts** — `conversations[]`, `messages[]`, loading flags. Integrates Socket.io for real-time updates and does optimistic message inserts.

### API layer (`src/services/`)

| File | Transport | Purpose |
|------|-----------|---------|
| `api.ts` | — | Base URL config. In dev, auto-detects machine IP via `Constants.expoConfig.hostUri`. Falls back to `EXPO_PUBLIC_API_BASE_URL` (port 3001) and `EXPO_PUBLIC_CHAT_SERVICE_URL` (port 3004). |
| `profileHttpService.ts` | Fetch + FormData | Profile CRUD, avatar upload, subjects |
| `chatApi.ts` | Axios (with auth interceptor) | Conversation list, message history |
| `chatSocket.ts` | Socket.io | Real-time send/receive |
| `supabase.ts` | Supabase SDK | Chat attachment file storage |

Services return `{ success, data?, error? }` wrapper objects. A `parseError()` utility normalizes error shapes. Auth failures (401/403) trigger automatic logout.

### Environment variables

Create `.env` at project root:

```env
EXPO_PUBLIC_API_BASE_URL=http://<backend-host>:3001
EXPO_PUBLIC_CHAT_SERVICE_URL=http://<backend-host>:3004
EXPO_PUBLIC_API_TOKEN=<backend-token>
EXPO_PUBLIC_SUPABASE_URL=<supabase-url>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<supabase-anon-key>
EXPO_PUBLIC_TEST_USER_ID=<test-user-id>
```

In development, `api.ts` will override the base URL with the Expo dev server host automatically.

### Theme

`src/theme/colors.ts` defines the palette:
- Primary blue: `#00284D`
- Gold accent: `#C5A059`
- Light BG: `#F8F9FA` / Dark BG: `#0F172A`

`ThemeContext` wraps the app; components consume `useColorScheme()` for dark/light mode support.

## Key conventions

- All new code in TypeScript. Import types with `import type`.
- Navigation: never use `react-navigation` directly — always `expo-router`.
- Images: use `expo-image` not `<Image>` from react-native.
- Animations: `react-native-reanimated` (runs on native thread).
- After installing any native module or config plugin, a new development build is required — Expo Go won't work.

## Expo documentation (AI-optimized)

- General: https://docs.expo.dev/llms-full.txt
- EAS / deployment: https://docs.expo.dev/llms-eas.txt
- SDK reference: https://docs.expo.dev/llms-sdk.txt
